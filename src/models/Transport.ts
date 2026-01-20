import { Timestamp } from 'firebase/firestore';
import { Attachment } from './Attachment';
import { Location } from './Location';
import { v4 as uuidv4 } from 'uuid';

export enum TransportType {
    Flight = 'Aereo',
    Train = 'Treno',
    Bus = 'Autobus',
    Shuttle = 'Navetta',
    Ferry = 'Traghetto',
    CarRental = 'Noleggio Auto',
    PrivateTransfer = 'Noleggio con conducente',
    Other = 'Altro'
}
export interface Stopover {
    id: string;
    stopoverPlace: string;
    arrivalTime: string;
    departureTime: string;
    gateOrPlatform: string;
    transportNumber?: string;
    duration: string;
}

export class StopoverInstance implements Stopover {
    public id: string = uuidv4();
    public stopoverPlace: string = ''
    public arrivalTime: string = ''
    public departureTime: string = ''
    public gateOrPlatform: string = ''
    public duration: string = ''
}

export interface Transport {
    id?: string;
    title: string;
    type: TransportType;
    carrier?: string;
    referenceNumber?: string;
    bookingReference?: string;
    gateOrPlatform?: string;
    depLocation: Location | null;
    depDate?: Timestamp;
    depTime?: string;
    arrivalDate?: Timestamp;
    arrivalTime?: string;
    tripDuration?: string;
    stopovers?: Stopover[];
    rentalCompany?: string;
    carModel?: string;
    pickupLocation?: Location | null;
    pickupDate?: Timestamp;
    pickupTime?: string;
    dropOffLocation?: Location | null;
    dropOffDate?: Timestamp;
    dropOffTime?: string;
    hasDifferentDropOff?: boolean;
    dropOffNotes?: string;
    driverName?: string;
    driverPhoneNumber?: string;
    vehicleDescription?: string;
    attachments?: Attachment[];
}