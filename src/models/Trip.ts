import { Timestamp } from "firebase/firestore";
import { Stage } from "./Stage";

export interface Trip {
    id?: string;
    name: string;
    startDate: Timestamp;
    endDate: Timestamp;
    owner: string;
    stages?: Stage[];
    notes: string;
}