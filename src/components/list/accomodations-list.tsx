'use client';

import { useState } from 'react';
import { FaPlus } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import { Accommodation } from '@/models/Accommodation';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import DialogComponent from '../modals/confirm-modal';
import Button from '../actions/button';
import DetailItemCard from '../cards/detail-item-card';
import EmptyData from '../cards/empty-data';
import PageTitle from '../generics/page-title';
import { RiHotelLine } from 'react-icons/ri';
import { useTrip } from '@/context/tripContext';
import { Attachment } from '@/models/Attachment';

const formatStayPeriod = (start: string | undefined, end: string | undefined) => {
    if (!start || !end) { return ''; }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${startDate.toLocaleDateString('it-IT', options)} - ${endDate.toLocaleDateString('it-IT', options)}`;
};

export default function AccommodationsList() {
    const router = useRouter();
    const supabase = createClient();
    const { trip, accommodations = [], isOwner, refreshData } = useTrip();

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
        router.push(appRoutes.accommodationDetails(trip?.id as string, 'new'));
    };

    /**
     * ✅ BUSINESS LOGIC AGGIORNATA: 
     * Eliminazione mirata con pulizia dello Storage
     */
    const handleConfirmDelete = async () => {
        if (!deleteId) return;

        setIsDeleting(true);
        try {
            // 1. Recupero path degli allegati collegati a questo alloggio
            const { data: attachments } = await supabase
                .from('attachments')
                .select('storage_path')
                .eq('accommodation_id', deleteId) // Cerchiamo per alloggio
                .not('storage_path', 'is', null);

            // 2. Pulizia fisica dei file nello Storage
            if (attachments && attachments.length > 0) {
                const paths = attachments.map((a) => a.storage_path as string);
                await supabase.storage.from('attachments').remove(paths);
            }

            // 3. Eliminazione record alloggio (il CASCADE DB pulirà i metadati attachments)
            const { error } = await supabase
                .from('accommodations')
                .delete()
                .eq('id', deleteId);

            if (error) throw error;

            await refreshData();
        } catch (error) {
            console.error("Errore durante l'eliminazione dell'alloggio:", error);
            alert("Errore tecnico durante l'eliminazione.");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    // Logica di raggruppamento per destinazione
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
                    Stai per eliminare l&apos;alloggio <strong className="font-semibold text-gray-800 dark:text-gray-200">{selectedAccommodation?.name}</strong>. Questa azione è irreversibile.
                </p>
            </DialogComponent>

            <PageTitle title="I tuoi Alloggi"
                subtitle='Gestisci gli hotel, B&B o appartamenti del tuo viaggio.'
            >
                {isOwner && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAdd}
                    >
                        <FaPlus className="mr-2" />
                        Aggiungi
                    </Button>
                )}
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
                                        {/* Periodo di soggiorno */}
                                        <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 capitalize">
                                            {formatStayPeriod(accommodation.start_date, accommodation.end_date)}
                                        </h4>

                                        <DetailItemCard
                                            icon={<RiHotelLine className="h-5 w-5 " />}
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
                <EmptyData
                    title='Nessun alloggio inserito'
                    subtitle='Aggiungi gli hotel, B&B o appartamenti del tuo viaggio.'
                />
            )}
        </div>
    );
}