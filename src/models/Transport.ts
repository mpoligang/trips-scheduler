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

export interface Transport {
    id: string;
    trip_id: string;
    title: string;
    type: string;
    notes: string | null;
    dep_date: string | null;
    dep_address: string | null;
    dep_lat: number | null;
    dep_lng: number | null;
    arr_date: string | null;
    destination: string | null;
    position: number;
    details: TransportDetails;
    created_at?: string;
    updated_at?: string;
    attachments?: Attachment[];
}

export interface TransportDetails {

    // Campi comuni (Voli, Treni, Bus)
    carrier?: string;               // Compagnia aerea, compagnia ferroviaria
    reference_number?: string;
    booking_reference?: string;
    gate_or_platform?: string;
    dep_location?: Location | null;
    arr_location?: Location | null; // Aggiunto per simmetria
    trip_duration?: string;
    stopovers?: StopoverV2[];

    // Campi specifici Noleggio (Rental)
    rental_company?: string;
    car_model?: string;
    pickup_location?: Location | null;
    pickup_date?: string;           // ISO string se differente da dep_date
    drop_off_location?: Location | null;
    drop_off_date?: string;         // ISO string se differente da arr_date
    has_different_drop_off?: boolean;
    drop_off_notes?: string;

    // Campi specifici Driver/Taxi/Transfer
    driver_name?: string;
    driver_phone_number?: string;
    vehicle_description?: string;
}

export interface StopoverV2 {
    id: string;
    stopover_place: string;
    arrival_time: string;
    departure_time: string;
    gate_or_platform: string;
    transport_number?: string;
    duration: string;
}


export class StopoverInstanceV2 implements StopoverV2 {
    public id: string = uuidv4();
    public stopover_place: string = ''
    public arrival_time: string = ''
    public departure_time: string = ''
    public gate_or_platform: string = ''
    public duration: string = ''
}

