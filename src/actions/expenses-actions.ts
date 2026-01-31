'use server';

import { createClient } from '@/lib/server';
import { z } from 'zod';

// Schema di validazione
const ExpenseSchema = z.object({
    trip_id: z.uuid(),
    description: z.string().min(1, "La descrizione è obbligatoria"),
    amount: z.number().positive("L'importo deve essere maggiore di zero"),
    paid_by: z.uuid(),
    split_type: z.enum(['all', 'specific']),
    participant_ids: z.array(z.uuid()),
});

export async function createExpenseAction(formData: z.infer<typeof ExpenseSchema>) {
    const supabase = await createClient();
    const validated = ExpenseSchema.parse(formData);

    // Inserimento spesa
    const { data: expense, error: expError } = await supabase
        .from('expenses')
        .insert({
            trip_id: validated.trip_id,
            description: validated.description,
            amount: validated.amount,
            paid_by: validated.paid_by
        })
        .select()
        .single();

    if (expError) throw new Error(`Errore spesa: ${expError.message}`);

    // Gestione arrotondamento centesimi
    const numParticipants = validated.participant_ids.length;
    const baseShare = Math.floor((validated.amount / numParticipants) * 100) / 100;
    let remainingCents = Math.round((validated.amount - (baseShare * numParticipants)) * 100);

    const splits = validated.participant_ids.map((userId) => {
        // Aggiungi 1 centesimo ai primi utenti finché il resto non è zero
        const extra = remainingCents > 0 ? 0.01 : 0;
        if (extra > 0) remainingCents--;

        return {
            expense_id: expense.id,
            user_id: userId,
            amount: baseShare + extra
        };
    });

    const { error: splitError } = await supabase
        .from('expense_splits')
        .insert(splits);

    if (splitError) {
        // Se fallisce qui (RLS), puliamo la spesa orfana
        await supabase.from('expenses').delete().eq('id', expense.id);
        throw new Error(`Errore split: ${splitError.message}`);
    }

    return { success: true };
}


const DeleteExpenseSchema = z.object({
    expense_id: z.uuid(),
    trip_id: z.uuid(), // Passiamo il trip_id per il revalidatePath
});

export async function deleteExpenseAction(formData: { expense_id: string; trip_id: string }) {
    const supabase = await createClient();

    // 1. Validazione input
    const validated = DeleteExpenseSchema.parse(formData);

    // 2. Esecuzione eliminazione
    // RLS si occuperà di verificare se l'utente ha i permessi per eliminare
    const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', validated.expense_id);

    if (error) {
        console.error("Errore eliminazione spesa:", error.message);
        return { success: false, error: error.message };
    }


    return { success: true };
}