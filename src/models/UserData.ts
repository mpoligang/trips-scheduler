import { Timestamp } from "firebase/firestore";

export interface UserData {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    plan: string;
    expirationPlanDate: Timestamp | null;
    totalTripsCreated: number;
    totalStorageUsedInBytes: number;
}
