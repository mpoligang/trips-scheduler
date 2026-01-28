'use client';

import FirstLevelTripTemplate from "@/components/containers/first-level-trip-template";
import PageTitle from "@/components/generics/page-title";
import TripMap from "@/components/maps/map-bound";
import { appRoutes } from "@/utils/appRoutes";

export default function MapPage() {
    return (
        <FirstLevelTripTemplate
            breadcrumb={
                [
                    {
                        label: 'I miei viaggi', href: appRoutes.home
                    },
                    {
                        label: 'Mappa del Viaggio', href: ''
                    }
                ]
            }
        >
            <PageTitle title="Mappa del Viaggio" subtitle="Visualizza il percorso e i punti di interesse" />
            <TripMap />
        </FirstLevelTripTemplate>
    );
}