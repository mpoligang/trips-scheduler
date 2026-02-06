'use client';

import { useTrip } from "@/context/tripContext";
import { PathItem } from "@/models/PathItem";
import { appRoutes } from "@/utils/appRoutes";
import { useParams } from "next/navigation";
import SecondLevelTripTemplate from "../containers/second-level-trip-template";

const RecommendedDetailsTemplatePage = ({ children }: Readonly<{ children: React.ReactNode }>) => {

    const { trip } = useTrip();
    const params = useParams();
    const recommendedId = params.id as string;
    const recommended = trip?.recommended?.find(rec => rec.id === recommendedId);

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
            label: 'Consigliati',
            href: appRoutes.recommended(trip?.id as string)
        },
        {
            label: recommended?.title || 'Nuovo Suggerimento',
            href: '#'
        }
    ];

    const backToItem: Partial<PathItem> = {
        label: 'Torna ai Consigliati',
        href: appRoutes.recommended(trip?.id as string)
    };


    return (
        <SecondLevelTripTemplate withAI={false} withAttachments={false} breadcrumb={breadcrumbPaths} sectionPath="recommended" detailId={recommendedId} backToItem={backToItem}>
            {children}
        </SecondLevelTripTemplate>
    )
}

export default RecommendedDetailsTemplatePage;