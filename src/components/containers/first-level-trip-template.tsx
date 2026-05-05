import { PathItem } from "@/models/PathItem";
import GenericLayout from "./generic-container"
import { useTrip } from "@/context/tripContext";
import { RiHotelLine } from "react-icons/ri";
import { BsTruckFront } from "react-icons/bs";
import { FiMap, FiShoppingCart } from "react-icons/fi";
import { appRoutes } from "@/utils/appRoutes";
import { FaMapMarkerAlt, FaPlus, FaRegCalendarAlt } from "react-icons/fa";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import { MdOutlineTipsAndUpdates } from "react-icons/md";

import { useParams } from "next/navigation";



interface FirstLevelTripTemplateProps {
    readonly breadcrumb: PathItem[];
    children?: React.ReactNode;
}


const FirstLevelTripTemplate = ({ breadcrumb, children }: FirstLevelTripTemplateProps) => {

    const { trip, isOwner } = useTrip();
    const params = useParams();
    const tripId = params.tripId as string;
    const isNew = tripId === 'new';

    const menuItems: PathItem[] = [];

    if (isNew) {
        menuItems.push(
            { id: 'add-trip', label: 'Aggiungi Viaggio', icon: FaPlus, href: appRoutes.settings('new') },
        );

    } else {

        menuItems.push(
            { id: 'itinerary', label: 'Itinerario', icon: FaRegCalendarAlt, href: appRoutes.itinerary(trip?.id || '') },
            { id: 'stages', label: 'Tappe', icon: FaMapMarkerAlt, href: appRoutes.stages(trip?.id || '') },
            { id: 'accommodations', label: 'Alloggi', icon: RiHotelLine, href: appRoutes.accommodations(trip?.id || '') },
            { id: 'transports', label: 'Trasporti', icon: BsTruckFront, href: appRoutes.transports(trip?.id || '') },
            { id: 'recommended', label: 'Consigliati', icon: MdOutlineTipsAndUpdates, href: appRoutes.recommended(trip?.id || '') },
            { id: 'expenses', label: 'Spese', icon: FiShoppingCart, href: appRoutes.expenses(trip?.id || '') },
            { id: 'map', label: 'Mappa del Viaggio', icon: FiMap, href: appRoutes.mapTrip(trip?.id || '') },
        );

        if (isOwner) {
            menuItems.push(
                { id: 'settings', label: 'Impostazioni', icon: HiOutlineCog6Tooth, href: appRoutes.settings(trip?.id || '') },
            );
        }
    }


    const mobileMenuItems = menuItems.filter(item => item.id !== 'add-trip' && item.id !== 'settings');



    return (
        <GenericLayout menuItems={menuItems} breadcrumb={breadcrumb} mobileMenuItems={mobileMenuItems}
            backToItem={{ label: 'Torna alla Dashboard', href: appRoutes.home }}>
            {children}
        </GenericLayout>
    );
};

export default FirstLevelTripTemplate;