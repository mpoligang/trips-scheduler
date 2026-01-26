import { createClient } from '@/lib/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {


    // 1. Inizializza il client Supabase per i Route Handlers
    const supabase = await createClient();

    // 2. Verifica l'autenticazione dell'utente
    // Supabase recupera automaticamente il JWT dai cookie della sessione
    const { data: { user } } = await supabase.auth.getUser();

    console.log(user);


    if (!user) {
        return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // 3. Recupera i parametri dalla query string
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: "Il parametro 'q' è obbligatorio" }, { status: 400 });
    }

    const apiKey = process.env.LOCATIONIQ_API_KEY;

    if (!apiKey) {
        console.error("Errore: LOCATIONIQ_API_KEY non configurata.");
        return NextResponse.json({ error: "Errore di configurazione server" }, { status: 500 });
    }

    // 4. Esegui la chiamata a LocationIQ (usiamo fetch nativo di Next.js)
    const apiUrl = `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(query)}&format=json`;

    try {
        const response = await fetch(apiUrl);
        console.log(response);

        if (!response.ok) {
            throw new Error(`LocationIQ ha risposto con status: ${response.status}`);
        }

        const data = await response.json();

        // Ritorna i dati al frontend
        return NextResponse.json(data);
    } catch (error) {
        console.error("Errore chiamata a LocationIQ:", error);
        return NextResponse.json({ error: "Errore durante la ricerca della località" }, { status: 500 });
    }
}