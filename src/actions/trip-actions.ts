// actions/trip-actions.ts
'use server'

import { createClient } from '@/lib/server';
import { formatDateForPostgres } from '@/utils/dateTripUtils';
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

    // --- 1. CONTROLLO LIMITI (PIANO SCADUTO = FREE) ---
    if (isNewTrip) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan, total_trips_created, expiration_plan_date')
            .eq('id', user.id)
            .single();

        if (profile) {
            const now = new Date();
            const expirationDate = profile.expiration_plan_date ? new Date(profile.expiration_plan_date) : null;

            // ✅ FIX: Se è Pro ma la data è passata, consideralo Free
            const isPlanExpired = profile.plan !== 'free' && expirationDate && expirationDate < now;
            const effectivePlan = isPlanExpired ? 'free' : profile.plan;

            // Limite di 2 viaggi per piano Free
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

    // --- 2. SALVATAGGIO VIAGGIO ---
    const tripPayload = {
        name: formData.name,
        start_date: formatDateForPostgres(formData.startDate),
        end_date: formatDateForPostgres(formData.endDate),
        destinations: formData.destinations,
        owner_id: user.id,
        updated_at: new Date().toISOString()
    };

    let tripId = formData.id;

    if (!isNewTrip) {
        const { error } = await supabase.from('trips').update(tripPayload).eq('id', tripId).eq('owner_id', user.id);
        if (error) return { error: error.message };
    } else {
        const { data, error } = await supabase.from('trips').insert(tripPayload).select().single();
        if (error) return { error: error.message };
        tripId = data.id;
        // Incrementa contatore (se usi una function RPC o trigger)
        // await supabase.rpc('increment_trips_created', { user_id: user.id });
    }

    // --- 3. SINCRONIZZAZIONE PARTECIPANTI SICURA ---
    if (tripId) {
        // Filtriamo l'owner dalla lista degli ID ricevuti per non creare conflitti
        const guestIds = formData.participantIds.filter(uid => uid !== user.id);

        // A. Rimuovi ospiti vecchi che non sono più nella lista (Escludendo l'owner)
        // "Cancella dalla tabella partecipanti DOVE trip_id è X, user_id NON è l'owner E user_id NON è nella nuova lista"
        if (guestIds.length > 0) {
            await supabase
                .from('trip_participants')
                .delete()
                .eq('trip_id', tripId)
                .neq('user_id', user.id) // 🛡️ Protezione Owner
                .not('user_id', 'in', `(${guestIds.join(',')})`);
        } else {
            // Se lista vuota, cancella tutti tranne owner
            await supabase.from('trip_participants').delete().eq('trip_id', tripId).neq('user_id', user.id);
        }

        // B. Inserisci/Aggiorna i nuovi ospiti
        if (guestIds.length > 0) {
            const participantsPayload = guestIds.map(uid => ({
                trip_id: tripId,
                user_id: uid
            }));
            await supabase.from('trip_participants').upsert(participantsPayload, { onConflict: 'trip_id, user_id' });
        }

        // C. Assicurati che l'owner esista sempre
        await supabase.from('trip_participants').upsert({ trip_id: tripId, user_id: user.id }, { onConflict: 'trip_id, user_id' });
    }

    revalidatePath('/dashboard');
    return { success: true, id: tripId };
}