'use client';

import { useState } from 'react';
import { FaPlus, FaBed, FaExclamationTriangle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Accommodation } from '@/models/AccomModation';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import DetailItemCard from '../cards/detail-item-card';
import EmptyData from '../cards/empty-data';
import ConfirmationModal from '../modals/confirm-modal';
import Button from '../actions/button';

interface AccommodationsListProps {
    readonly tripId: string;
    readonly accommodations?: Accommodation[];
}

export default function AccommodationsList({
    tripId,
    accommodations = [],
}: AccommodationsListProps) {
    const router = useRouter();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const selectedAccommodation = accommodations.find(a => a.id === deleteId);
    const isDeleteModalOpen = !!deleteId;

    const handleOpenDeleteModal = (id: string) => {
        setDeleteId(id);
    };

    const handleCloseDeleteModal = () => {
        setDeleteId(null);
    };

    const handleAdd = () => {
        router.push(appRoutes.accommodationDetails(tripId, 'new'));
    };

    const handleConfirmDelete = async () => {
        if (!deleteId || !selectedAccommodation) return;

        setIsDeleting(true);
        try {
            const tripDocRef = doc(db, 'trips', tripId);
            await updateDoc(tripDocRef, {
                accommodations: arrayRemove(selectedAccommodation)
            });
        } catch (error) {
            console.error("Errore durante l'eliminazione:", error);
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    // Logica di raggruppamento
    const groupedAccommodations = accommodations.reduce((acc, accommodation) => {
        const destination = accommodation.destination || 'Altro';
        if (!acc[destination]) {
            acc[destination] = [];
        }
        acc[destination].push(accommodation);
        return acc;
    }, {} as Record<string, Accommodation[]>);

    const sortedDestinations = Object.keys(groupedAccommodations).sort();
    const hasAccommodations = sortedDestinations.length > 0;

    return (
        <div>
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title="Confermi l'eliminazione dell'alloggio?"
                confirmText="Sì, elimina"
                icon={<FaExclamationTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
            >
                <p>
                    {`Stai per eliminare l'alloggio`} <strong className="font-semibold text-gray-800 dark:text-gray-200">{selectedAccommodation?.name}</strong>. Questa azione è irreversibile.
                </p>
            </ConfirmationModal>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">I tuoi Alloggi</h3>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleAdd}
                >
                    <FaPlus className="mr-2" />
                    Aggiungi
                </Button>
            </div>

            {hasAccommodations ? (
                <div className="space-y-6">
                    {sortedDestinations.map(destination => (
                        <div key={destination}>
                            <span className="inline-block mb-4 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-sm font-medium px-3 py-1 rounded-full">
                                {destination}
                            </span>

                            <ul className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 ">
                                {groupedAccommodations[destination].map((accommodation) => (
                                    <DetailItemCard
                                        key={accommodation.id}
                                        icon={<FaBed className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                                        title={accommodation.name}
                                        directionsUrl={mapNavigationUrl(accommodation.location.address)}
                                        detailUrl={appRoutes.accommodationDetails(tripId, accommodation.id)}
                                        onDelete={() => handleOpenDeleteModal(accommodation.id as string)}
                                    />
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyData
                    title='Nessun alloggio inserito'
                    subtitle='Aggiungi gli hotel, B&B o appartamenti del tuo viaggio.'
                />
            )}
        </div>
    );
}