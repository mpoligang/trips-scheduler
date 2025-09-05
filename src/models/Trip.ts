import { Timestamp } from "firebase/firestore";

export interface Trip {
    id?: string;
    name: string;
    startDate: Timestamp;
    endDate: Timestamp;
    owner: string;
    stages?: any[];
    notes: string;
}