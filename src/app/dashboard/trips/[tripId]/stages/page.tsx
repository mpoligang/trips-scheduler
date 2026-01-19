'use client';

import React from 'react';
import { appRoutes } from "@/utils/appRoutes";
import { PathItem } from "@/models/PathItem";
import { useTrip } from '@/context/tripContext';
import StagesList from '@/components/list/stages-list';
import FirstLevelTripTemplate from '@/components/containers/first-level-trip-template';


export default function StagesPage() {
    const { trip, isOwner } = useTrip();
    const tripId = trip?.id as string;
    const breadcrumbPaths: PathItem[] = [
        {
            label: 'I miei viaggi',
            href: appRoutes.home
        },
        {
            label: trip?.name || 'Dettaglio Viaggio',
            href: '#'
        },
        {
            label: 'Tappe del viaggio',
            href: '#'
        }
    ];

    return (
        <FirstLevelTripTemplate
            breadcrumb={breadcrumbPaths}
        >
            <StagesList
                isOwner={isOwner}
                tripId={tripId}
                stages={trip?.stages || []}
            />
        </FirstLevelTripTemplate>
    );
}

