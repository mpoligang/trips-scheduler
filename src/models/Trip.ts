import { Timestamp } from "firebase/firestore";
import { Stage } from "./Stage";
import { Accommodation } from "./AccomModation";

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
}