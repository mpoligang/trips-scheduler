import { Stage } from "./Stage";
import { Transport } from "./Transport";
import { Accommodation } from "./Accommodation";
import { UserData } from "./UserData";
import { Expense } from "./Expenses";
import { AISearchRequest } from "./AIStageSuggestion";
import { Recommended } from "./Recommended";
import { RoutingMode, StageLeg, StageLegPreference } from "./StageLeg";

export interface Trip {
    stages?: Stage[];
    accommodations?: Accommodation[];
    recommended?: Recommended[];
    transports?: Transport[];
    ai_search_requests?: AISearchRequest[];
    expenses?: Expense[];
    stage_legs?: StageLeg[];
    stage_leg_preferences?: StageLegPreference[];
    id: string;
    owner_id: string;
    name: string;
    start_date: string;
    end_date: string;
    destinations: string[] | null;
    default_routing_mode?: RoutingMode;
    created_at?: string;
    updated_at?: string;
    trip_participants?: {
        profiles: Partial<UserData>;
        user_id: string;
    }[];
}

