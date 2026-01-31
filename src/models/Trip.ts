import { Stage } from "./Stage";
import { Transport } from "./Transport";
import { Accommodation } from "./Accommodation";
import { UserData } from "./UserData";
import { Expense } from "./Expenses";

export interface Trip {
    stages?: Stage[];
    accommodations?: Accommodation[];
    transports?: Transport[];
    expenses?: Expense[];
    id: string;                // uuid (Generato da Supabase)
    owner_id: string;          // uuid (Riferimento all'utente proprietario)
    name: string;              // text
    start_date: string;        // date (Formato YYYY-MM-DD)
    end_date: string;          // date (Formato YYYY-MM-DD)
    destinations: string[] | null; // ARRAY di text
    created_at?: string;       // timestamp with time zone
    updated_at?: string;       // timestamp with time zone
    trip_participants?: {
        profiles: Partial<UserData>;
        user_id: string;
    }[];
}

