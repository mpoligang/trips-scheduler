import { Attachment } from "./Attachment";

export interface Stage {
    attachments?: Attachment[];
    id: string;               // uuid (Primary Key)
    trip_id: string;          // uuid (Foreign Key verso trips)
    name: string;             // text (es. "Arrivo a Tokyo" o "Gita a Kyoto")
    arrival_date: string;     // timestamp with time zone (Data e ora della tappa)
    destination?: string;     // text
    address?: string;         // text
    lat?: number;             // double precision
    lng?: number;             // double precision
    notes?: string;           // text
    created_at?: string;      // timestamp with time zone
}

