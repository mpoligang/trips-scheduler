import { useMemo, useState } from "react";
import { PathItem } from "@/models/PathItem";
import GenericLayout from "./generic-container"; // Verifica il percorso
import { useTrip } from "@/context/tripContext";
import { BiBrain, BiTrip } from "react-icons/bi";
import { EntityKeys } from "@/utils/entityKeys";
import { appRoutes } from "@/utils/appRoutes";
import { AISearchRequest } from "@/models/AIStageSuggestion";
import { LiaSmsSolid } from "react-icons/lia";
import { formatDate } from "@/utils/dateTripUtils";
import { useAuth } from "@/context/authProvider";
import PlaceholderCard from "../cards/placeholder-card";
import { FaKey } from "react-icons/fa";
import HowToObtainAIApiKeyModal from "../modals/how-obtain-ai-api-key";
import Button from "../actions/button";
import { BsTruckFront } from "react-icons/bs";
import { FiShoppingCart, FiMap } from "react-icons/fi";
import { MdOutlineTipsAndUpdates } from "react-icons/md";
import { RiHotelLine } from "react-icons/ri";

interface AIContainerTemplateProps {
    readonly detailId?: string;
    readonly sectionPath?: string;
    readonly children: React.ReactNode;
}

const AIContainerTemplate = ({ children, detailId, sectionPath }: AIContainerTemplateProps) => {

    const { trip } = useTrip();
    const { userData } = useAuth();
    const [openHowToObtainAIModal, setOpenHowToObtainAIModal] = useState(false);

    // --- 1. Gestione Menu Laterale (Sidebar) ---
    const menuItems = useMemo((): PathItem[] => {
        // Voce fissa per generare nuovi suggerimenti
        const staticItems: PathItem[] = [
            {
                label: 'Genera AI Info',
                icon: BiBrain,
                href: appRoutes.aiInfo(trip?.id as string, sectionPath as string, detailId as string, 'new')
            },
        ];

        // Recupero e filtro le richieste
        const allRequests = trip?.ai_search_requests || [];
        let filteredRequests: AISearchRequest[] = [];

        switch (sectionPath) {
            case EntityKeys.accommodationsKey:
                filteredRequests = allRequests.filter(req => req.accommodation_id === detailId);
                break;
            case EntityKeys.transportsKey:
                filteredRequests = allRequests.filter(req => req.transport_id === detailId);
                break;
            case EntityKeys.stagesKey:
                filteredRequests = allRequests.filter(req => req.stage_id === detailId);
                break;
        }

        // Mapping dei risultati storici
        const historyItems = filteredRequests.map(req => ({
            label: formatDate(req.created_at),
            icon: LiaSmsSolid,
            href: appRoutes.aiInfo(trip?.id as string, sectionPath as string, detailId as string, req.id as string)
        }));

        // Unione menu fisso + storico
        return [...staticItems, ...historyItems];

        // IMPORTANTE: trip?.ai_search_requests deve essere qui per scatenare l'aggiornamento dopo il delete
    }, [trip?.ai_search_requests, trip?.id, detailId, sectionPath]);


    // --- 2. Gestione Breadcrumb e Back Link ---
    // Memoizziamo anche questi per evitare calcoli inutili ad ogni render
    const navigationData = useMemo(() => {
        const getFirstLevel = () => {
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
        };

        const getSecondLevel = () => {
            switch (sectionPath) {
                case EntityKeys.accommodationsKey: {
                    const acc = trip?.accommodations?.find(a => a.id === detailId);
                    return { label: acc?.name || 'Nuovo Alloggio', href: appRoutes.accommodationDetails(trip?.id as string, detailId as string) };
                }
                case EntityKeys.transportsKey: {
                    const tr = trip?.transports?.find(t => t.id === detailId);
                    return { label: tr?.title || 'Nuovo Trasporto', href: appRoutes.transportDetails(trip?.id as string, detailId as string) };
                }
                case EntityKeys.stagesKey: {
                    const st = trip?.stages?.find(s => s.id === detailId);
                    return { label: st?.name || 'Nuova Tappa', href: appRoutes.stageDetails(trip?.id as string, detailId as string) };
                }
                default:
                    return { label: '', href: '' };
            }
        };

        const firstLevel = getFirstLevel();
        const secondLevel = getSecondLevel();

        const breadcrumb = [
            { label: '..', href: appRoutes.home },
            { label: '..', href: appRoutes.tripDetails(trip?.id as string) },
            { ...firstLevel },
            { ...secondLevel },
            { label: 'Informazioni AI', href: `#` }
        ];

        return { breadcrumb, backToLabel: secondLevel.label, backToHref: secondLevel.href };
    }, [trip, sectionPath, detailId]);

    const mobileMenuItems = [
        { id: 'itinerary', label: 'Itinerario', icon: BiTrip, href: appRoutes.stages(trip?.id || '') },
        { id: 'accommodations', label: 'Alloggi', icon: RiHotelLine, href: appRoutes.accommodations(trip?.id || '') },
        { id: 'transports', label: 'Trasporti', icon: BsTruckFront, href: appRoutes.transports(trip?.id || '') },
        { id: 'recommended', label: 'Consigliati', icon: MdOutlineTipsAndUpdates, href: appRoutes.recommended(trip?.id || '') },
        { id: 'expenses', label: 'Spese', icon: FiShoppingCart, href: appRoutes.expenses(trip?.id || '') },
        { id: 'map', label: 'Mappa del Viaggio', icon: FiMap, href: appRoutes.mapTrip(trip?.id || '') },
    ];



    return (
        <GenericLayout
            menuItems={menuItems}
            breadcrumb={navigationData.breadcrumb}
            backToItem={{ label: navigationData.backToLabel, href: navigationData.backToHref }}
            mobileMenuItems={mobileMenuItems}
        >
            <>
                {userData?.ai_api_key ? (
                    children
                ) : (
                    <PlaceholderCard
                        icon={FaKey}
                        title="Chiave API Necessaria"
                        description="Per utilizzare questa funzionalità, è necessaria una chiave API valida."
                    >
                        <Button
                            variant="secondary"
                            size="sm"
                            className="mt-6 w-60 h-10"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.preventDefault();
                                setOpenHowToObtainAIModal(true);
                            }}
                        >
                            <FaKey className="mr-2" />
                            Come Ottenere l&apos;API Key Gratis
                        </Button>
                    </PlaceholderCard>
                )}

                <HowToObtainAIApiKeyModal
                    isOpen={openHowToObtainAIModal}
                    setIsOpen={setOpenHowToObtainAIModal}
                />
            </>
        </GenericLayout>
    );
};

export default AIContainerTemplate;