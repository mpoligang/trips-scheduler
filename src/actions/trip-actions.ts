'use server'

import { createClient } from '@/lib/server';
import { formatDateForPostgres } from '@/utils/dateTripUtils';
import { EntityKeys } from '@/utils/entityKeys';
import { revalidatePath } from 'next/cache';

export async function upsertTripAction(formData: {
    id?: string;
    name: string;
    startDate: Date;
    endDate: Date;
    destinations: string[];
    participantIds: string[];
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non autorizzato" };

    const isNewTrip = !formData.id || formData.id === 'new';

    // --- 1. CONTROLLO LIMITI ---
    if (isNewTrip) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan, total_trips_created, expiration_plan_date')
            .eq('id', user.id)
            .single();

        if (profile) {
            const now = new Date();
            const expirationDate = profile.expiration_plan_date ? new Date(profile.expiration_plan_date) : null;
            const isPlanExpired = profile.plan !== 'free' && expirationDate && expirationDate < now;
            const effectivePlan = isPlanExpired ? 'free' : profile.plan;

            if (effectivePlan === 'free' && (profile.total_trips_created || 0) >= 2) {
                return {
                    error: "limit_reached",
                    message: isPlanExpired
                        ? "Il tuo piano Pro è scaduto. Hai raggiunto il limite del piano Free."
                        : "Hai raggiunto il limite di 2 viaggi gratuiti. Passa a Pro!"
                };
            }
        }
    }

    // --- 2. PREPARAZIONE PAYLOAD ---
    const tripPayload = {
        name: formData.name,
        start_date: formatDateForPostgres(formData.startDate),
        end_date: formatDateForPostgres(formData.endDate),
        destinations: formData.destinations,
        owner_id: user.id,
        updated_at: new Date().toISOString()
    };

    let tripId = formData.id;

    // --- 3. SALVATAGGIO O UPDATE ---
    if (!isNewTrip) {
        const { error } = await supabase.from(EntityKeys.tripsKey).update(tripPayload).eq('id', tripId).eq('owner_id', user.id);
        if (error) return { error: error.message };
    } else {
        const { data, error } = await supabase.from(EntityKeys.tripsKey).insert(tripPayload).select().single();
        if (error) return { error: error.message };
        tripId = data.id;
    }

    // --- 4. GESTIONE PARTECIPANTI ---
    if (tripId) {
        // Rimuoviamo l'owner dalla lista per sicurezza (lo gestiamo a parte)
        const guestIds = formData.participantIds.filter(uid => uid !== user.id);

        // A. DELETE: Rimuovi chi non è più nella lista (escluso l'owner)
        // Logica: Cancella se trip_id coincide AND user_id non è owner AND user_id NON è nella lista guestIds
        if (guestIds.length > 0) {
            await supabase
                .from(EntityKeys.participantsKey)
                .delete()
                .eq('trip_id', tripId)
                .neq('user_id', user.id)
                .not('user_id', 'in', guestIds); // ✅ Sintassi corretta per array
        } else {
            // Se la lista è vuota, cancella tutti tranne l'owner
            await supabase
                .from(EntityKeys.participantsKey)
                .delete()
                .eq('trip_id', tripId)
                .neq('user_id', user.id);
        }

        // B. UPSERT: Aggiungi i nuovi o aggiorna esistenti
        if (guestIds.length > 0) {
            const participantsPayload = guestIds.map(uid => ({
                trip_id: tripId,
                user_id: uid
            }));
            await supabase
                .from(EntityKeys.participantsKey)
                .upsert(participantsPayload, { onConflict: 'trip_id, user_id' });
        }

        // C. SAFETY: Assicura che l'owner sia sempre dentro
        await supabase
            .from(EntityKeys.participantsKey)
            .upsert({ trip_id: tripId, user_id: user.id }, { onConflict: 'trip_id, user_id' });
    }

    revalidatePath('/dashboard');
    return { success: true, id: tripId };
}