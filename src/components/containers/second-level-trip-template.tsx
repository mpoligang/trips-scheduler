import { PathItem } from "@/models/PathItem";
import GenericLayout from "./generic-container"
import { useTrip } from "@/context/tripContext";
import { BiDetail, BiTrip } from "react-icons/bi";
import { ImAttachment } from "react-icons/im";
import { PiBrain } from "react-icons/pi";
import { appRoutes } from "@/utils/appRoutes";
import { BsTruckFront } from "react-icons/bs";
import { FiShoppingCart, FiMap } from "react-icons/fi";
import { MdOutlineTipsAndUpdates } from "react-icons/md";
import { RiHotelLine } from "react-icons/ri";



interface SecondLevelTripTemplateProps {
    readonly breadcrumb: PathItem[];
    readonly detailId?: string;
    readonly sectionPath?: string;
    readonly children: React.ReactNode;
    readonly withAttachments?: boolean;
    readonly withAI?: boolean;
    readonly backToItem?: Partial<PathItem>;
}


const SecondLevelTripTemplate = ({ breadcrumb, children, detailId, sectionPath, backToItem, withAI = true, withAttachments = true }: SecondLevelTripTemplateProps) => {

    const { trip } = useTrip();

    const menuItems: PathItem[] = [
        { label: 'Dettaglio', icon: BiDetail, href: `/dashboard/trips/${trip?.id}/${sectionPath || ''}/${detailId || ''}/details` },
    ];

    if (withAttachments) {
        menuItems.push({ label: 'Allegati', icon: ImAttachment, href: `/dashboard/trips/${trip?.id}/${sectionPath || ''}/${detailId || ''}/attachments` });
    }

    if (withAI) {
        menuItems.push({ label: 'Informazioni AI', icon: PiBrain, href: `/dashboard/trips/${trip?.id}/${sectionPath || ''}/${detailId || ''}/ai/new` });
    }


    const mobileMenuItems = [
        { id: 'itinerary', label: 'Itinerario', icon: BiTrip, href: appRoutes.stages(trip?.id || '') },
        { id: 'accommodations', label: 'Alloggi', icon: RiHotelLine, href: appRoutes.accommodations(trip?.id || '') },
        { id: 'transports', label: 'Trasporti', icon: BsTruckFront, href: appRoutes.transports(trip?.id || '') },
        { id: 'recommended', label: 'Consigliati', icon: MdOutlineTipsAndUpdates, href: appRoutes.recommended(trip?.id || '') },
        { id: 'expenses', label: 'Spese', icon: FiShoppingCart, href: appRoutes.expenses(trip?.id || '') },
        { id: 'map', label: 'Mappa del Viaggio', icon: FiMap, href: appRoutes.mapTrip(trip?.id || '') },
    ];



    return (
        <GenericLayout menuItems={menuItems} breadcrumb={breadcrumb} backToItem={backToItem} mobileMenuItems={mobileMenuItems}>
            {children}
        </GenericLayout>
    );
};

export default SecondLevelTripTemplate;