import { DocumentProps, renderToStream } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';
import React, { JSXElementConstructor, ReactElement } from 'react';
import TripPdfTemplate from '@/components/generics/trip-pdf-template';
import { getTripFullDataAction } from '@/actions/trip-actions';

/**
 * Gestore GET per la generazione del PDF
 * Percorso: /api/trip/[id]/pdf
 */
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const tripId = params.id;

        // 1. Recupero i dati completi del viaggio tramite la Server Action
        const { data, success, error } = await getTripFullDataAction(tripId);

        if (!success || !data) {
            return NextResponse.json(
                { error: error || "Viaggio non trovato" },
                { status: 404 }
            );
        }

        // 2. Genero lo stream PDF usando il template React
        // Nota: Passiamo l'oggetto 'data' (il trip) come prop al template
        const stream = await renderToStream(
            React.createElement(TripPdfTemplate, { trip: data }) as ReactElement<DocumentProps, string | JSXElementConstructor<any>>
        );

        // 3. Imposto il nome del file per il download (pulisco il nome da spazi/caratteri speciali)
        const fileName = `${data.name}`;

        // 4. Ritorno la risposta come stream di dati binari
        return new NextResponse(stream as unknown as ReadableStream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                // Disabilita la cache per garantire dati sempre aggiornati
                'Cache-Control': 'no-store, max-age=0',
            },
        });

    } catch (err: any) {
        console.error("❌ Errore generazione PDF API:", err.message);
        return NextResponse.json(
            { error: "Errore interno durante la generazione del PDF" },
            { status: 500 }
        );
    }
}