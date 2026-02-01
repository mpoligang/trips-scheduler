'use client';

import FirstLevelTripTemplate from "@/components/containers/first-level-trip-template";
import PageTitle from "@/components/generics/page-title";
import { useTrip } from "@/context/tripContext";
import { appRoutes } from "@/utils/appRoutes";
import dynamic from "next/dynamic";

const TripMap = dynamic(
    () => import("@/components/maps/map-bound"),
    { ssr: false }
);

export default function MapPage() {
    const { trip } = useTrip();
    return (
        <FirstLevelTripTemplate
            breadcrumb={
                [
                    {
                        label: 'I miei viaggi', href: appRoutes.home
                    },
                    {
                        label: trip?.name || 'Dettagli Viaggio',
                        href: appRoutes.tripDetails(trip?.id || '')
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