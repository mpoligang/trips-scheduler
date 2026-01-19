'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaMapMarkerAlt } from 'react-icons/fa';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db, storage } from '@/firebase/config';
import { Stage } from '@/models/Stage';

import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import DialogComponent from '../modals/confirm-modal';
import Button from '../actions/button';
import DetailItemCard from '../cards/detail-item-card';
import EmptyData from '../cards/empty-data';
import { EntityKeys } from '@/utils/entityKeys';
import { deleteObject, ref } from 'firebase/storage';
import PageTitle from '../generics/page-title';

interface StagesListProps {
    readonly tripId: string;
    readonly stages?: Stage[];
    readonly isOwner: boolean;
}

const formatDateForGroup = (dateString: string): string => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long', day: 'numeric', month: 'long',
    });
};

export default function StagesList({ tripId, stages = [], isOwner }: StagesListProps) {
    const router = useRouter();

    // Stati per la gestione del modale di eliminazione interno
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const selectedStage = stages.find(s => s.id === deleteId);
    const isDeleteModalOpen = !!deleteId;

    const handleOpenDeleteModal = (id: string) => {
        setDeleteId(id);
    };

    const handleCloseDeleteModal = () => {
        setDeleteId(null);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId || !selectedStage) return;

        setIsDeleting(true);
        try {
            // 1. Elimina i file fisici dallo Storage (se presenti)
            if (selectedStage.attachments && selectedStage.attachments.length > 0) {
                const deletePromises = selectedStage.attachments
                    .filter(att => att.type === 'file')
                    .map(async (att) => {
                        const fileRef = ref(storage, att.url);
                        return deleteObject(fileRef).catch(err => {
                            console.warn(`Impossibile eliminare il file ${att.name} dallo storage:`, err);
                        });
                    });

                await Promise.all(deletePromises);
            }

            const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
            await updateDoc(tripDocRef, {
                stages: arrayRemove(selectedStage)
            });

        } catch (error) {
            console.error("Errore durante l'eliminazione della tappa:", error);
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const handleAdd = () => {
        router.push(appRoutes.stageDetails(tripId, 'new'));
    };

    const groupedStages = stages.reduce((acc, stage) => {
        const date = stage.date;
        const destination = stage.destination || 'Non specificato';
        if (!acc[date]) {
            acc[date] = {};
        }
        if (!acc[date][destination]) {
            acc[date][destination] = [];
        }
        acc[date][destination].push(stage);
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
                    Stai per eliminare la tappa <strong className="font-semibold text-gray-800 dark:text-gray-200">{selectedStage?.name}</strong>. Questa azione è irreversibile.
                </p>
            </DialogComponent>



            <PageTitle title="Tappe del viaggio" subtitle='Gestisci le tappe del tuo viaggio.' >
                {
                    isOwner && (<>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAdd}
                        >
                            <FaPlus className="mr-2" />
                            Aggiungi
                        </Button>
                    </>)
                }
            </PageTitle>

            {hasStages ? (
                <div className="space-y-6">
                    {sortedDates.map(date => (
                        <div key={date}>
                            <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-3  pb-2 capitalize">
                                {formatDateForGroup(date)}
                            </h4>
                            <div className="space-y-4 mt-3">
                                {groupedStages && Object.keys(groupedStages[date]).sort((a, b) => a.localeCompare(b)).map(destination => (
                                    <div className='w-auto' key={destination}>
                                        <span className="inline-block  bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-sm font-medium px-3 py-1 rounded-full">
                                            {destination}
                                        </span>

                                        <ul className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 mt-4">
                                            {groupedStages[date][destination].map((stage) => (
                                                <DetailItemCard
                                                    key={stage.id}
                                                    icon={<FaMapMarkerAlt className="h-5 w-5 0" />}
                                                    title={stage.name}
                                                    directionsUrl={mapNavigationUrl(stage?.location?.address || '')}
                                                    detailUrl={appRoutes.stageDetails(tripId, stage.id)}
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