'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

import { appRoutes } from '@/utils/appRoutes';
import { deleteStageAction } from '@/actions/stage-actions';
import { useTrip } from '@/context/tripContext';

import DialogComponent from '../modals/confirm-modal';
import Button from '../actions/button';
import DetailItemCard from '../cards/detail-item-card';
import EmptyData from '../cards/empty-data';
import PageTitle from '../generics/page-title';
import Badge from '../generics/badge';

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
    const { trip, stages = [], isOwner, refreshData } = useTrip();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const selectedStage = stages.find(s => s.id === deleteId);
    const isDeleteModalOpen = !!deleteId;

    const handleOpenDeleteModal = (id: string) => setDeleteId(id);
    const handleCloseDeleteModal = () => setDeleteId(null);

    /**
     * ✅ REFACTORING: Eliminazione tramite Server Action
     */
    const handleConfirmDelete = async () => {
        if (!deleteId || !trip?.id) return;

        setIsDeleting(true);
        const toastId = toast.loading("Eliminazione tappa...");

        try {
            const result = await deleteStageAction({
                id: deleteId,
                trip_id: trip.id
            });

            if (!result.success) throw new Error(result.error);

            toast.success("Tappa eliminata con successo", { id: toastId });
            await refreshData(true);
            handleCloseDeleteModal();
        } catch (error: any) {
            toast.error(error.message || "Errore durante l'eliminazione", { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAdd = () => {
        router.push(appRoutes.stageDetails(trip?.id as string, 'new'));
    };

    const groupedStages = stages.reduce((acc, stage) => {
        const dateKey = stage.arrival_date ? stage.arrival_date.split('T')[0] : 'no-date';
        const destination = stage.destination || 'Non specificato';
        if (!acc[dateKey]) { acc[dateKey] = {}; }
        if (!acc[dateKey][destination]) { acc[dateKey][destination] = []; }
        acc[dateKey][destination].push(stage);
        return acc;
    }, {} as Record<string, Record<string, any[]>>);

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
                    Stai per eliminare la tappa <strong className="font-semibold text-gray-200">{selectedStage?.name}</strong>. L&apos;azione è irreversibile.
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
                                        <Badge text={destination} className='mb-4' />
                                        <ul className="space-y-4 pl-4 border-l-2 border-gray-600">
                                            {groupedStages[date][destination].map((stage) => (
                                                <DetailItemCard
                                                    key={stage.id}
                                                    icon={<FaMapMarkerAlt className="h-5 w-5" />}
                                                    title={stage.name}
                                                    address={stage.address ?? ''}
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