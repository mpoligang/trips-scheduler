import { UserData } from "./UserData";

export interface Expense {
    id: string;                // uuid (Generato da Supabase)
    trip_id: string;          // uuid (Riferimento al viaggio)
    description: string;      // text
    amount: number;           // numeric
    paid_by: string;          // uuid (Riferimento all'utente che ha pagato)
    participant_ids: string[] | null; // ARRAY di uuid (Riferimento agli utenti partecipanti)
    created_at?: string;      // timestamp with time zone
    updated_at?: string;      // timestamp with time zone
    profiles?: Partial<UserData>; // Join con i profili degli utenti (opzionale)
    expense_splits: ExpenseSplit[]; // Join con le suddivisioni delle spese (opzionale)
}

export interface ExpenseSplit {
    id: string;                // uuid (Generato da Supabase)
    expense_id: string;       // uuid (Riferimento alla spesa)
    user_id: string;          // uuid (Riferimento all'utente)
    amount: number;           // numeric
    created_at?: string;      // timestamp with time zone
    updated_at?: string;      // timestamp with time zone
    profiles?: Partial<UserData>; // Join con i profili degli utenti (opzionale)
}