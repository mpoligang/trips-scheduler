'use server'

import { createClient } from '@/lib/server';
import { z } from 'zod';

// Definizione dello Schema di validazione con Zod
const RecommendedSchema = z.object({
    id: z.string().optional(),
    trip_id: z.uuid(),
    title: z.string().min(1, "Il titolo è obbligatorio"),
    destination: z.string().min(1, "La destinazione è obbligatoria"),
    location: z.string().optional(), // Mappato su 'address' nel DB
    additionalContent: z.string().optional(), // Mappato su 'additional_content' nel DB
    lat: z.number().optional(),
    lng: z.number().optional(),
    category: z.string().optional()
});

/**
 * Action per Aggiungere o Modificare un luogo consigliato
 */
export async function upsertRecommendedAction(formData: z.infer<typeof RecommendedSchema>) {
    const supabase = await createClient();

    // 1. Verifica autenticazione
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non autorizzato" };

    try {
        // 2. Validazione dati
        const validatedData = RecommendedSchema.parse(formData);

        // 3. Controllo sicurezza: solo l'owner può scrivere
        // Usiamo la tua funzione helper del DB 'check_is_trip_owner' tramite RPC o select
        const { data: isOwner } = await supabase.rpc('check_is_trip_owner', {
            t_id: validatedData.trip_id
        });

        if (!isOwner) return { success: false, error: "Solo l'organizzatore può gestire i consigliati" };

        const payload = {
            trip_id: validatedData.trip_id,
            title: validatedData.title,
            destination: validatedData.destination,
            address: validatedData.location, // Mapping interfaccia -> DB
            additional_content: validatedData.additionalContent, // Mapping interfaccia -> DB
            lat: validatedData.lat,
            lng: validatedData.lng,
            category: validatedData.category,
            updated_at: new Date().toISOString()
        };

        if (validatedData.id && validatedData.id !== 'new') {
            // UPDATE
            const { error } = await supabase
                .from('recommended')
                .update(payload)
                .eq('id', validatedData.id)
                .eq('trip_id', validatedData.trip_id); // Doppia sicurezza

            if (error) throw error;
        } else {
            // INSERT
            const { error } = await supabase
                .from('recommended')
                .insert([{ ...payload, created_by: user.id }]);

            if (error) throw error;
        }

        return { success: true };

    } catch (error: any) {
        console.error("Errore upsertRecommended:", error);
        return { success: false, error: error.message || "Errore durante il salvataggio" };
    }
}

/**
 * Action per Eliminare un luogo consigliato
 */
export async function deleteRecommendedAction({ id, trip_id }: { id: string, trip_id: string }) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non autorizzato" };

    try {
        // Verifica owner prima di procedere
        const { data: isOwner } = await supabase.rpc('check_is_trip_owner', {
            t_id: trip_id
        });

        if (!isOwner) return { success: false, error: "Azione non consentita" };

        const { error } = await supabase
            .from('recommended')
            .delete()
            .eq('id', id)
            .eq('trip_id', trip_id);

        if (error) throw error;
        return { success: true };

    } catch (error: any) {
        console.error("Errore deleteRecommended:", error);
        return { success: false, error: "Impossibile eliminare l'elemento" };
    }
}