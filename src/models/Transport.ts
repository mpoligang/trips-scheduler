import { Timestamp } from 'firebase/firestore';
import { Attachment } from './Attachment';
import { Location } from './Location';

// 1. Enum per i Tipi (Fondamentale per switch/case sicuri)
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

export interface TransportStopover {
    id: string;
    location: Location | null;
    date: Timestamp;
    arrivalTime: string;
    departureTime: string;
}


// Interfaccia Base
interface BaseTransport {
    id: string;
    title: string;
    type: TransportType;
    departureDate: Timestamp;
    arrivalDate: Timestamp;
    departureLocation?: Location | null;
    arrivalLocation?: Location | null;
    stopovers?: TransportStopover[];
    notes?: string;
    attachments?: Attachment[];
}

// 1. Trasporti Pubblici (Aereo, Treno, etc.)
export interface TransportPublic extends BaseTransport {
    type: TransportType.Flight | TransportType.Train | TransportType.Bus | TransportType.Shuttle | TransportType.Ferry;
    carrier?: string;
    referenceNumber?: string;
    seat?: string;
    gateOrPlatform?: string;
    bookingReference?: string;
}

// 2. Noleggio Auto
export interface TransportRental extends BaseTransport {
    type: TransportType.CarRental;
    rentalCompany?: string;
    carModel?: string;
    pickupInstructions?: string;
    insuranceDetails?: string;
    hasDifferentDropOff: boolean;
    dropOffLocation?: Location | null;
    dropOffInstructions?: string;
}

// 3. NCC / Privato
export interface TransportPrivate extends BaseTransport {
    type: TransportType.PrivateTransfer;
    driverName?: string;
    driverPhoneNumber?: string;
    vehicleDescription?: string;
}

// 4. Altro
export interface TransportGeneric extends BaseTransport {
    type: TransportType.Other;
    referenceCode?: string;
}

// Unione
export type Transport = TransportPublic | TransportRental | TransportPrivate | TransportGeneric;