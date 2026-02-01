import { DocumentProps, renderToStream } from '@react-pdf/renderer';
import { NextResponse } from 'next/server';
import React, { JSXElementConstructor, ReactElement } from 'react';
import { getTripFullDataAction } from '@/actions/trip-actions';
import TripPdfTemplate from '@/components/generics/trip-pdf-template';
import { da } from 'date-fns/locale';

/**
 * Fix per l'errore RouteHandlerConfig in Next.js 15+
 * I params devono essere trattati come Promise
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Definito come Promise
) {
    try {
        // 1. Attendi la risoluzione dei parametri
        const { id: tripId } = await params;

        // 2. Recupera i dati tramite Server Action
        const { data, success, error } = await getTripFullDataAction(tripId);

        if (!success || !data) {
            return NextResponse.json(
                { error: error || "Viaggio non trovato" },
                { status: 404 }
            );
        }

        // 3. Genera lo stream del PDF
        // Usiamo il cast 'as any' per evitare conflitti di tipi con renderToStream
        const stream = await renderToStream(
            React.createElement(TripPdfTemplate, { trip: data }) as ReactElement<DocumentProps, string | JSXElementConstructor<any>>
        );

        // 3. Imposto il nome del file per il download (pulisco il nome da spazi/caratteri speciali)
        const fileName = `${data.name}`;

        // 4. Restituisci la Response
        return new NextResponse(stream as unknown as ReadableStream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Cache-Control': 'no-store, max-age=0',
            },
        });

    } catch (err: any) {
        console.error("❌ Errore generazione PDF:", err.message);
        return NextResponse.json(
            { error: "Errore interno durante la generazione del PDF" },
            { status: 500 }
        );
    }
}