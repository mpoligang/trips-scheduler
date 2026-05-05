import 'server-only';

import { Location } from '@/models/Location';
import { RoutingMode } from '@/models/StageLeg';

const BASE_URL = 'https://api.stadiamaps.com';
const REQUEST_TIMEOUT_MS = 5_000;

const apiKey = process.env.STADIA_API_KEY;
if (!apiKey) {
    // Fail fast: l'assenza della key è un errore di configurazione, non runtime.
    throw new Error('STADIA_API_KEY non configurata');
}

export type StadiaErrorCode = 'rate_limited' | 'bad_request' | 'unauthorized' | 'network' | 'unknown';

export class StadiaError extends Error {
    readonly code: StadiaErrorCode;
    readonly status?: number;
    constructor(code: StadiaErrorCode, message: string, status?: number) {
        super(message);
        this.code = code;
        this.status = status;
    }
}

const mapStatusToCode = (status: number): StadiaErrorCode => {
    if (status === 401 || status === 403) return 'unauthorized';
    if (status === 429) return 'rate_limited';
    if (status >= 400 && status < 500) return 'bad_request';
    return 'unknown';
};

const stadiaFetch = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const url = new URL(path, BASE_URL);
    url.searchParams.set('api_key', apiKey);

    let response: Response;
    try {
        response = await fetch(url.toString(), {
            ...init,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
            headers: {
                'Accept': 'application/json',
                ...(init.body ? { 'Content-Type': 'application/json' } : {}),
                ...init.headers,
            },
        });
    } catch (err: unknown) {
        throw new StadiaError('network', `Stadia network error: ${(err as Error).message}`);
    }

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new StadiaError(mapStatusToCode(response.status), `Stadia ${response.status}: ${body || response.statusText}`, response.status);
    }
    return response.json() as Promise<T>;
};

// ============================================================================
// GEOCODING — autocomplete
// ============================================================================

interface PeliasFeature {
    properties: { label?: string; name?: string };
    geometry: { coordinates: [number, number] }; // [lon, lat]
}

interface PeliasResponse {
    features: PeliasFeature[];
}

const MIN_QUERY_LENGTH = 3;

export interface SearchPlacesOptions {
    focus?: { lat: number; lng: number };
    limit?: number;
}

export const searchPlaces = async (
    query: string,
    options: SearchPlacesOptions = {}
): Promise<Location[]> => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) return [];

    const params = new URLSearchParams({ text: trimmed });
    if (options.focus) {
        params.set('focus.point.lat', String(options.focus.lat));
        params.set('focus.point.lon', String(options.focus.lng));
    }
    if (options.limit) params.set('size', String(options.limit));

    const data = await stadiaFetch<PeliasResponse>(`/geocoding/v1/autocomplete?${params.toString()}`);

    return (data.features || [])
        .filter(f => Array.isArray(f.geometry?.coordinates) && f.geometry.coordinates.length === 2)
        .map(f => ({
            address: f.properties.label || f.properties.name || '',
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
        }));
};

// ============================================================================
// ROUTING — multi-waypoint
// ============================================================================

const COSTING_BY_MODE: Record<RoutingMode, string> = {
    walking: 'pedestrian',
    cycling: 'bicycle',
    driving: 'auto',
    transit: 'multimodal',
};

interface ValhallaLegSummary {
    length: number; // km (con units=kilometers)
    time: number;   // secondi
}

interface ValhallaLeg {
    summary: ValhallaLegSummary;
}

interface ValhallaRouteResponse {
    trip?: {
        legs?: ValhallaLeg[];
    };
}

export interface RouteLeg {
    distance_m: number;
    duration_s: number;
}

/**
 * Calcola tutte le legs tra punti consecutivi in una sola call.
 * Ritorna N-1 elementi per N coordinate.
 */
export const routeMulti = async (
    coords: { lat: number; lng: number }[],
    mode: RoutingMode
): Promise<RouteLeg[]> => {
    if (coords.length < 2) return [];

    // radius=200m è il massimo consentito da Valhalla. Necessario per coordinate
    // che cadono fuori dalla rete pedonale (es. punti di interesse vicini ma non
    // direttamente su un sentiero pedonale): senza questo parametro il default è
    // troppo stretto e lo snapping fallisce con error 442 "No path could be found".
    const body = {
        locations: coords.map(c => ({ lat: c.lat, lon: c.lng, radius: 200 })),
        costing: COSTING_BY_MODE[mode],
        directions_options: { units: 'kilometers' },
    };

    const data = await stadiaFetch<ValhallaRouteResponse>('/route/v1', {
        method: 'POST',
        body: JSON.stringify(body),
    });

    const legs = data.trip?.legs;
    if (legs?.length !== coords.length - 1) {
        throw new StadiaError('unknown', `Stadia route: numero legs inatteso (${legs?.length ?? 0} per ${coords.length} punti)`);
    }

    return legs.map(l => ({
        distance_m: Math.round(l.summary.length * 1000),
        duration_s: Math.round(l.summary.time),
    }));
};
