'use client';

import { useTrip } from "@/context/tripContext";
import { PathItem } from "@/models/PathItem";
import { appRoutes } from "@/utils/appRoutes";
import { useParams } from "next/navigation";
import SecondLevelTripTemplate from "../containers/second-level-trip-template";

const TransportTemplatePage = ({ children }: Readonly<{ children: React.ReactNode }>) => {

    const { trip } = useTrip();
    const params = useParams();
    const transportId = params.id as string;
    const transport = trip?.transports?.find(tr => tr.id === transportId);

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
            label: 'Trasporti',
            href: appRoutes.transports(trip?.id as string)
        },
        {
            label: transport?.title || 'Nuovo Trasporto',
            href: '#'
        }
    ];

    const backToItem: Partial<PathItem> = {
        label: 'Torna ai Trasporti',
        href: appRoutes.transports(trip?.id as string)
    };


    return (
        <SecondLevelTripTemplate breadcrumb={breadcrumbPaths} sectionPath="transports" detailId={transportId} backToItem={backToItem}>
            {children}
        </SecondLevelTripTemplate>
    )
}

export default TransportTemplatePage;