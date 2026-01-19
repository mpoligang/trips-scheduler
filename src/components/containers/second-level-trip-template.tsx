import { PathItem } from "@/models/PathItem";
import TripLayout from "./trip-container"
import { useTrip } from "@/context/tripContext";
import { BiDetail } from "react-icons/bi";
import { ImAttachment } from "react-icons/im";
import { PiBrain } from "react-icons/pi";



interface SecondLevelTripTemplateProps {
    readonly breadcrumb: PathItem[];
    readonly detailId?: string;
    readonly sectionPath?: string;
    readonly children: React.ReactNode;
    readonly withAttachments?: boolean;
    readonly backToItem?: Partial<PathItem>;
}


const SecondLevelTripTemplate = ({ breadcrumb, children, detailId, sectionPath, backToItem }: SecondLevelTripTemplateProps) => {

    const { trip } = useTrip();

    const menuItems: PathItem[] = [
        { label: 'Dettaglio', icon: BiDetail, href: `/dashboard/trips/${trip?.id}/${sectionPath || ''}/${detailId || ''}/details` },
        { label: 'Allegati', icon: ImAttachment, href: `/dashboard/trips/${trip?.id}/${sectionPath || ''}/${detailId || ''}/attachments` },
        { label: 'Informazioni AI', icon: PiBrain, href: `/dashboard/trips/${trip?.id}/${sectionPath || ''}/${detailId || ''}/ai` },
    ];

    return (
        <TripLayout menuItems={menuItems} breadcrumb={breadcrumb} backToItem={backToItem}>
            {children}
        </TripLayout>
    );
};

export default SecondLevelTripTemplate;