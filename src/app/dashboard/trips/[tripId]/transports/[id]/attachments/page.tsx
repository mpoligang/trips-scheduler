'use client';

import AttachmentsManager from "@/components/cards/attachment-manager";
import StageTemplatePage from "@/components/templates/stage-template";
import TransportTemplatePage from "@/components/templates/transport-template";
import { useTrip } from "@/context/tripContext";
import { db } from "@/firebase/config";
import { Attachment } from "@/models/Attachment";
import { EntityKeys } from "@/utils/entityKeys";
import { doc, updateDoc } from "firebase/firestore";
import { useParams } from "next/navigation";



const TransportAttachmentsPage = () => {

    const { trip, } = useTrip();
    const params = useParams();
    const transportId = params.id as string;
    const attachments = trip?.transports?.find(s => s.id === (transportId || ''))?.attachments || [];

    const handleAttachmentsUpdate = async (newAttachments: Attachment[]) => {
        if (!trip) { return; }

        const updatedTransports = trip.transports?.map((s) => {
            if (s.id === transportId) {
                return { ...s, attachments: newAttachments };
            }
            return s;
        }) || [];

        try {
            const tripDocRef = doc(db, EntityKeys.tripsKey, trip.id as string);
            await updateDoc(tripDocRef, { stages: updatedTransports });
        } catch (err) {
            console.error("Errore salvataggio allegati su DB:", err);
        }
    };

    return (
        <TransportTemplatePage>
            <AttachmentsManager
                pageTitle="Gestione Allegati"
                subtitle="Visualizza e gestisci gli allegati del trasporto"
                attachments={attachments}
                storagePath={`trips/${trip?.id}/transports/${transportId}/attachments`}
                onAttachmentsChange={handleAttachmentsUpdate}
            />
        </TransportTemplatePage>
    );
};

export default TransportAttachmentsPage;