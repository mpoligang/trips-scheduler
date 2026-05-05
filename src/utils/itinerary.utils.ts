import { Trip } from '@/models/Trip';
import { ItineraryDay, ItineraryItem } from '@/models/ItineraryItem';
import { extractTimeFromDate, generateDateOptions, toLocalISOString } from './dateTripUtils';
import { appRoutes } from './appRoutes';

const NO_TIME_SORT_KEY = 24 * 60;

const dateKeyFromTimestamp = (timestamp: string | undefined | null): string | undefined => {
    if (!timestamp) return undefined;
    const datePart = timestamp.split('T')[0];
    return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : undefined;
};

const sortKeyFromTime = (time: string | undefined): number => {
    if (!time) return NO_TIME_SORT_KEY;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

const tabLabelForDate = (dateKey: string): string => {
    const [, m, d] = dateKey.split('-');
    return `${d}/${m}`;
};

export const buildItinerary = (trip: Trip | null | undefined): ItineraryDay[] => {
    if (!trip?.start_date || !trip?.end_date) return [];

    const dateOptions = generateDateOptions(new Date(trip.start_date), new Date(trip.end_date));

    const buckets = new Map<string, ItineraryItem[]>();
    for (const opt of dateOptions) {
        buckets.set(opt.id, []);
    }

    const pushItem = (dateKey: string | undefined, item: ItineraryItem) => {
        if (!dateKey) return;
        const list = buckets.get(dateKey);
        if (!list) return;
        list.push(item);
    };

    for (const stage of trip.stages || []) {
        const dateKey = dateKeyFromTimestamp(stage.arrival_date);
        const time = extractTimeFromDate(stage.arrival_date);
        pushItem(dateKey, {
            kind: 'stage',
            id: stage.id,
            title: stage.name,
            time: time || undefined,
            sortKey: sortKeyFromTime(time),
            href: appRoutes.stageDetails(trip.id, stage.id),
            lat: stage.lat ?? 0,
            lng: stage.lng ?? 0,
        });
    }

    for (const acc of trip.accommodations || []) {
        const startKey = dateKeyFromTimestamp(acc.start_date);
        const endKey = dateKeyFromTimestamp(acc.end_date);
        const startTime = extractTimeFromDate(acc.start_date);
        const endTime = extractTimeFromDate(acc.end_date);

        pushItem(startKey, {
            kind: 'accommodation-checkin',
            id: acc.id,
            title: acc.name,
            label: 'Check-in',
            time: startTime || undefined,
            sortKey: sortKeyFromTime(startTime),
            href: appRoutes.accommodationDetails(trip.id, acc.id),
            lat: acc.lat ?? 0,
            lng: acc.lng ?? 0,
        });

        if (endKey) {
            pushItem(endKey, {
                kind: 'accommodation-checkout',
                id: acc.id,
                title: acc.name,
                label: 'Check-out',
                time: endTime || undefined,
                sortKey: sortKeyFromTime(endTime),
                href: appRoutes.accommodationDetails(trip.id, acc.id),
                lat: acc.lat ?? 0,
                lng: acc.lng ?? 0,
            });
        }
    }

    for (const transport of trip.transports || []) {
        const depKey = dateKeyFromTimestamp(transport.dep_date);
        const arrKey = dateKeyFromTimestamp(transport.arr_date);
        const depTime = extractTimeFromDate(transport.dep_date);
        const arrTime = extractTimeFromDate(transport.arr_date);

        pushItem(depKey, {
            kind: 'transport-departure',
            id: transport.id,
            title: transport.title,
            label: 'Partenza',
            time: depTime || undefined,
            sortKey: sortKeyFromTime(depTime),
            href: appRoutes.transportDetails(trip.id, transport.id),
            lat: transport.dep_lat ?? 0,
            lng: transport.dep_lng ?? 0,
        });

        if (arrKey && arrKey !== depKey) {
            pushItem(arrKey, {
                kind: 'transport-arrival',
                id: transport.id,
                title: transport.title,
                label: 'Arrivo',
                time: arrTime || undefined,
                sortKey: sortKeyFromTime(arrTime),
                href: appRoutes.transportDetails(trip.id, transport.id),
                lat: transport.dep_lat ?? 0,
                lng: transport.dep_lng ?? 0,
            });
        }
    }

    return dateOptions.map(opt => ({
        date: opt.id,
        label: tabLabelForDate(opt.id),
        items: (buckets.get(opt.id) || []).sort((a, b) => a.sortKey - b.sortKey),
    }));
};

/**
 * Indice del tab da selezionare di default: oggi se rientra nel viaggio, altrimenti il primo giorno.
 */
export const findInitialTabIndex = (days: ItineraryDay[]): number => {
    if (days.length === 0) return 0;
    const todayKey = toLocalISOString(new Date());
    return Math.max(0, days.findIndex(d => d.date === todayKey));
};
