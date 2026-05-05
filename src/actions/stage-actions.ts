'use server'

import { createClient } from '@/lib/server';
import { Stage } from '@/models/Stage';
import { EntityKeys } from '@/utils/entityKeys';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { recomputeDayLegsAction } from './legs-actions';

const dayPrefix = (timestamp: string | null | undefined): string | undefined =>
    timestamp ? timestamp.split('T')[0] : undefined;

interface AffectedDaysInput {
    isInsert: boolean;
    newArrival: string;
    previousArrival?: string;
    previousLat?: number | null;
    previousLng?: number | null;
    newLat: number;
    newLng: number;
}

const computeAffectedDays = (input: AffectedDaysInput): string[] => {
    const newDay = dayPrefix(input.newArrival);
    if (input.isInsert) return newDay ? [newDay] : [];

    const oldDay = dayPrefix(input.previousArrival);
    const arrivalChanged = input.previousArrival !== input.newArrival;
    const locationChanged = input.previousLat !== input.newLat || input.previousLng !== input.newLng;

    if (!arrivalChanged && !locationChanged) return [];

    const days = new Set<string>();
    if (newDay) days.add(newDay);
    if (oldDay && oldDay !== newDay) days.add(oldDay);
    return Array.from(days);
};

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

    // Per le update, leggiamo lo stato precedente: serve a capire quali giornate
    // vanno ricalcolate (tipicamente la nuova; entrambe se cambia il giorno).
    let previousArrival: string | undefined;
    let previousLat: number | null | undefined;
    let previousLng: number | null | undefined;

    let savedId = id;
    if (id) {
        const { data: existing } = await supabase
            .from(EntityKeys.stagesKey)
            .select('arrival_date, lat, lng')
            .eq('id', id)
            .maybeSingle();
        previousArrival = existing?.arrival_date as string | undefined;
        previousLat = existing?.lat as number | null | undefined;
        previousLng = existing?.lng as number | null | undefined;

        const { error } = await supabase
            .from(EntityKeys.stagesKey)
            .update(payload)
            .eq('id', id);
        if (error) return { success: false, error: error.message };
    } else {
        const { data, error } = await supabase
            .from(EntityKeys.stagesKey)
            .insert([payload])
            .select('id')
            .single();
        if (error) return { success: false, error: error.message };
        savedId = data?.id;
    }

    // Ricalcolo non blocca il save: errori già loggati dentro l'action.
    const affectedDays = computeAffectedDays({
        isInsert: !id,
        newArrival: payload.arrival_date,
        previousArrival,
        previousLat,
        previousLng,
        newLat: payload.lat,
        newLng: payload.lng,
    });
    for (const day of affectedDays) {
        await recomputeDayLegsAction({ tripId: payload.trip_id, date: day });
    }

    revalidatePath(`/dashboard/trips/${payload.trip_id}`);
    return { success: true, id: savedId };
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
        // 0. Salviamo il giorno della tappa prima di cancellarla, per il ricalcolo legs.
        const { data: stageRow } = await supabase
            .from(EntityKeys.stagesKey)
            .select('arrival_date')
            .eq('id', validated.data.id)
            .maybeSingle();
        const affectedDay = dayPrefix(stageRow?.arrival_date as string | undefined);

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

        // 2. Eliminazione record tappa (CASCADE gestisce i metadati attachments e le legs).
        const { error } = await supabase
            .from(EntityKeys.stagesKey)
            .delete()
            .eq('id', validated.data.id);

        if (error) throw error;

        // 3. Ricalcolo legs della giornata: i legs della tappa eliminata sono già caduti
        //    via cascade, ma le tappe rimaste potrebbero formare nuove coppie contigue.
        if (affectedDay) {
            await recomputeDayLegsAction({ tripId: validated.data.trip_id, date: affectedDay });
        }

        // 4. Revalidazione della cache
        revalidatePath(`/dashboard/trips/${validated.data.trip_id}`);

        return { success: true };

    } catch (err: unknown) {
        console.error("Errore eliminazione tappa:", err);
        return { success: false, error: "Errore durante l'eliminazione della tappa." };
    }
}