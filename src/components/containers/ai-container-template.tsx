import { PathItem } from "@/models/PathItem";
import GenericLayout from "./generic-container"
import { useTrip } from "@/context/tripContext";
import { BiBrain } from "react-icons/bi";
import { EntityKeys } from "@/utils/entityKeys";
import { appRoutes } from "@/utils/appRoutes";
import { AISearchRequest } from "@/models/AIStageSuggestion";
import { LiaSmsSolid } from "react-icons/lia";
import { formatDate } from "@/utils/dateTripUtils";
import { useAuth } from "@/context/authProvider";
import PlaceholderCard from "../cards/placeholder-card";
import { FaKey } from "react-icons/fa";
import HowToObtainAIApiKeyModal from "../modals/how-obtain-ai-api-key";
import { useState } from "react";
import Button from "../actions/button";



interface AIContainerTemplateProps {
    readonly detailId?: string;
    readonly sectionPath?: string;
    readonly children: React.ReactNode;
}


const AIContainerTemplate = ({ children, detailId, sectionPath }: AIContainerTemplateProps) => {

    const { trip } = useTrip();
    const { userData } = useAuth();

    const [openHowToObtainAIModal, setOpenHowToObtainAIModal] = useState(false);

    const menuItems: PathItem[] = [
        { label: 'Genera AI Info', icon: BiBrain, href: appRoutes.aiInfo(trip?.id as string, sectionPath as string, detailId as string, 'new') },
    ];

    const getFirstLevelBySectionPath = (sectionPath?: string): { label: string; href: string } => {
        switch (sectionPath) {
            case EntityKeys.accommodationsKey:
                return { label: 'Alloggi', href: appRoutes.accommodations(trip?.id as string) };
            case EntityKeys.transportsKey:
                return { label: 'Trasporti', href: appRoutes.transports(trip?.id as string) };
            case EntityKeys.stagesKey:
                return { label: 'Tappe del viaggio', href: appRoutes.stages(trip?.id as string) };
            default:
                return { label: '', href: '' };
        }
    }

    const getSecondLevelBySectionPath = (sectionPath?: string): { label: string; href: string } => {
        switch (sectionPath) {
            case EntityKeys.accommodationsKey:
                {
                    const accommodation = trip?.accommodations?.find(acc => acc.id === detailId);
                    return { label: accommodation?.name || 'Nuovo Alloggio', href: appRoutes.accommodationDetails(trip?.id as string, detailId as string) };
                }
            case EntityKeys.transportsKey:
                {
                    const transport = trip?.transports?.find(tr => tr.id === detailId);
                    return { label: transport?.title || 'Nuovo Trasporto', href: appRoutes.transportDetails(trip?.id as string, detailId as string) };
                }
            case EntityKeys.stagesKey:
                {
                    const stage = trip?.stages?.find(st => st.id === detailId);
                    return { label: stage?.name || 'Nuova Tappa', href: appRoutes.stageDetails(trip?.id as string, detailId as string) };
                }
            default:
                return { label: '', href: '' };
        }
    }


    const getBackToItem = (): { label: string; href: string } => {
        let href = '';
        switch (sectionPath) {
            case EntityKeys.accommodationsKey:
                href = appRoutes.accommodationDetails(trip?.id as string, detailId as string)
                break;
            case EntityKeys.transportsKey:
                href = appRoutes.transportDetails(trip?.id as string, detailId as string)
                break;
            case EntityKeys.stagesKey:
                href = appRoutes.stageDetails(trip?.id as string, detailId as string)
                break;
        }

        return {
            label: getSecondLevelBySectionPath(sectionPath).label ? `${getSecondLevelBySectionPath(sectionPath).label}` : '',
            href
        }
    }

    const getMenuItems = (): PathItem[] => {
        let search_requests: AISearchRequest[] = [];
        switch (sectionPath) {
            case EntityKeys.accommodationsKey:
                search_requests = (trip?.ai_search_requests || []).filter(req => req.accommodation_id === detailId);
                break;
            case EntityKeys.transportsKey:
                search_requests = (trip?.ai_search_requests || []).filter(req => req.transport_id === detailId);
                break;
            case EntityKeys.stagesKey:
                search_requests = (trip?.ai_search_requests || []).filter(req => req.stage_id === detailId);
                break;
        }

        return search_requests.map(req => ({
            label: formatDate(req.created_at),
            icon: LiaSmsSolid,
            href: appRoutes.aiInfo(trip?.id as string, sectionPath as string, detailId as string, req.id as string)
        }));
    }

    const breadcrumb = [
        {
            label: '..',
            href: appRoutes.home
        },
        {
            label: '..',
            href: appRoutes.tripDetails(trip?.id as string)
        },
        {
            ...getFirstLevelBySectionPath(sectionPath)
        },
        {
            ...getSecondLevelBySectionPath(sectionPath)
        },
        {
            label: 'Informazioni AI',
            href: `#`
        }
    ];

    menuItems.push(...getMenuItems());

    return (
        <GenericLayout menuItems={menuItems} breadcrumb={breadcrumb} backToItem={getBackToItem()}>
            <>
                {
                    userData?.ai_api_key ? (
                        <>
                            {children}
                        </>
                    ) : (
                        <PlaceholderCard icon={FaKey} title="Chiave API Necessaria" description="Per utilizzare questa funzionalità, è necessaria una chiave API valida.">

                            <Button
                                variant="secondary"
                                size="sm"
                                className="mt-6 w-60 h-10"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    setOpenHowToObtainAIModal(true);
                                    e.preventDefault();
                                }}
                            >
                                <FaKey className="mr-2" />
                                Come Ottenere l&apos;API Key Gratis
                            </Button>
                        </PlaceholderCard>
                    )
                }


                <HowToObtainAIApiKeyModal
                    isOpen={openHowToObtainAIModal}
                    setIsOpen={setOpenHowToObtainAIModal}
                />
            </>


        </GenericLayout>
    );
};

export default AIContainerTemplate;