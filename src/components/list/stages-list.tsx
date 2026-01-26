'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
import { createClient } from '@/lib/client';
import { Stage } from '@/models/Stage';

import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import DialogComponent from '../modals/confirm-modal';
import Button from '../actions/button';
import DetailItemCard from '../cards/detail-item-card';
import EmptyData from '../cards/empty-data';
import PageTitle from '../generics/page-title';
import { useTrip } from '@/context/tripContext';
import { EntityKeys } from '@/utils/entityKeys';

/**
 * Formatta la data ISO (2024-05-24T...) per il raggruppamento
 */
const formatDateForGroup = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
};

export default function StagesList() {
    const router = useRouter();
    const supabase = createClient();
    const { trip, stages, isOwner, refreshData } = useTrip();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const selectedStage = stages.find(s => s.id === deleteId);
    const isDeleteModalOpen = !!deleteId;

    const handleOpenDeleteModal = (id: string) => setDeleteId(id);
    const handleCloseDeleteModal = () => setDeleteId(null);

    const handleConfirmDelete = async () => {
        if (!deleteId || !selectedStage) { return; }

        setIsDeleting(true);
        try {
            /** * ✅ BUSINESS LOGIC: Pulizia Storage 
             * Recuperiamo i path prima del DELETE per non perdere i riferimenti
             */
            const { data: attachments } = await supabase
                .from('attachments')
                .select('storage_path')
                .eq('stage_id', deleteId) // Usiamo stage_id come da nuovo schema
                .not('storage_path', 'is', null);

            if (attachments && attachments.length > 0) {
                const paths = attachments.map(a => a.storage_path as string);
                // Usiamo il bucket 'attachments' creato precedentemente
                await supabase.storage.from('attachments').remove(paths);
            }

            /** * ✅ BUSINESS LOGIC: Delete con CASCADE
             * Il database cancellerà automaticamente i record in 'attachments'
             */
            const { error } = await supabase
                .from(EntityKeys.stagesKey)
                .delete()
                .eq('id', deleteId);

            if (error) { throw error; }

            await refreshData(true);

        } catch (error) {
            console.error("Errore durante l'eliminazione della tappa:", error);
            alert("Errore durante l'eliminazione.");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const handleAdd = () => {
        router.push(appRoutes.stageDetails(trip?.id as string, 'new'));
    };

    /**
     * Raggruppamento tappe per Data e poi per Destinazione
     */
    const groupedStages = stages.reduce((acc, stage) => {
        const dateKey = stage.arrival_date ? stage.arrival_date.split('T')[0] : 'no-date';
        const destination = stage.destination || 'Non specificato';

        if (!acc[dateKey]) { acc[dateKey] = {}; }
        if (!acc[dateKey][destination]) { acc[dateKey][destination] = []; }

        acc[dateKey][destination].push(stage);
        return acc;
    }, {} as Record<string, Record<string, Stage[]>>);

    const sortedDates = Object.keys(groupedStages).sort((a, b) => a.localeCompare(b));
    const hasStages = sortedDates.length > 0;

    return (
        <div>
            <DialogComponent
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title="Confermi l'eliminazione della tappa?"
                confirmText="Sì, elimina"
            >
                <p>
                    Stai per eliminare la tappa <strong className="font-semibold text-gray-200">{selectedStage?.name}</strong>.
                </p>
            </DialogComponent>

            <PageTitle title="Tappe del viaggio" subtitle='Gestisci le tappe del tuo viaggio.' >
                {isOwner && (
                    <Button variant="secondary" size="sm" onClick={handleAdd}>
                        <FaPlus className="mr-2" /> Aggiungi
                    </Button>
                )}
            </PageTitle>

            {hasStages ? (
                <div className="space-y-6">
                    {sortedDates.map(date => (
                        <div key={date}>
                            <h4 className="font-semibold text-lg text-gray-300 mb-3 pb-2 capitalize">
                                {date === 'no-date' ? 'Senza Data' : formatDateForGroup(date)}
                            </h4>
                            <div className="space-y-4 mt-3">
                                {Object.keys(groupedStages[date]).sort().map(destination => (
                                    <div className='w-auto' key={destination}>
                                        <span className="inline-block bg-purple-900/50 text-purple-200 text-sm font-medium px-3 py-1 rounded-full">
                                            {destination}
                                        </span>

                                        <ul className="space-y-4 pl-4 border-l-2 border-gray-600 mt-4">
                                            {groupedStages[date][destination].map((stage) => (
                                                <DetailItemCard
                                                    key={stage.id}
                                                    icon={<FaMapMarkerAlt className="h-5 w-5" />}
                                                    title={stage.name}
                                                    directionsUrl={stage.address ? mapNavigationUrl(stage.address) : ''}
                                                    detailUrl={appRoutes.stageDetails(trip?.id as string, stage.id)}
                                                    onDelete={() => handleOpenDeleteModal(stage.id)}
                                                    isOwner={isOwner}
                                                />
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyData title='Nessuna tappa ancora' subtitle='Inizia ad aggiungere le tappe del tuo viaggio.' />
            )}
        </div>
    );
}