import { NextResponse } from 'next/server';

import { createClient } from '@/lib/server';
import { searchPlaces, StadiaError } from '@/lib/maps/stadia';

const RESULT_LIMIT = 8;

interface LegacyLocationResult {
    place_id: string;
    lat: string;
    lon: string;
    display_name: string;
}

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: "Il parametro 'q' è obbligatorio" }, { status: 400 });
    }

    try {
        const results = await searchPlaces(query, { limit: RESULT_LIMIT });

        // Manteniamo lo shape storico (LocationIQ-like) per non toccare il client.
        const legacy: LegacyLocationResult[] = results.map((r, idx) => ({
            place_id: `stadia-${idx}-${r.lat},${r.lng}`,
            lat: String(r.lat),
            lon: String(r.lng),
            display_name: r.address,
        }));

        return NextResponse.json(legacy);
    } catch (error) {
        if (error instanceof StadiaError) {
            console.error('Stadia geocoding error:', error.code, error.message);
            // Errori upstream non devono mai abbattere il form: ritorniamo lista vuota
            // tranne che per problemi di configurazione/auth, dove vogliamo evidenziarli.
            if (error.code === 'unauthorized') {
                return NextResponse.json({ error: 'Configurazione Stadia non valida' }, { status: 500 });
            }
            return NextResponse.json([]);
        }
        console.error('Errore inatteso geocoding:', error);
        return NextResponse.json({ error: 'Errore durante la ricerca della località' }, { status: 500 });
    }
}
