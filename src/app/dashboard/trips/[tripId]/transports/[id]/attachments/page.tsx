'use client';

import { useParams } from "next/navigation";
import AttachmentsManager from "@/components/cards/attachment-manager";
import TransportTemplatePage from "@/components/templates/transport-template";
import { useTrip } from "@/context/tripContext";

const TransportAttachmentsPage = () => {
    // Recuperiamo la lista dei trasporti dal nostro context centralizzato
    const { transports } = useTrip();

    const params = useParams();
    const transportId = params.id as string;

    // Identifichiamo il trasporto corrente per estrarre i suoi allegati (già inclusi dalla join SQL)
    const currentTransport = transports?.find(t => t.id === transportId);
    const attachments = currentTransport?.attachments || [];

    return (
        <TransportTemplatePage>
            <AttachmentsManager
                pageTitle="Gestione Allegati"
                subtitle="Carica, visualizza e gestisci gli allegati relativi a questo trasporto."
                attachments={attachments}
                relatedId={transportId}
                type="transport"
            />
        </TransportTemplatePage>
    );
};

export default TransportAttachmentsPage;