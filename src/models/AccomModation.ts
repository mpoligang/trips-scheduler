import { Timestamp } from 'firebase/firestore';
import { Attachment } from './Attachment';
import { Location } from './Location';

export interface Accommodation {
    id?: string;
    name: string;
    destination: string;
    location: Location;
    startDate: Timestamp;
    endDate: Timestamp;
    link?: string;
    cost?: number;
    attachments?: Attachment[];
    additionalContents?: string;
}