'use client';

import { useState } from 'react';
import { FaPlus, FaPlane, FaTrain, FaBus, FaShip, FaCar, FaRocket } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';

import { Transport, TransportType } from '@/models/Transport';
import { useTrip } from '@/context/tripContext';
import Button from '@/components/actions/button';
import DetailItemCard from '@/components/cards/detail-item-card';
import EmptyData from '@/components/cards/empty-data';
import DialogComponent from '@/components/modals/confirm-modal';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import PageTitle from '../generics/page-title';
import { Attachment } from '@/models/Attachment';
import { tr } from 'date-fns/locale';



const formatDateForGroup = (dateString: string): string => {
    if (!dateString) return 'Data non definita';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long', day: 'numeric', month: 'long',
    });
};

export default function TransportsList() {
    const router = useRouter();
    const supabase = createClient();
    const { refreshData, transports, trip, isOwner } = useTrip();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const toDelete = transports.find(t => t.id === deleteId);

    const getIcon = (type: string) => {
        switch (type) {
            case TransportType.Flight: return <FaPlane />;
            case TransportType.Train: return <FaTrain />;
            case TransportType.Bus:
            case TransportType.Shuttle: return <FaBus />;
            case TransportType.Ferry: return <FaShip />;
            case TransportType.CarRental:
            case TransportType.PrivateTransfer: return <FaCar />;
            default: return <FaRocket />;
        }
    };

    /**
     * ✅ BUSINESS LOGIC: Eliminazione sicura con pulizia Storage
     */
    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            // 1. Recupero dei file allegati al trasporto per pulire lo Storage
            const { data: attachments } = await supabase
                .from('attachments')
                .select('storage_path')
                .eq('transport_id', deleteId) // Puntiamo alla FK corretta
                .not('storage_path', 'is', null);

            if (attachments && attachments.length > 0) {
                const paths = attachments.map(a => a.storage_path as string);
                // Pulizia fisica dal bucket 'attachments'
                await supabase.storage.from('attachments').remove(paths);
            }

            // 2. Eliminazione del trasporto (il CASCADE DB eliminerà i record in 'attachments')
            const { error } = await supabase
                .from('transports')
                .delete()
                .eq('id', deleteId);

            if (error) throw error;

            await refreshData();
        } catch (e) {
            console.error("Errore durante l'eliminazione del trasporto:", e);
            alert("Errore tecnico durante l'eliminazione del trasporto.");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const groupedTransports = transports.reduce((acc, transport) => {
        const dateKey = transport.dep_date ? transport.dep_date.split('T')[0] : 'Altro';
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(transport);
        return acc;
    }, {} as Record<string, Transport[]>);

    const sortedDates = Object.keys(groupedTransports).sort((a, b) => a.localeCompare(b));
    const hasTransports = sortedDates.length > 0;

    return (
        <div>
            <DialogComponent
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title="Elimina Trasporto"
                confirmText="Elimina"
            >
                <p>Sei sicuro di voler eliminare il trasporto <strong>{toDelete?.title}</strong>?</p>
            </DialogComponent>

            <PageTitle title="I tuoi Trasporti" subtitle="Gestisci i voli, treni e altri spostamenti del tuo viaggio.">
                {isOwner && (
                    <Button variant="secondary" size="sm" onClick={() => router.push(appRoutes.transportDetails(trip?.id as string, 'new'))}>
                        <FaPlus className="mr-2" /> Aggiungi
                    </Button>
                )}
            </PageTitle>

            {hasTransports ? (
                <div className="space-y-6">
                    {sortedDates.map(date => (
                        <div key={date}>
                            <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-3 pb-2 capitalize">
                                {date === 'Altro' ? date : formatDateForGroup(date)}
                            </h4>

                            <ul className="space-y-4">
                                {groupedTransports[date].map(t => (
                                    <DetailItemCard
                                        key={t.id}
                                        icon={getIcon(t.type)}
                                        title={t.title}
                                        // ✅ FIXED: Utilizzo della utility mapNavigationUrl corretta
                                        directionsUrl={t.dep_address ? mapNavigationUrl(t.dep_address) : ''}
                                        detailUrl={appRoutes.transportDetails(trip?.id as string, t.id)}
                                        onDelete={() => setDeleteId(t.id)}
                                        isOwner={isOwner}
                                    />
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyData title="Nessun trasporto" subtitle="Aggiungi voli, treni o noleggi." />
            )}
        </div>
    );
}