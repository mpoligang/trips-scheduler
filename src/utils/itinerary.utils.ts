import { Trip } from '@/models/Trip';
import { ItineraryDay, ItineraryItem } from '@/models/ItineraryItem';
import { extractTimeFromDate, generateDateOptions, toLocalISOString } from './dateTripUtils';
import { appRoutes } from './appRoutes';

const NO_TIME_SORT_KEY = 24 * 60;
// Marcatori del soggiorno nei giorni intermedi: l'inizio sta prima di ogni orario,
// la fine dopo qualunque attività (anche quelle senza orario).
const STAY_START_SORT_KEY = -1;
const STAY_END_SORT_KEY = NO_TIME_SORT_KEY + 1;

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

type PushItem = (dateKey: string | undefined, item: ItineraryItem) => void;

const collectStageItems = (trip: Trip, pushItem: PushItem) => {
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
};

const collectAccommodationItems = (trip: Trip, dayKeys: string[], pushItem: PushItem) => {
    for (const acc of trip.accommodations || []) {
        const startKey = dateKeyFromTimestamp(acc.start_date);
        const endKey = dateKeyFromTimestamp(acc.end_date);
        const endTime = extractTimeFromDate(acc.end_date);
        // Sul primo giorno l'alloggio si posiziona secondo l'orario di arrivo, se impostato;
        // altrimenti ricade sull'ora di check-in.
        const arrivalSortTime = acc.arrival_time || extractTimeFromDate(acc.start_date);
        const href = appRoutes.accommodationDetails(trip.id, acc.id);
        const lat = acc.lat ?? 0;
        const lng = acc.lng ?? 0;

        pushItem(startKey, {
            kind: 'accommodation-checkin',
            id: acc.id,
            title: acc.name,
            label: 'Check-in',
            time: arrivalSortTime || undefined,
            sortKey: sortKeyFromTime(arrivalSortTime),
            href, lat, lng,
        });

        if (endKey) {
            pushItem(endKey, {
                kind: 'accommodation-checkout',
                id: acc.id,
                title: acc.name,
                label: 'Check-out',
                time: endTime || undefined,
                sortKey: sortKeyFromTime(endTime),
                href, lat, lng,
            });
        }

        // Giorni intermedi pieni (tra check-in e check-out esclusi): l'alloggio
        // compare a inizio (mattina) e a fine (notte) di ogni giornata.
        const startIdx = startKey ? dayKeys.indexOf(startKey) : -1;
        const endIdx = endKey ? dayKeys.indexOf(endKey) : -1;
        if (startIdx === -1 || endIdx === -1) continue;
        for (let i = startIdx + 1; i < endIdx; i++) {
            pushItem(dayKeys[i], {
                kind: 'accommodation-stay-start',
                id: acc.id,
                title: acc.name,
                label: 'Soggiorno',
                sortKey: STAY_START_SORT_KEY,
                href, lat, lng,
            });
            pushItem(dayKeys[i], {
                kind: 'accommodation-stay-end',
                id: acc.id,
                title: acc.name,
                label: 'Pernottamento',
                sortKey: STAY_END_SORT_KEY,
                href, lat, lng,
            });
        }
    }
};

const collectTransportItems = (trip: Trip, pushItem: PushItem) => {
    for (const transport of trip.transports || []) {
        const depKey = dateKeyFromTimestamp(transport.dep_date);
        const arrKey = dateKeyFromTimestamp(transport.arr_date);
        const depTime = extractTimeFromDate(transport.dep_date);
        const arrTime = extractTimeFromDate(transport.arr_date);
        const href = appRoutes.transportDetails(trip.id, transport.id);
        const lat = transport.dep_lat ?? 0;
        const lng = transport.dep_lng ?? 0;

        pushItem(depKey, {
            kind: 'transport-departure',
            id: transport.id,
            title: transport.title,
            label: 'Partenza',
            time: depTime || undefined,
            sortKey: sortKeyFromTime(depTime),
            href, lat, lng,
        });

        if (arrKey && arrKey !== depKey) {
            pushItem(arrKey, {
                kind: 'transport-arrival',
                id: transport.id,
                title: transport.title,
                label: 'Arrivo',
                time: arrTime || undefined,
                sortKey: sortKeyFromTime(arrTime),
                href, lat, lng,
            });
        }
    }
};

export const buildItinerary = (trip: Trip | null | undefined): ItineraryDay[] => {
    if (!trip?.start_date || !trip?.end_date) return [];

    const dateOptions = generateDateOptions(new Date(trip.start_date), new Date(trip.end_date));

    const buckets = new Map<string, ItineraryItem[]>();
    const dayKeys = dateOptions.map(opt => opt.id);
    for (const opt of dateOptions) {
        buckets.set(opt.id, []);
    }

    const pushItem: PushItem = (dateKey, item) => {
        if (!dateKey) return;
        const list = buckets.get(dateKey);
        if (!list) return;
        list.push(item);
    };

    collectStageItems(trip, pushItem);
    collectAccommodationItems(trip, dayKeys, pushItem);
    collectTransportItems(trip, pushItem);

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
