'use client';

import AttachmentsManager from "@/components/cards/attachment-manager";
import AccomodationDetailsTemplatePage from "@/components/templates/accommodation-template";
import { useTrip } from "@/context/tripContext";
import { db } from "@/firebase/config";
import { Attachment } from "@/models/Attachment";
import { EntityKeys } from "@/utils/entityKeys";
import { doc, updateDoc } from "firebase/firestore";
import { useParams } from "next/navigation";



const AccommodationAttachmentsPage = () => {

    const { trip, } = useTrip();

    const params = useParams();
    const accommodationId = params.id as string;
    const tripId = params.tripId as string;
    const attachments = trip?.accommodations?.find(s => s.id === (accommodationId || ''))?.attachments || [];


    const handleAttachmentsUpdate = async (newAttachments: Attachment[]) => {
        if (!trip) { return; }

        const updatedAccommodations = trip.accommodations?.map((s) => {
            if (s.id === accommodationId) {
                return { ...s, attachments: newAttachments };
            }
            return s;
        }) || [];

        try {
            const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
            await updateDoc(tripDocRef, { accommodations: updatedAccommodations });
        } catch (err) {
            console.error("Errore salvataggio allegati su DB:", err);
        }
    };

    return (
        <AccomodationDetailsTemplatePage>
            <AttachmentsManager
                pageTitle="Gestione Allegati"
                subtitle="Visualizza e gestisci gli allegati dell'alloggio"
                attachments={attachments}
                storagePath={`trips/${trip?.id}/accommodations/${accommodationId}/attachments`}
                onAttachmentsChange={handleAttachmentsUpdate}
            />
        </AccomodationDetailsTemplatePage>
    );
};

export default AccommodationAttachmentsPage;