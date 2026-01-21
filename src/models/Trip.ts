import { Timestamp } from "firebase/firestore";
import { Stage } from "./Stage";
import { Transport } from "./Transport";
import { Accommodation } from "./Accommodation";

export interface Trip {
    id?: string;
    name: string;
    startDate: Timestamp;
    endDate: Timestamp;
    owner: string;
    destinations: string[];
    stages?: Stage[];
    accommodations?: Accommodation[];
    participants?: TripParticipant[];
    participantIds?: string[];
    transports?: Transport[];
}

export interface TripParticipant {
    uid: string;
    email: string;
    displayName?: string;
}