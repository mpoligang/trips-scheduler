'use server'

import { createClient } from '@/lib/server';
import { EntityKeys } from '@/utils/entityKeys';
import { Transport, TransportType } from '@/models/Transport';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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

    let result;
    // Se l'ID esiste ed è un UUID valido, facciamo UPDATE
    if (id) {
        result = await supabase
            .from(EntityKeys.transportsKey)
            .update(payload)
            .eq('id', id);
    } else {
        result = await supabase
            .from(EntityKeys.transportsKey)
            .insert([payload]);
    }

    if (result.error) return { success: false, error: result.error.message };

    revalidatePath(`/dashboard/trips/${payload.trip_id}`);
    return { success: true };
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

        // 4. Revalidazione della cache per aggiornare la lista
        revalidatePath(`/dashboard/trips/${validated.data.trip_id}`);

        return { success: true };

    } catch (err: any) {
        console.error("Errore eliminazione trasporto:", err.message);
        return { success: false, error: err.message };
    }
}