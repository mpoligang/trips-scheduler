import { Timestamp } from 'firebase/firestore';

export interface Accommodation {
    id?: string;
    name: string;
    destination: string;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    startDate: Timestamp;
    endDate: Timestamp;
    link?: string;
}