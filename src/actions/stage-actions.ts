'use server'

import { createClient } from '@/lib/server';
import { Stage } from '@/models/Stage';
import { EntityKeys } from '@/utils/entityKeys';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const StageSchema = z.object({
    id: z.uuid().optional().nullable(),
    trip_id: z.uuid(),
    name: z.string().min(1, "Il nome della tappa è obbligatorio"),
    arrival_date: z.string(), // Formato YYYY-MM-DD
    destination: z.string().min(1, "La destinazione è obbligatoria"),
    address: z.string().min(1, "L'indirizzo è obbligatorio"),
    lat: z.number(),
    lng: z.number(),
    notes: z.string().optional().nullable(),
});

export async function upsertStageAction(data: Stage) {
    const supabase = await createClient();

    // Pulizia ID per Zod
    const cleanData = {
        ...data,
        id: (data.id === 'new' || !data.id) ? undefined : data.id
    };

    const validated = StageSchema.safeParse(cleanData);
    if (!validated.success) {
        return { success: false, error: "Dati non validi. Controlla i campi obbligatori." };
    }

    const { id, ...payload } = validated.data;

    let result;
    if (id) {
        result = await supabase
            .from(EntityKeys.stagesKey)
            .update(payload)
            .eq('id', id);
    } else {
        result = await supabase
            .from(EntityKeys.stagesKey)
            .insert([payload]);
    }

    if (result.error) return { success: false, error: result.error.message };

    revalidatePath(`/dashboard/trips/${payload.trip_id}`);
    return { success: true };
}


const DeleteStageSchema = z.object({
    id: z.string().uuid(),
    trip_id: z.string().uuid(),
});

export async function deleteStageAction(formData: { id: string, trip_id: string }) {
    const supabase = await createClient();

    const validated = DeleteStageSchema.safeParse(formData);
    if (!validated.success) return { success: false, error: "Dati non validi." };

    try {
        // 1. Recupero path degli allegati per pulizia Storage
        const { data: attachments } = await supabase
            .from(EntityKeys.attachmentsKey)
            .select('storage_path')
            .eq('stage_id', validated.data.id)
            .not('storage_path', 'is', null);

        if (attachments && attachments.length > 0) {
            const paths = attachments.map((a) => a.storage_path as string);
            await supabase.storage.from(EntityKeys.attachmentsKey).remove(paths);
        }

        // 2. Eliminazione record tappa (CASCADE gestisce i metadati attachments)
        const { error } = await supabase
            .from(EntityKeys.stagesKey)
            .delete()
            .eq('id', validated.data.id);

        if (error) throw error;

        // 3. Revalidazione della cache
        revalidatePath(`/dashboard/trips/${validated.data.trip_id}`);

        return { success: true };

    } catch (err: unknown) {
        console.error("Errore eliminazione tappa:", err);
        return { success: false, error: "Errore durante l'eliminazione della tappa." };
    }
}