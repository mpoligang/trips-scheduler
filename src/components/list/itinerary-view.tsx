'use client';

import { ReactNode, useMemo } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { RiHotelLine } from 'react-icons/ri';
import { BsTruckFront } from 'react-icons/bs';

import { useTrip } from '@/context/tripContext';
import { ItineraryDay, ItineraryItem, ItineraryKind } from '@/models/ItineraryItem';
import { buildItinerary, findInitialTabIndex } from '@/utils/itinerary.utils';

import Tabs, { TabItem } from '@/components/navigations/tabs';
import DetailItemCard from '@/components/cards/detail-item-card';
import EmptyData from '@/components/cards/empty-data';
import PageTitle from '@/components/generics/page-title';
import FormSection from '@/components/generics/form-section';

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

interface ItineraryDayPanelProps {
    readonly day: ItineraryDay;
}

function ItineraryDayPanel({ day }: ItineraryDayPanelProps) {
    return (
        <FormSection title={formatFullItalianDate(day.date)} className="capitalize">
            {day.items.length === 0 ? (
                <EmptyData title="Giornata libera" subtitle="Nessuna attività pianificata per questo giorno." />
            ) : (
                <ul className="space-y-4 pl-4 border-l-2 border-gray-600">
                    {day.items.map(item => (
                        <DetailItemCard
                            key={`${item.kind}-${item.id}`}
                            icon={ICON_BY_KIND[item.kind]}
                            title={item.title}
                            subtitle={buildSubtitle(item)}
                            detailClick={item.href}
                            latitude={item.lat}
                            longitude={item.lng}
                        />
                    ))}
                </ul>
            )}
        </FormSection>
    );
}

export default function ItineraryView() {
    const { trip } = useTrip();

    const days = useMemo(() => buildItinerary(trip), [trip]);
    const defaultIndex = useMemo(() => findInitialTabIndex(days), [days]);

    const tabs: TabItem[] = useMemo(
        () => days.map(day => ({
            label: day.label,
            content: <ItineraryDayPanel day={day} />,
        })),
        [days]
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
