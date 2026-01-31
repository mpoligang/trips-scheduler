'use server';

import { createClient } from '@/lib/server'; // Assicurati che punti al tuo helper server-side
import { EntityKeys } from '@/utils/entityKeys';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const AccommodationSchema = z.object({
    id: z.uuid().optional(),
    trip_id: z.uuid(),
    name: z.string().min(1, "Il nome è obbligatorio"),
    destination: z.string().min(1, "La destinazione è obbligatoria"),
    address: z.string().min(1, "L'indirizzo è obbligatorio"),
    lat: z.number(),
    lng: z.number(),
    start_date: z.string(), // Formato YYYY-MM-DD
    end_date: z.string(),
    link: z.url().optional().or(z.literal('')),
    notes: z.string().optional(),
});

export async function upsertAccommodationAction(data: z.infer<typeof AccommodationSchema>) {
    const supabase = await createClient();

    // 1. Validazione
    const validated = AccommodationSchema.safeParse(data);
    if (!validated.success) {
        return { success: false, error: "Dati non validi: " + validated.error.issues.map(e => e.message).join(", ") };
    }

    const { id, ...payload } = validated.data;

    let error;
    if (id) {
        // Update
        const { error: updateError } = await supabase
            .from(EntityKeys.accommodationsKey)
            .update(payload)
            .eq('id', id);
        error = updateError;
    } else {
        // Insert
        const { error: insertError } = await supabase
            .from(EntityKeys.accommodationsKey)
            .insert([payload]);
        error = insertError;
    }

    if (error) return { success: false, error: error.message };

    // 2. Revalidazione della cache di Next.js
    revalidatePath(`/dashboard/trips/${payload.trip_id}`);

    return { success: true };
}


const DeleteSchema = z.object({
    id: z.uuid(),
    trip_id: z.uuid(),
});

export async function deleteAccommodationAction(formData: { id: string, trip_id: string }) {
    const supabase = await createClient();

    // 1. Validazione
    const validated = DeleteSchema.safeParse(formData);
    if (!validated.success) return { success: false, error: "ID non valido." };

    try {
        // 2. Recupero path allegati per pulizia Storage
        const { data: attachments } = await supabase
            .from(EntityKeys.attachmentsKey)
            .select('storage_path')
            .eq('accommodation_id', validated.data.id)
            .not('storage_path', 'is', null);

        if (attachments && attachments.length > 0) {
            const paths = attachments.map((a) => a.storage_path as string);
            await supabase.storage.from(EntityKeys.attachmentsKey).remove(paths);
        }

        // 3. Eliminazione record (il CASCADE penserà ai metadati)
        const { error } = await supabase
            .from(EntityKeys.accommodationsKey)
            .delete()
            .eq('id', validated.data.id);

        if (error) throw error;

        revalidatePath(`/dashboard/trips/${validated.data.trip_id}`);
        return { success: true };

    } catch (err: any) {
        return { success: false, error: err.message };
    }
}