'use client';

import { appRoutes } from '@/utils/appRoutes';
import { PathItem } from '@/models/PathItem';
import { useTrip } from '@/context/tripContext';
import FirstLevelTripTemplate from '@/components/containers/first-level-trip-template';
import ItineraryView from '@/components/list/itinerary-view';

export default function ItineraryPage() {
    const { trip } = useTrip();
    const breadcrumbPaths: PathItem[] = [
        { label: 'I miei viaggi', href: appRoutes.home },
        { label: trip?.name || 'Dettaglio Viaggio', href: '#' },
        { label: 'Itinerario', href: '#' },
    ];

    return (
        <FirstLevelTripTemplate breadcrumb={breadcrumbPaths}>
            <ItineraryView />
        </FirstLevelTripTemplate>
    );
}
