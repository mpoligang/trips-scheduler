'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Stage } from '@/models/Stage';

import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import ConfirmationModal from '../modals/confirm-modal';
import Button from '../actions/button';
import DetailItemCard from '../cards/detail-item-card';
import EmptyData from '../cards/empty-data';

interface StagesListProps {
    readonly tripId: string;
    readonly stages?: Stage[];
}

const formatDateForGroup = (dateString: string): string => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long', day: 'numeric', month: 'long',
    });
};

export default function StagesList({ tripId, stages = [] }: StagesListProps) {
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
            const tripDocRef = doc(db, 'trips', tripId);
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
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title="Confermi l'eliminazione della tappa?"
                confirmText="Sì, elimina"
                icon={<FaExclamationTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
            >
                <p>
                    Stai per eliminare la tappa <strong className="font-semibold text-gray-800 dark:text-gray-200">{selectedStage?.name}</strong>. Questa azione è irreversibile.
                </p>
            </ConfirmationModal>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Itinerario</h3>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAdd}
                >
                    <FaPlus className="mr-2" />
                    Aggiungi
                </Button>
            </div>

            {hasStages ? (
                <div className="space-y-6">
                    {sortedDates.map(date => (
                        <div key={date}>
                            <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 capitalize">
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
                                                    icon={<FaMapMarkerAlt className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                                                    title={stage.name}
                                                    directionsUrl={mapNavigationUrl(stage.location.address)}
                                                    detailUrl={appRoutes.stageDetails(tripId, stage.id)}
                                                    onDelete={() => handleOpenDeleteModal(stage.id)}
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