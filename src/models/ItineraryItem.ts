export type ItineraryKind =
    | 'stage'
    | 'accommodation-checkin'
    | 'accommodation-checkout'
    | 'transport-departure'
    | 'transport-arrival';

export interface ItineraryItem {
    kind: ItineraryKind;
    id: string;
    title: string;
    label?: string;
    time?: string;
    sortKey: number;
    href: string;
    lat: number;
    lng: number;
}

export interface ItineraryDay {
    date: string;
    label: string;
    items: ItineraryItem[];
}
