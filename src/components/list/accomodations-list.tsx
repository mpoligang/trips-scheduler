'use client';

import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { useTrip } from '@/context/tripContext';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';

import DialogComponent from '../modals/confirm-modal';
import Button from '../actions/button';
import DetailItemCard from '../cards/detail-item-card';
import EmptyData from '../cards/empty-data';
import PageTitle from '../generics/page-title';
import { RiHotelLine } from 'react-icons/ri';
import Badge from '../generics/badge';
import { deleteAccommodationAction } from '@/actions/accomodation-actions';

const formatStayPeriod = (start: string | undefined, end: string | undefined) => {
    if (!start || !end) { return ''; }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${startDate.toLocaleDateString('it-IT', options)} - ${endDate.toLocaleDateString('it-IT', options)}`;
};

export default function AccommodationsList() {
    const router = useRouter();
    const { trip, accommodations = [], isOwner, refreshData } = useTrip();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const selectedAccommodation = accommodations.find(a => a.id === deleteId);
    const isDeleteModalOpen = !!deleteId;

    const handleOpenDeleteModal = (id: string) => setDeleteId(id);
    const handleCloseDeleteModal = () => setDeleteId(null);

    const handleAdd = () => {
        router.push(appRoutes.accommodationDetails(trip?.id as string, 'new'));
    };

    /**
     * ✅ REFACTORING: Chiamata alla Server Action con Toast
     */
    const handleConfirmDelete = async () => {
        if (!deleteId || !trip?.id) return;

        setIsDeleting(true);
        const toastId = toast.loading("Eliminazione in corso...");

        try {
            const result = await deleteAccommodationAction({
                id: deleteId,
                trip_id: trip.id
            });

            if (!result.success) throw new Error(result.error);

            toast.success("Alloggio eliminato correttamente", { id: toastId });
            await refreshData(true);
            handleCloseDeleteModal();
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message || "Impossibile eliminare l'alloggio", { id: toastId });
            } else {
                toast.error("Impossibile eliminare l'alloggio", { id: toastId });
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // Logica di raggruppamento (invariata)
    const groupedAccommodations = accommodations.reduce((acc, accommodation) => {
        const destination = accommodation.destination || 'Altro';
        if (!acc[destination]) acc[destination] = [];
        acc[destination].push(accommodation);
        return acc;
    }, {} as Record<string, any[]>);

    const sortedDestinations = Object.keys(groupedAccommodations).sort();
    const hasAccommodations = sortedDestinations.length > 0;

    return (
        <div>
            <DialogComponent
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title="Confermi l'eliminazione?"
                confirmText="Sì, elimina"
            >
                <p>Stai per eliminare l&apos;alloggio <strong className="text-gray-200">{selectedAccommodation?.name}</strong>. L&apos;azione è irreversibile.</p>
            </DialogComponent>

            <PageTitle title="I tuoi Alloggi" subtitle="Gestisci gli hotel, B&B o appartamenti del tuo viaggio.">
                {isOwner && (
                    <Button variant="secondary" size="sm" onClick={handleAdd}>
                        <FaPlus className="mr-2" /> Aggiungi
                    </Button>
                )}
            </PageTitle>

            {hasAccommodations ? (
                <div className="space-y-8">
                    {sortedDestinations.map(destination => (
                        <div key={destination}>
                            <Badge text={destination} className='mb-4' />
                            <div className="space-y-4 pl-4 border-l-2 border-gray-700">
                                {groupedAccommodations[destination].map((accommodation) => (
                                    <div key={accommodation.id} className="flex flex-col gap-1">
                                        <h4 className="font-semibold text-lg text-gray-300 mb-3 border-b border-gray-700 pb-2 capitalize">
                                            {formatStayPeriod(accommodation.start_date, accommodation.end_date)}
                                        </h4>
                                        <DetailItemCard
                                            icon={<RiHotelLine className="h-5 w-5" />}
                                            title={accommodation.name}
                                            directionsUrl={mapNavigationUrl(accommodation.address)}
                                            detailUrl={appRoutes.accommodationDetails(trip?.id as string, accommodation.id)}
                                            onDelete={() => handleOpenDeleteModal(accommodation.id)}
                                            isOwner={isOwner}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyData title='Nessun alloggio inserito' subtitle='Aggiungi gli hotel, B&B o appartamenti del tuo viaggio.' />
            )}
        </div>
    );
}