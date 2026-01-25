'use client';

import React from 'react';
import { appRoutes } from "@/utils/appRoutes";
import { PathItem } from "@/models/PathItem";
import { useTrip } from '@/context/tripContext';
import TransportsList from '@/components/list/transport-list';
import FirstLevelTripTemplate from '@/components/containers/first-level-trip-template';


export default function TransportsPage() {
    const { trip } = useTrip();

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
            label: 'Trasporti',
            href: '#'
        }
    ];

    return (
        <FirstLevelTripTemplate
            breadcrumb={breadcrumbPaths}
        >
            <TransportsList />
        </FirstLevelTripTemplate>
    );
}

