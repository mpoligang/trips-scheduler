import { Timestamp } from 'firebase/firestore';
import { Attachment } from './Stage';

export type TransportType = 'Aereo' | 'Treno' | 'Autobus' | 'Navetta' | 'Traghetto' | 'Noleggio Auto' | 'Noleggio con conducente' | 'Altro';

export interface Transport {
    id: string;
    title: string;
    type: TransportType;
    departureDate: Timestamp;
    arrivalDate: Timestamp;
    departureLocation?: string;
    arrivalLocation?: string;
    isRoundTrip: boolean;
    returnDepartureDate?: Timestamp;
    returnArrivalDate?: Timestamp;
    referenceCode?: string;
    notes?: string;
    attachments?: Attachment[];
}