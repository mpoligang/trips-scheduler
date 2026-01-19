'use client';

import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Accommodation } from '@/models/AccomModation';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';

import { EntityKeys } from '@/utils/entityKeys';
import DialogComponent from '../modals/confirm-modal';
import Button from '../actions/button';
import DetailItemCard from '../cards/detail-item-card';
import EmptyData from '../cards/empty-data';
import PageTitle from '../generics/page-title';
import { RiHotelLine } from 'react-icons/ri';

interface AccommodationsListProps {
    readonly tripId: string;
    readonly accommodations?: Accommodation[];
    readonly isOwner: boolean;
}

// Funzione helper per formattare le date
const formatStayPeriod = (start: any, end: any) => {
    if (!start || !end) return '';
    // Gestisce sia Timestamp di Firestore che Date standard
    const startDate = start.toDate ? start.toDate() : new Date(start);
    const endDate = end.toDate ? end.toDate() : new Date(end);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${startDate.toLocaleDateString('it-IT', options)} - ${endDate.toLocaleDateString('it-IT', options)}`;
};

export default function AccommodationsList({
    tripId,
    accommodations = [],
    isOwner,
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
            const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
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
            <DialogComponent
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title="Confermi l'eliminazione dell'alloggio?"
                confirmText="Sì, elimina"
            >
                <p>
                    {`Stai per eliminare l'alloggio`} <strong className="font-semibold text-gray-800 dark:text-gray-200">{selectedAccommodation?.name}</strong>. Questa azione è irreversibile.
                </p>
            </DialogComponent>


            <PageTitle title="I tuoi Alloggi"
                subtitle='Gestisci gli hotel, B&B o appartamenti del tuo viaggio.'
            >

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

            {hasAccommodations ? (
                <div className="space-y-8">
                    {sortedDestinations.map(destination => (
                        <div key={destination}>

                            {/* Badge Destinazione */}
                            <span className="inline-block mb-4 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-sm font-medium px-3 py-1 rounded-full">
                                {destination}
                            </span>

                            {/* Lista Card */}
                            <div className="space-y-4 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
                                {groupedAccommodations[destination].map((accommodation) => (
                                    <div key={accommodation.id} className="flex flex-col gap-1">
                                        {/* Etichetta Data sopra la card */}
                                        <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 capitalize">
                                            {formatStayPeriod(accommodation.startDate, accommodation.endDate)}
                                        </h4>

                                        <DetailItemCard
                                            icon={<RiHotelLine className="h-5 w-5 " />}
                                            title={accommodation.name}
                                            directionsUrl={mapNavigationUrl(accommodation.location.address)}
                                            detailUrl={appRoutes.accommodationDetails(tripId, accommodation.id)}
                                            onDelete={() => handleOpenDeleteModal(accommodation.id as string)}
                                            isOwner={isOwner}
                                        />
                                    </div>
                                ))}
                            </div>
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