'use client';

import { useTrip } from "@/context/tripContext";
import { PathItem } from "@/models/PathItem";
import { appRoutes } from "@/utils/appRoutes";
import { useParams } from "next/navigation";
import SecondLevelTripTemplate from "../containers/second-level-trip-template";

const AccomodationDetailsTemplatePage = ({ children }: Readonly<{ children: React.ReactNode }>) => {

    const { trip } = useTrip();
    const params = useParams();
    const accommodationId = params.id as string;
    const accommodation = trip?.accommodations?.find(acc => acc.id === accommodationId);

    const breadcrumbPaths: PathItem[] = [
        {
            label: 'I miei viaggi',
            href: appRoutes.home
        },
        {
            label: trip?.name || '..',
            href: '#'
        },
        {
            label: 'Alloggi',
            href: appRoutes.accommodations(trip?.id as string)
        },
        {
            label: accommodation?.name || 'Nuovo Alloggio',
            href: '#'
        }
    ];

    const backToItem: Partial<PathItem> = {
        label: 'Torna agli Alloggi',
        href: appRoutes.accommodations(trip?.id as string)
    };


    return (
        <SecondLevelTripTemplate breadcrumb={breadcrumbPaths} sectionPath="accommodations" detailId={accommodationId} backToItem={backToItem}>
            {children}
        </SecondLevelTripTemplate>
    )
}

export default AccomodationDetailsTemplatePage;