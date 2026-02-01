'use server'

import { createClient } from '@/lib/server';
import { UserData } from '@/models/UserData';
import { formatDateForPostgres } from '@/utils/dateTripUtils';
import { EntityKeys } from '@/utils/entityKeys';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';


export async function upsertTripAction(formData: {
    id?: string;
    name: string;
    startDate: string;
    endDate: string;
    destinations: string[];
    participantIds: string[];
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Non autorizzato" };

    const isNewTrip = !formData.id || formData.id === 'new';

    // --- 1. CONTROLLO LIMITI (Aggiornato per Security By Column) ---
    if (isNewTrip) {
        // ✅ MODIFICA: Usiamo la RPC sicura invece della select diretta
        // La tabella 'profiles' non permette più di leggere 'plan' direttamente.
        const { data: profile, error: profileError } = await supabase
            .rpc('get_my_private_profile')
            .single();



        if (profileError || !profile) {
            console.error("Errore recupero piano utente:", profileError);
            return { error: "Impossibile verificare il piano di abbonamento." };
        }

        if (profile) {
            const profileData = profile as UserData;
            const now = new Date();
            const expirationDate = profileData.expiration_plan_date ? new Date(profileData.expiration_plan_date) : null;

            // Logica scadenza piano
            const isPlanExpired = profileData.plan.name !== 'free' && expirationDate && expirationDate < now;
            const effectivePlan = isPlanExpired ? 'free' : profileData.plan.name;

            // Logica blocco creazione
            if (effectivePlan === 'free' && (profileData.total_trips_created || 0) >= 2) {
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
        start_date: (formData.startDate),
        end_date: (formData.endDate),
        destinations: formData.destinations,
        owner_id: user.id,
        updated_at: new Date().toISOString()
    };

    let tripId = formData.id;

    // --- 3. SALVATAGGIO O UPDATE ---
    try {
        if (!isNewTrip) {
            // Update sicuro con controllo owner_id (IDOR protection)
            const { error } = await supabase
                .from(EntityKeys.tripsKey)
                .update(tripPayload)
                .eq('id', tripId)
                .eq('owner_id', user.id);

            if (error) throw error;
        } else {
            // Insert nuovo viaggio
            const { data, error } = await supabase
                .from(EntityKeys.tripsKey)
                .insert(tripPayload)
                .select()
                .single();

            if (error) throw error;
            tripId = data.id;
        }
    } catch (error: any) {
        return { error: error.message || "Errore durante il salvataggio del viaggio" };
    }

    // --- 4. GESTIONE PARTECIPANTI ---
    if (tripId) {
        try {
            // Rimuoviamo l'owner dalla lista per sicurezza (lo gestiamo a parte)
            const guestIds = formData.participantIds.filter(id => id !== user.id);

            // A. DELETE: Rimuovi chi non è più nella lista (escluso l'owner)
            if (guestIds.length > 0) {
                await supabase
                    .from(EntityKeys.participantsKey)
                    .delete()
                    .eq('trip_id', tripId)
                    .neq('user_id', user.id)
                    .not('user_id', 'in', guestIds);
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
                const participantsPayload = guestIds.map(id => ({
                    trip_id: tripId,
                    user_id: id
                }));
                await supabase
                    .from(EntityKeys.participantsKey)
                    .upsert(participantsPayload, { onConflict: 'trip_id, user_id' });
            }

            // C. SAFETY: Assicura che l'owner sia sempre dentro
            await supabase
                .from(EntityKeys.participantsKey)
                .upsert({ trip_id: tripId, user_id: user.id }, { onConflict: 'trip_id, user_id' });

        } catch (error) {
            console.error("Errore gestione partecipanti:", error);
            // Non blocchiamo il return success se falliscono i partecipanti, ma logghiamo l'errore
        }
    }

    revalidatePath('/dashboard');
    return { success: true, id: tripId };
}




const TripIdSchema = z.uuid();

// --- GET: Recupero Viaggi ---
export async function getUserTripsAction(userId: string) {
    const supabase = await createClient();

    const [ownedRes, partRes] = await Promise.all([
        // Viaggi di cui sono proprietario
        supabase
            .from(EntityKeys.tripsKey)
            .select(`*, trip_participants (user_id, profiles:profiles (first_name, last_name, username))`)
            .eq('owner_id', userId)
            .order('created_at', { ascending: false }),

        // Viaggi a cui partecipo
        supabase
            .from(EntityKeys.participantsKey)
            .select(`trips (*, trip_participants (user_id, profiles:profiles (first_name, last_name, username)))`)
            .eq('user_id', userId)
    ]);

    if (ownedRes.error) return { success: false, error: ownedRes.error.message };

    const owned = ownedRes.data || [];
    const participated = (partRes.data as any[])
        ?.map(row => row.trips)
        .filter(trip => trip && trip.owner_id !== userId) || [];

    return { success: true, data: { owned, participated } };
}

// --- DELETE: Elimina o Abbandona ---
export async function deleteOrLeaveTripAction(tripId: string, userId: string, isOwner: boolean) {
    const supabase = await createClient();

    const validatedId = TripIdSchema.parse(tripId);
    let error;

    if (isOwner) {
        // Elimina il viaggio (CASCADE si occuperà del resto)
        const res = await supabase.from(EntityKeys.tripsKey).delete().eq('id', validatedId).eq('owner_id', userId);
        error = res.error;
    } else {
        // Rimuove solo il partecipante
        const res = await supabase.from(EntityKeys.participantsKey).delete().eq('trip_id', validatedId).eq('user_id', userId);
        error = res.error;
    }

    if (error) return { success: false, error: error.message };

    revalidatePath('/dashboard');
    return { success: true };
}


export async function getTripFullDataAction(tripId: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from(EntityKeys.tripsKey)
            .select(`
                *,
                stages(*, attachments(*)),
                accommodations(*, attachments(*)),
                transports(*, attachments(*)),
                expenses(
                    *,
                    profiles:paid_by (id, first_name, last_name, username),
                    expense_splits (
                        *,
                        profiles:user_id (id, first_name, last_name, username)
                    )
                ),
                trip_participants (profiles (id, username, first_name, last_name))
            `)
            .eq('id', tripId)
            .order('position', { referencedTable: EntityKeys.stagesKey, ascending: true })
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (err: any) {
        console.error("❌ Errore Server Action getTripFullData:", err.message);
        return { success: false, error: "Impossibile caricare i dati del viaggio." };
    }
}
