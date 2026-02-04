import { Stage } from "./Stage";
import { Transport } from "./Transport";
import { Accommodation } from "./Accommodation";
import { UserData } from "./UserData";
import { Expense } from "./Expenses";
import { AISearchRequest } from "./AIStageSuggestion";

export interface Trip {
    stages?: Stage[];
    accommodations?: Accommodation[];
    transports?: Transport[];
    ai_search_requests?: AISearchRequest[];
    expenses?: Expense[];
    id: string;
    owner_id: string;
    name: string;
    start_date: string;
    end_date: string;
    destinations: string[] | null;
    created_at?: string;
    updated_at?: string;
    trip_participants?: {
        profiles: Partial<UserData>;
        user_id: string;
    }[];
}

