'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

import { appRoutes } from '@/utils/appRoutes';
import { useTrip } from '@/context/tripContext';

import DialogComponent from '../modals/confirm-modal';
import Button from '../actions/button';
import DetailItemCard from '../cards/detail-item-card';
import EmptyData from '../cards/empty-data';
import PageTitle from '../generics/page-title';
import Badge from '../generics/badge';
import { deleteRecommendedAction } from '@/actions/recommended-actions';
import { get } from 'http';
import { getIconByCategoryId } from '@/utils/recommended.utils';

export default function RecommendedList() {
    const router = useRouter();
    // Recuperiamo 'recommended' dal context (alimentato dalla getTripFullDataAction modificata nel Canvas)
    const { trip, recommended, isOwner, refreshData } = useTrip();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const selectedItem = recommended.find(r => r.id === deleteId);
    const isDeleteModalOpen = !!deleteId;

    const handleOpenDeleteModal = (id: string) => setDeleteId(id);
    const handleCloseDeleteModal = () => setDeleteId(null);

    const handleConfirmDelete = async () => {
        if (!deleteId || !trip?.id) return;

        setIsDeleting(true);
        const toastId = toast.loading("Eliminazione suggerimento...");

        try {
            const result = await deleteRecommendedAction({
                id: deleteId,
                trip_id: trip.id
            });

            if (!result.success) throw new Error(result.error);

            toast.success("Luogo rimosso dai consigliati", { id: toastId });
            await refreshData(true);
            handleCloseDeleteModal();
        } catch (error: any) {
            toast.error(error.message || "Errore durante l'eliminazione", { id: toastId });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAdd = () => {
        router.push(appRoutes.recommendedDetails(trip?.id as string, 'new'));
    };

    const getCustomIcon = (Icon: any) => {
        return <Icon className="h-5 w-5 " />;
    }

    // Raggruppamento per Destinazione (es. Tokyo, Kyoto)
    const groupedItems = recommended.reduce((acc, item) => {
        const destination = item.destination;
        if (!acc[destination]) { acc[destination] = []; }
        acc[destination].push(item);
        return acc;
    }, {} as Record<string, any[]>);

    const sortedDestinations = Object.keys(groupedItems).sort();
    const hasItems = recommended.length > 0;

    return (
        <div>
            {/* Modal di conferma eliminazione */}
            <DialogComponent
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title="Rimuovere dai consigliati?"
                confirmText="Sì, rimuovi"
            >
                <p>
                    Stai per rimuovere <strong className="font-semibold text-gray-200">{selectedItem?.title}</strong> dai suggerimenti.
                </p>
            </DialogComponent>

            {/* Header della sezione */}
            <PageTitle
                title="Luoghi Consigliati"
                subtitle="Suggerimenti e punti di interesse da visitare, fuori dall'itinerario principale."
            >
                {isOwner && (
                    <Button variant="secondary" size="sm" onClick={handleAdd}>
                        <FaPlus className="mr-2" /> Aggiungi
                    </Button>
                )}
            </PageTitle>

            {hasItems ? (
                <div className="space-y-8">
                    {sortedDestinations.map(destination => (
                        <div key={destination} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <Badge text={destination} className="mb-4 bg-purple-600/20 text-purple-400 border-purple-500/30" />
                            <div className="space-y-4 pl-4 border-l-2 border-gray-700">

                                {groupedItems[destination].map((item) => (
                                    <DetailItemCard
                                        key={item.id}
                                        icon={getCustomIcon(getIconByCategoryId(item.category))}
                                        title={item.title}
                                        latitude={item.latitude ?? 0}
                                        longitude={item.longitude ?? 0}
                                        detailUrl={appRoutes.recommendedDetails(trip?.id as string, item.id)}
                                        onDelete={() => handleOpenDeleteModal(item.id)}
                                        isOwner={isOwner}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyData
                    title="Ancora nessun consiglio"
                    subtitle="L'organizzatore non ha ancora aggiunto luoghi consigliati per questo viaggio."
                />
            )}
        </div>
    );
}