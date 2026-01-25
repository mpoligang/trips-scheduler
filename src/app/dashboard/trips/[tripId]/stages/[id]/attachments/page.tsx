'use client';

import { useParams } from "next/navigation";
import AttachmentsManager from "@/components/cards/attachment-manager";
import StageTemplatePage from "@/components/templates/stage-template";
import { useTrip } from "@/context/tripContext";

const StageAttachmentsPage = () => {
    const { stages } = useTrip();
    const params = useParams();

    // Recuperiamo i parametri dall'URL
    const stageId = params.id as string;

    /**
     * ✅ RECUPERO DATI
     * Grazie alla join 'stages(*, attachments(*))' che abbiamo aggiunto nel Provider,
     * gli allegati sono già presenti dentro l'oggetto della tappa.
     */
    const currentStage = stages?.find(s => s.id === stageId);
    const attachments = currentStage?.attachments || [];

    console.log("StageAttachmentsPage - attachments:", attachments);


    return (
        <StageTemplatePage>
            <AttachmentsManager
                type="stage"
                pageTitle="Gestione Allegati"
                subtitle="Carica, visualizza e gestisci gli allegati relativi a questa tappa del viaggio."
                attachments={attachments}
                relatedId={stageId} // ✅ Passiamo l'ID della tappa come riferimento
            />
        </StageTemplatePage>
    );
};

export default StageAttachmentsPage;