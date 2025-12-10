import { Timestamp } from "firebase/firestore";
import { Stage } from "./Stage";
import { Accommodation } from "./AccomModation";
import { Transport } from "./Transport";

export interface Trip {
    id?: string;
    name: string;
    startDate: Timestamp;
    endDate: Timestamp;
    owner: string;
    destinations: string[];
    stages?: Stage[];
    accommodations?: Accommodation[];
    notes: string;
    participants?: TripParticipant[];
    participantIds?: string[];
    transports?: Transport[];
}

export interface TripParticipant {
    uid: string;
    email: string;
    displayName?: string;
}