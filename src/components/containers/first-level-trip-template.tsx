import { PathItem } from "@/models/PathItem";
import TripLayout from "./trip-container"
import { useTrip } from "@/context/tripContext";
import { RiHotelLine } from "react-icons/ri";
import { BiTrip } from "react-icons/bi";
import { BsTruckFront } from "react-icons/bs";
import { FiUsers } from "react-icons/fi";
import { appRoutes } from "@/utils/appRoutes";
import { FaPlus } from "react-icons/fa";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
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
            { label: 'Aggiungi Viaggio', icon: FaPlus, href: appRoutes.settings('new') },
        );

    } else {

        menuItems.push(
            { label: 'Itinerario', icon: BiTrip, href: appRoutes.stages(trip?.id || '') },
            { label: 'Alloggi', icon: RiHotelLine, href: appRoutes.accommodations(trip?.id || '') },
            { label: 'Trasporti', icon: BsTruckFront, href: appRoutes.transports(trip?.id || '') },
            { label: 'Membri', icon: FiUsers, href: appRoutes.members(trip?.id || '') },
        );

        if (isOwner) {
            menuItems.push(
                { label: 'Impostazioni', icon: HiOutlineCog6Tooth, href: appRoutes.settings(trip?.id || '') },
            );
        }
    }



    return (
        <TripLayout menuItems={menuItems} breadcrumb={breadcrumb}
            backToItem={{ label: 'Torna alla Dashboard', href: appRoutes.home }}>
            {children}
        </TripLayout>
    );
};

export default FirstLevelTripTemplate;