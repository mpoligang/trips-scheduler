'use client';

import { useParams } from "next/navigation";
import AttachmentsManager from "@/components/cards/attachment-manager";
import AccomodationDetailsTemplatePage from "@/components/templates/accommodation-template";
import { useTrip } from "@/context/tripContext";

const AccommodationAttachmentsPage = () => {
    // Recuperiamo i dati dal context (già popolati con la join degli attachments)
    const { accommodations } = useTrip();

    const params = useParams();
    const accommodationId = params.id as string;

    // Troviamo l'alloggio corrente per estrarre gli allegati e il titolo
    const currentAccommodation = accommodations?.find(acc => acc.id === accommodationId);
    const attachments = currentAccommodation?.attachments || [];

    return (
        <AccomodationDetailsTemplatePage>
            <AttachmentsManager
                pageTitle="Gestione Allegati"
                subtitle="Carica, visualizza e gestisci gli allegati relativi a questo alloggio."
                attachments={attachments}
                relatedId={accommodationId} // ID dell'alloggio per la FK
                type="accommodation"        // Indica al manager di usare la colonna accommodation_id
            />
        </AccomodationDetailsTemplatePage>
    );
};

export default AccommodationAttachmentsPage;