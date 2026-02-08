'use client';

import { useState, useMemo } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { useTrip } from '@/context/tripContext';
import { appRoutes } from '@/utils/appRoutes';

import DialogComponent from '../modals/confirm-modal';
import Button from '../actions/button';
import DetailItemCard from '../cards/detail-item-card';
import EmptyData from '../cards/empty-data';
import PageTitle from '../generics/page-title';
import { RiHotelLine } from 'react-icons/ri';
import Badge from '../generics/badge';
import { deleteAccommodationAction } from '@/actions/accomodation-actions';
import FormSection from '../generics/form-section';

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

    // ✅ ORDINAMENTO CRONOLOGICO (Senza Raggruppamento)
    const sortedAccommodations = useMemo(() => {
        return [...accommodations].sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : Infinity; // Infinity mette i senza data alla fine
            const dateB = b.start_date ? new Date(b.start_date).getTime() : Infinity;
            return dateA - dateB;
        });
    }, [accommodations]);

    const hasAccommodations = sortedAccommodations.length > 0;

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
                <div className="space-y-6">
                    {sortedAccommodations.map((accommodation) => (
                        <FormSection
                            key={accommodation.id}
                            title={formatStayPeriod(accommodation.start_date, accommodation.end_date) || 'Date non definite'}
                            className='capitalize'
                        >
                            <div className="relative pl-4 border-l-2 border-gray-700 hover:border-gray-500 transition-colors">
                                <div className="mb-5">
                                    <Badge text={accommodation.destination || 'Nessuna destinazione'} />
                                </div>
                                <DetailItemCard
                                    icon={<RiHotelLine className="h-5 w-5" />}
                                    title={accommodation.name}
                                    detailClick={appRoutes.accommodationDetails(trip?.id as string, accommodation.id)}
                                    latitude={accommodation.lat ?? 0}
                                    longitude={accommodation.lng ?? 0}
                                    onDelete={() => handleOpenDeleteModal(accommodation.id)}
                                    isOwner={isOwner}
                                />
                            </div>
                        </FormSection>
                    ))}
                </div>
            ) : (
                <EmptyData title='Nessun alloggio inserito' subtitle='Aggiungi gli hotel, B&B o appartamenti del tuo viaggio.' />
            )}
        </div>
    );
}