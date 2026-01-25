'use client';
import FirstLevelTripTemplate from "@/components/containers/first-level-trip-template";
import TripForm from "@/components/forms/trip-form";
import { useTrip } from "@/context/tripContext";
import { PathItem } from "@/models/PathItem";
import { appRoutes } from "@/utils/appRoutes";
import { useParams, useRouter } from "next/navigation";



const SettingsPage = () => {
    const { trip, isOwner } = useTrip();
    const router = useRouter();
    const params = useParams();
    const isNew = params.tripId as string === 'new';
    const breadcrumbPaths: PathItem[] = [];


    if (trip && !isOwner && !isNew) {
        router.push(appRoutes.home);
        return;
    }

    if (isNew) {
        breadcrumbPaths.push(
            {
                label: 'I miei viaggi',
                href: appRoutes.home
            },
            {
                label: 'Aggiungi Viaggio',
                href: '#'
            },
        );

    } else {
        breadcrumbPaths.push(
            {
                label: 'I miei viaggi',
                href: appRoutes.home
            },
            {
                label: trip?.name || 'Dettaglio Viaggio',
                href: '#'
            },
            {
                label: 'Impostazioni',
                href: '#'
            }
        );
    }

    return (
        <FirstLevelTripTemplate
            breadcrumb={breadcrumbPaths}
        >
            <TripForm />
        </FirstLevelTripTemplate>
    );
};

export default SettingsPage;