import { Attachment } from './Attachment';

export interface Accommodation {
    attachments?: Attachment[];
    id: string; // UUID in Postgres
    trip_id: string; // Foreign Key verso la tabella trips
    name: string;
    destination: string | null;
    address: string;
    lat: number | null; // double precision -> number
    lng: number | null; // double precision -> number
    start_date: string;
    end_date: string;
    link: string | null;
    notes: string | null;
    created_at?: string;
}

