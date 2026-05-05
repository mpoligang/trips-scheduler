'use client';

import { Fragment, ReactNode, useMemo } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { RiHotelLine } from 'react-icons/ri';
import { BsTruckFront } from 'react-icons/bs';

import { useTrip } from '@/context/tripContext';
import { ItineraryDay, ItineraryItem, ItineraryKind } from '@/models/ItineraryItem';
import { ROUTING_MODES, RoutingMode, StageLeg } from '@/models/StageLeg';
import { buildItinerary, findInitialTabIndex } from '@/utils/itinerary.utils';

import Tabs, { TabItem } from '@/components/navigations/tabs';
import DetailItemCard from '@/components/cards/detail-item-card';
import EmptyData from '@/components/cards/empty-data';
import PageTitle from '@/components/generics/page-title';
import FormSection from '@/components/generics/form-section';
import LegRow from './leg-row';

const ICON_BY_KIND: Record<ItineraryKind, ReactNode> = {
    'stage': <FaMapMarkerAlt className="h-5 w-5" />,
    'accommodation-checkin': <RiHotelLine className="h-5 w-5" />,
    'accommodation-checkout': <RiHotelLine className="h-5 w-5" />,
    'transport-departure': <BsTruckFront className="h-5 w-5" />,
    'transport-arrival': <BsTruckFront className="h-5 w-5" />,
};

const buildSubtitle = (item: ItineraryItem): string | undefined => {
    if (item.label && item.time) return `${item.label} · ${item.time}`;
    if (item.label) return item.label;
    if (item.time) return item.time;
    return undefined;
};

const formatFullItalianDate = (dateKey: string): string => {
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
};

const isValidMode = (m: string | null | undefined): m is RoutingMode =>
    typeof m === 'string' && (ROUTING_MODES as string[]).includes(m);

interface ItineraryDayPanelProps {
    readonly tripId: string;
    readonly day: ItineraryDay;
    readonly legsByPairMode: Map<string, StageLeg>;
    readonly defaultMode: RoutingMode;
}

function ItineraryDayPanel({ tripId, day, legsByPairMode, defaultMode }: ItineraryDayPanelProps) {
    return (
        <FormSection title={formatFullItalianDate(day.date)} className="capitalize">
            {day.items.length === 0 ? (
                <EmptyData title="Giornata libera" subtitle="Nessuna attività pianificata per questo giorno." />
            ) : (
                <ul className="space-y-4 pl-4 border-l-2 border-gray-600">
                    {day.items.map((item, idx) => {
                        const next = day.items[idx + 1];
                        // Mostriamo la leg solo tra due tappe consecutive: gli alloggi
                        // e i trasporti hanno semantiche proprie e non aggiungono leg.
                        const showLeg = item.kind === 'stage' && next?.kind === 'stage';

                        return (
                            <Fragment key={`${item.kind}-${item.id}`}>
                                <DetailItemCard
                                    icon={ICON_BY_KIND[item.kind]}
                                    title={item.title}
                                    subtitle={buildSubtitle(item)}
                                    detailClick={item.href}
                                    latitude={item.lat}
                                    longitude={item.lng}
                                />
                                {showLeg && (
                                    <li className="list-none">
                                        <LegRow
                                            tripId={tripId}
                                            fromStageId={item.id}
                                            toStageId={next.id}
                                            from={{ lat: item.lat, lng: item.lng }}
                                            to={{ lat: next.lat, lng: next.lng }}
                                            preferredMode={defaultMode}
                                            legsByPairMode={legsByPairMode}
                                        />
                                    </li>
                                )}
                            </Fragment>
                        );
                    })}
                </ul>
            )}
        </FormSection>
    );
}

export default function ItineraryView() {
    const { trip } = useTrip();

    const days = useMemo(() => buildItinerary(trip), [trip]);
    const defaultIndex = useMemo(() => findInitialTabIndex(days), [days]);

    const defaultMode: RoutingMode = isValidMode(trip?.default_routing_mode) ? trip.default_routing_mode : 'walking';

    // Mappa O(1) per (coppia, modalità) → leg cached in DB.
    // Il pattern key with mode permette switch istantaneo tra modalità già calcolate.
    const legsByPairMode = useMemo(() => {
        const map = new Map<string, StageLeg>();
        for (const leg of trip?.stage_legs || []) {
            map.set(`${leg.from_stage_id}|${leg.to_stage_id}|${leg.mode}`, leg);
        }
        return map;
    }, [trip?.stage_legs]);

    const tripId = trip?.id || '';

    const tabs: TabItem[] = useMemo(
        () => days.map(day => ({
            label: day.label,
            content: (
                <ItineraryDayPanel
                    tripId={tripId}
                    day={day}
                    legsByPairMode={legsByPairMode}
                    defaultMode={defaultMode}
                />
            ),
        })),
        [days, legsByPairMode, defaultMode, tripId]
    );

    return (
        <div>
            <PageTitle title="Itinerario" subtitle="Tutto ciò che farai, giorno per giorno." />
            {tabs.length > 0 ? (
                <Tabs tabs={tabs} defaultIndex={defaultIndex} />
            ) : (
                <EmptyData title="Itinerario vuoto" subtitle="Imposta le date del viaggio per iniziare a pianificare." />
            )}
        </div>
    );
}
