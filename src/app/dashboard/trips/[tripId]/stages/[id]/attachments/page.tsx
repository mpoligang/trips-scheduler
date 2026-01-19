'use client';

import AttachmentsManager from "@/components/cards/attachment-manager";
import StageTemplatePage from "@/components/templates/stage-template";
import { useTrip } from "@/context/tripContext";
import { db } from "@/firebase/config";
import { Attachment } from "@/models/Attachment";
import { EntityKeys } from "@/utils/entityKeys";
import { doc, updateDoc } from "firebase/firestore";
import { useParams } from "next/navigation";



const StageAttachmentsPage = () => {

    const { trip, } = useTrip();

    const params = useParams();
    const stageId = params.id as string;
    const tripId = params.tripId as string;
    const attachments = trip?.stages?.find(s => s.id === (stageId || ''))?.attachments || [];


    const handleAttachmentsUpdate = async (newAttachments: Attachment[]) => {
        if (!trip) { return; }

        const updatedStages = trip.stages?.map((s) => {
            if (s.id === stageId) {
                return { ...s, attachments: newAttachments };
            }
            return s;
        }) || [];

        try {
            const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
            await updateDoc(tripDocRef, { stages: updatedStages });
        } catch (err) {
            console.error("Errore salvataggio allegati su DB:", err);
        }
    };

    return (
        <StageTemplatePage>
            <AttachmentsManager
                pageTitle="Gestione Allegati"
                subtitle="Visualizza e gestisci gli allegati della tappa"
                attachments={attachments}
                storagePath={`trips/${trip?.id}/stages/${stageId}/attachments`}
                onAttachmentsChange={handleAttachmentsUpdate}
            />
        </StageTemplatePage>
    );
};

export default StageAttachmentsPage;