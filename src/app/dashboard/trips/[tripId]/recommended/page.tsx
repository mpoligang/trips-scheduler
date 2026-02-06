'use client';

import React from 'react';
import { appRoutes } from "@/utils/appRoutes";
import { PathItem } from "@/models/PathItem";
import { useTrip } from '@/context/tripContext';
import FirstLevelTripTemplate from '@/components/containers/first-level-trip-template';
import RecommendedList from '@/components/list/recommended-list';


export default function RecommendedPage() {
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
            label: 'Consigliati',
            href: '#'
        }
    ];

    return (
        <FirstLevelTripTemplate
            breadcrumb={breadcrumbPaths}
        >
            <RecommendedList />
        </FirstLevelTripTemplate>
    );
}

