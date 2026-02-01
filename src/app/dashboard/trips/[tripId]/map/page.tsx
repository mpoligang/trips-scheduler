'use client';

import FirstLevelTripTemplate from "@/components/containers/first-level-trip-template";
import PageTitle from "@/components/generics/page-title";
import { appRoutes } from "@/utils/appRoutes";
import dynamic from "next/dynamic";

const TripMap = dynamic(
    () => import("@/components/maps/map-bound"),
    { ssr: false }
);

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