'use client';

import { useTrip } from "@/context/tripContext";
import { PathItem } from "@/models/PathItem";
import { appRoutes } from "@/utils/appRoutes";
import { useParams } from "next/navigation";
import SecondLevelTripTemplate from "../containers/second-level-trip-template";

const StageTemplatePage = ({ children }: Readonly<{ children: React.ReactNode }>) => {

    const { trip } = useTrip();
    const params = useParams();
    const stageId = params.id as string;
    const stage = trip?.stages?.find(st => st.id === stageId);

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
            label: 'Tappe del Viaggio',
            href: appRoutes.stages(trip?.id as string)
        },
        {
            label: stage?.name || 'Nuova Tappa',
            href: '#'
        }
    ];

    const backToItem: Partial<PathItem> = {
        label: 'Torna alle Tappe',
        href: appRoutes.stages(trip?.id as string)
    };


    return (
        <SecondLevelTripTemplate breadcrumb={breadcrumbPaths} sectionPath="stages" detailId={stageId} backToItem={backToItem}>
            {children}
        </SecondLevelTripTemplate>
    )
}

export default StageTemplatePage;