'use server';

import { createClient } from '@/lib/server';
import { EntityKeys } from '@/utils/entityKeys';
import { revalidatePath } from 'next/cache';
import { routeMulti, StadiaError } from '@/lib/maps/stadia';
import { ROUTING_MODES, RoutingMode } from '@/models/StageLeg';

interface RecomputeDayLegsInput {
    tripId: string;
    date: string; // YYYY-MM-DD
}

const isValidMode = (m: string | null | undefined): m is RoutingMode =>
    typeof m === 'string' && (ROUTING_MODES as string[]).includes(m);

/**
 * Bound della giornata in UTC. Coerente con la convenzione UTC-naive che usiamo
 * per `arrival_date`, `dep_date`, `arr_date` (suffisso Z al salvataggio).
 */
const dayBoundsUTC = (date: string) => {
    const startISO = `${date}T00:00:00Z`;
    const next = new Date(startISO);
    next.setUTCDate(next.getUTCDate() + 1);
    return { startISO, endISO: next.toISOString() };
};

interface DayStage {
    id: string;
    lat: number;
    lng: number;
    arrival_date: string;
}

interface DayTransport {
    id: string;
    dep_date: string | null;
    arr_date: string | null;
}

/**
 * Costruisce i segmenti di stages contigue *non interrotti* da un transport.
 * Ogni segmento di lunghezza N produrrà N-1 legs.
 */
const buildSegments = (stages: DayStage[], transports: DayTransport[], dayStart: number, dayEnd: number): DayStage[][] => {
    type Evt = { kind: 'stage'; stage: DayStage; ts: number } | { kind: 'transport'; ts: number };
    const events: Evt[] = [];

    for (const s of stages) {
        events.push({ kind: 'stage', stage: s, ts: new Date(s.arrival_date).getTime() });
    }

    for (const t of transports) {
        const candidates: number[] = [];
        if (t.dep_date) {
            const ts = new Date(t.dep_date).getTime();
            if (ts >= dayStart && ts < dayEnd) candidates.push(ts);
        }
        if (t.arr_date) {
            const ts = new Date(t.arr_date).getTime();
            if (ts >= dayStart && ts < dayEnd) candidates.push(ts);
        }
        if (candidates.length === 0) continue;
        events.push({ kind: 'transport', ts: Math.min(...candidates) });
    }

    events.sort((a, b) => a.ts - b.ts);

    const segments: DayStage[][] = [];
    let current: DayStage[] = [];
    for (const e of events) {
        if (e.kind === 'stage') {
            current.push(e.stage);
        } else if (current.length > 0) {
            segments.push(current);
            current = [];
        }
    }
    if (current.length > 0) segments.push(current);
    return segments;
};

interface LegRow {
    trip_id: string;
    from_stage_id: string;
    to_stage_id: string;
    mode: RoutingMode;
    distance_m: number;
    duration_s: number;
    provider: string;
}

interface ComputeLegRowsInput {
    tripId: string;
    segments: DayStage[][];
    defaultMode: RoutingMode;
    preferenceByPair: Map<string, RoutingMode>;
}

const resolvePairModes = (
    segment: DayStage[],
    defaultMode: RoutingMode,
    preferenceByPair: Map<string, RoutingMode>,
): RoutingMode[] => {
    const out: RoutingMode[] = [];
    for (let i = 0; i < segment.length - 1; i++) {
        const k = `${segment[i].id}|${segment[i + 1].id}`;
        out.push(preferenceByPair.get(k) ?? defaultMode);
    }
    return out;
};

interface RunBoundary {
    start: number; // primo indice di coppia (incluso)
    end: number;   // ultimo indice di coppia (incluso)
    mode: RoutingMode;
}

const findRunsBySharedMode = (pairModes: RoutingMode[]): RunBoundary[] => {
    const runs: RunBoundary[] = [];
    let i = 0;
    while (i < pairModes.length) {
        const mode = pairModes[i];
        let end = i;
        while (end + 1 < pairModes.length && pairModes[end + 1] === mode) end++;
        runs.push({ start: i, end, mode });
        i = end + 1;
    }
    return runs;
};

const buildRowsFromLegs = (
    tripId: string,
    segment: DayStage[],
    run: RunBoundary,
    legs: { distance_m: number; duration_s: number }[],
): LegRow[] => legs.map((leg, i) => ({
    trip_id: tripId,
    from_stage_id: segment[run.start + i].id,
    to_stage_id: segment[run.start + i + 1].id,
    mode: run.mode,
    distance_m: leg.distance_m,
    duration_s: leg.duration_s,
    provider: 'stadia',
}));

const computeRunRows = async (
    tripId: string,
    segment: DayStage[],
    run: RunBoundary,
): Promise<LegRow[]> => {
    const runCoords = segment.slice(run.start, run.end + 2).map(s => ({ lat: s.lat, lng: s.lng }));
    try {
        const legs = await routeMulti(runCoords, run.mode);
        return buildRowsFromLegs(tripId, segment, run, legs);
    } catch (err) {
        if (err instanceof StadiaError) {
            console.error('Stadia routing skip:', err.code, err.message, { runMode: run.mode });
            return [];
        }
        throw err;
    }
};

/**
 * Per ogni segmento, raggruppa le coppie consecutive con la stessa modalità in
 * un singolo "run" e fa una sola chiamata multi-waypoint per run.
 * Caso comune (tutti default) → 1 call per segmento. Caso peggiore (modalità
 * tutte diverse) → N-1 call per N tappe nel segmento.
 */
async function computeLegRowsForSegments({
    tripId, segments, defaultMode, preferenceByPair,
}: ComputeLegRowsInput): Promise<LegRow[]> {
    const rows: LegRow[] = [];
    for (const segment of segments) {
        if (segment.length < 2) continue;
        const pairModes = resolvePairModes(segment, defaultMode, preferenceByPair);
        const runs = findRunsBySharedMode(pairModes);
        for (const run of runs) {
            rows.push(...await computeRunRows(tripId, segment, run));
        }
    }
    return rows;
}

/**
 * Ricalcola le legs (distanze/tempi non lineari) per una specifica giornata di un viaggio.
 *
 * Strategia (cost-efficient):
 *  1. Cancella tutte le legs della giornata (per quelle stages, indipendente dal mode).
 *  2. Per ogni segmento di stages contigue (non interrotto da un transport), una sola call
 *     multi-waypoint a Stadia che produce N-1 legs in colpo solo.
 *  3. Insert.
 *
 * Idempotente: chiamarla due volte di fila non cambia lo stato finale.
 * Failure-tolerant: se Stadia fallisce, le stages sono già salvate; il client mostrerà
 * la stima haversine come fallback.
 */
export async function recomputeDayLegsAction({ tripId, date }: RecomputeDayLegsInput) {
    const supabase = await createClient();

    const { data: trip, error: tripError } = await supabase
        .from(EntityKeys.tripsKey)
        .select('id, default_routing_mode')
        .eq('id', tripId)
        .maybeSingle();

    if (tripError || !trip) {
        return { success: false, error: 'Trip non trovato' };
    }

    const mode: RoutingMode = isValidMode(trip.default_routing_mode) ? trip.default_routing_mode : 'walking';
    const { startISO, endISO } = dayBoundsUTC(date);

    const { data: stagesData, error: stagesError } = await supabase
        .from(EntityKeys.stagesKey)
        .select('id, lat, lng, arrival_date')
        .eq('trip_id', tripId)
        .gte('arrival_date', startISO)
        .lt('arrival_date', endISO)
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .order('arrival_date', { ascending: true });

    if (stagesError) return { success: false, error: stagesError.message };

    const stages: DayStage[] = (stagesData || []).map(s => ({
        id: s.id as string,
        lat: s.lat as number,
        lng: s.lng as number,
        arrival_date: s.arrival_date as string,
    }));

    const stageIds = stages.map(s => s.id);

    // Wipe legs riferiti a queste stages: lo stato finale verrà rigenerato.
    if (stageIds.length > 0) {
        await supabase
            .from(EntityKeys.stageLegsKey)
            .delete()
            .eq('trip_id', tripId)
            .in('from_stage_id', stageIds);
    }

    if (stages.length < 2) {
        revalidatePath(`/dashboard/trips/${tripId}`);
        return { success: true };
    }

    // Carichiamo tutti i transports del trip (lista tipicamente piccola) e filtriamo in JS.
    // Più semplice e robusto rispetto a una OR query Supabase con compound AND.
    const { data: transportsData } = await supabase
        .from(EntityKeys.transportsKey)
        .select('id, dep_date, arr_date')
        .eq('trip_id', tripId);

    const dayStart = new Date(startISO).getTime();
    const dayEnd = new Date(endISO).getTime();

    const transports: DayTransport[] = (transportsData || []).map(t => ({
        id: t.id as string,
        dep_date: t.dep_date as string | null,
        arr_date: t.arr_date as string | null,
    }));

    const segments = buildSegments(stages, transports, dayStart, dayEnd);

    // Recompute auto (al save di una tappa): tutte le legs vengono calcolate in
    // modalità default trip. Le scelte per-leg dell'utente non sono persistite,
    // quindi qui non c'è nessuna preference da rispettare.
    const rowsToInsert = await computeLegRowsForSegments({
        tripId, segments, defaultMode: mode, preferenceByPair: new Map(),
    });

    if (rowsToInsert.length > 0) {
        const { error: upsertError } = await supabase
            .from(EntityKeys.stageLegsKey)
            .upsert(rowsToInsert, { onConflict: 'from_stage_id,to_stage_id,mode' });
        if (upsertError) return { success: false, error: upsertError.message };
    }

    revalidatePath(`/dashboard/trips/${tripId}`);
    return { success: true };
}

/**
 * Ricalcola tutte le giornate del viaggio. Da invocare quando cambia la modalità di default
 * a livello viaggio. Una sola chiamata Stadia per giorno con stages.
 */
export async function recomputeAllTripLegsAction(tripId: string) {
    const supabase = await createClient();

    const { data: stages } = await supabase
        .from(EntityKeys.stagesKey)
        .select('arrival_date')
        .eq('trip_id', tripId)
        .not('lat', 'is', null);

    const days = new Set<string>();
    for (const s of stages || []) {
        const day = (s.arrival_date as string)?.split('T')[0];
        if (day) days.add(day);
    }

    for (const day of days) {
        await recomputeDayLegsAction({ tripId, date: day });
    }

    return { success: true };
}

interface ComputeLegInput {
    tripId: string;
    fromStageId: string;
    toStageId: string;
    mode: RoutingMode;
}

/**
 * Calcola la leg per una specifica coppia di tappe nella modalità richiesta,
 * se non è già in cache. Nessuna preferenza viene persistita: la scelta
 * dell'utente è solo runtime (state lato client).
 *
 * Cost-efficient: la unique key (from, to, mode) di stage_legs è il livello di cache.
 * Switch verso una modalità già calcolata per la stessa coppia = 0 chiamate Stadia.
 * Prima volta che si seleziona una modalità mai vista per una coppia = 1 chiamata Stadia.
 */
export async function computeLegAction({ tripId, fromStageId, toStageId, mode }: ComputeLegInput) {
    if (!isValidMode(mode)) return { success: false, error: 'Modalità non valida' };

    const supabase = await createClient();

    // Cache hit?
    const { data: existingLeg } = await supabase
        .from(EntityKeys.stageLegsKey)
        .select('id')
        .eq('from_stage_id', fromStageId)
        .eq('to_stage_id', toStageId)
        .eq('mode', mode)
        .maybeSingle();

    if (existingLeg) {
        return { success: true };
    }

    // Cache miss: carichiamo le coordinate delle due tappe e calcoliamo.
    const { data: stages, error: stagesError } = await supabase
        .from(EntityKeys.stagesKey)
        .select('id, lat, lng')
        .in('id', [fromStageId, toStageId]);

    if (stagesError || stages?.length !== 2) {
        return { success: false, error: 'Tappe non trovate' };
    }

    const fromStage = stages.find(s => s.id === fromStageId);
    const toStage = stages.find(s => s.id === toStageId);
    if (!fromStage?.lat || !fromStage?.lng || !toStage?.lat || !toStage?.lng) {
        // Niente coordinate: l'UI mostrerà la stima haversine.
        return { success: true };
    }

    try {
        const legs = await routeMulti(
            [{ lat: fromStage.lat, lng: fromStage.lng }, { lat: toStage.lat, lng: toStage.lng }],
            mode
        );
        const [leg] = legs;
        if (leg) {
            const { error: insertError } = await supabase
                .from(EntityKeys.stageLegsKey)
                .upsert({
                    trip_id: tripId,
                    from_stage_id: fromStageId,
                    to_stage_id: toStageId,
                    mode,
                    distance_m: leg.distance_m,
                    duration_s: leg.duration_s,
                    provider: 'stadia',
                }, { onConflict: 'from_stage_id,to_stage_id,mode' });
            if (insertError) return { success: false, error: insertError.message };
        }
    } catch (err) {
        if (err instanceof StadiaError) {
            // Errori soft (es. transit non disponibile): l'UI mostrerà la stima rettilinea.
            console.error('Stadia routing skip (single leg):', err.code, err.message);
        } else {
            throw err;
        }
    }

    revalidatePath(`/dashboard/trips/${tripId}`);
    return { success: true };
}
