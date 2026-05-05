'use server'

import { createClient } from '@/lib/server';
import { EntityKeys } from '@/utils/entityKeys';
import { Transport, TransportType } from '@/models/Transport';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { recomputeDayLegsAction } from './legs-actions';

const dayPrefix = (timestamp: string | null | undefined): string | undefined =>
    timestamp ? timestamp.split('T')[0] : undefined;

const collectTransportDays = (...timestamps: (string | null | undefined)[]): string[] => {
    const days = new Set<string>();
    for (const ts of timestamps) {
        const day = dayPrefix(ts);
        if (day) days.add(day);
    }
    return Array.from(days);
};

const TransportSchema = z.object({
    // Permettiamo stringa vuota o null, ma se c'è deve essere UUID
    id: z.uuid().optional().nullable(),
    trip_id: z.uuid(),
    title: z.string().min(1, "Il titolo è obbligatorio"),
    // FIX: Usiamo nativeEnum se TransportType è un enum/oggetto TS
    type: z.enum(TransportType),
    destination: z.string().optional().nullable(),
    dep_date: z.string().nullable(),
    dep_address: z.string().nullable(),
    dep_lat: z.number().nullable(),
    dep_lng: z.number().nullable(),
    arr_date: z.string().nullable(),
    notes: z.string().optional().nullable(),
    details: z.any(),
});

export async function upsertTransportAction(data: Transport) {
    const supabase = await createClient();

    const cleanId = (data.id === 'new' || !data.id) ? undefined : data.id;

    const validated = TransportSchema.safeParse({
        ...data,
        id: cleanId
    });

    if (!validated.success) {
        return { success: false, error: "Dati non validi." };
    }

    const { id, ...payload } = validated.data;

    // Stato precedente: serve a sapere quali giornate vanno ricalcolate
    // se il transport viene spostato da un giorno all'altro.
    let previousDepDate: string | null | undefined;
    let previousArrDate: string | null | undefined;

    let savedId = id;
    if (id) {
        const { data: existing } = await supabase
            .from(EntityKeys.transportsKey)
            .select('dep_date, arr_date')
            .eq('id', id)
            .maybeSingle();
        previousDepDate = existing?.dep_date as string | null | undefined;
        previousArrDate = existing?.arr_date as string | null | undefined;

        const { error } = await supabase
            .from(EntityKeys.transportsKey)
            .update(payload)
            .eq('id', id);
        if (error) return { success: false, error: error.message };
    } else {
        const { data, error } = await supabase
            .from(EntityKeys.transportsKey)
            .insert([payload])
            .select('id')
            .single();
        if (error) return { success: false, error: error.message };
        savedId = data?.id;
    }

    // Un transport spezza/ricostruisce le catene di legs nel suo giorno (e in
    // quello vecchio se è stato spostato). Ricalcoliamo le giornate impattate.
    const affectedDays = collectTransportDays(
        payload.dep_date, payload.arr_date,
        previousDepDate, previousArrDate
    );
    for (const day of affectedDays) {
        await recomputeDayLegsAction({ tripId: payload.trip_id, date: day });
    }

    revalidatePath(`/dashboard/trips/${payload.trip_id}`);
    return { success: true, id: savedId };
}



const DeleteTransportSchema = z.object({
    id: z.string().uuid(),
    trip_id: z.string().uuid(),
});

export async function deleteTransportAction(formData: { id: string, trip_id: string }) {
    const supabase = await createClient();

    const validated = DeleteTransportSchema.safeParse(formData);
    if (!validated.success) return { success: false, error: "Dati non validi." };

    try {
        // 0. Salviamo i giorni del transport prima della cancellazione, per il ricalcolo legs.
        const { data: existing } = await supabase
            .from(EntityKeys.transportsKey)
            .select('dep_date, arr_date')
            .eq('id', validated.data.id)
            .maybeSingle();
        const affectedDays = collectTransportDays(
            existing?.dep_date as string | null | undefined,
            existing?.arr_date as string | null | undefined,
        );

        // 1. Recupero path degli allegati collegati al trasporto
        const { data: attachments } = await supabase
            .from(EntityKeys.attachmentsKey)
            .select('storage_path')
            .eq('transport_id', validated.data.id)
            .not('storage_path', 'is', null);

        // 2. Pulizia fisica dei file nello Storage
        if (attachments && attachments.length > 0) {
            const paths = attachments.map((a) => a.storage_path as string);
            await supabase.storage.from(EntityKeys.attachmentsKey).remove(paths);
        }

        // 3. Eliminazione record (il CASCADE DB pulirà i metadati attachments)
        const { error } = await supabase
            .from(EntityKeys.transportsKey)
            .delete()
            .eq('id', validated.data.id);

        if (error) throw error;

        // 4. Senza più il transport, le tappe potrebbero formare nuove coppie contigue.
        for (const day of affectedDays) {
            await recomputeDayLegsAction({ tripId: validated.data.trip_id, date: day });
        }

        // 5. Revalidazione della cache per aggiornare la lista
        revalidatePath(`/dashboard/trips/${validated.data.trip_id}`);

        return { success: true };

    } catch (err: any) {
        console.error("Errore eliminazione trasporto:", err.message);
        return { success: false, error: err.message };
    }
}