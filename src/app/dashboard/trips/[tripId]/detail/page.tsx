'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc, arrayRemove } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import ConfirmationModal from '@/components/confirm-modal';
import Navbar from '@/components/navbar';
import StageItem from '@/components/stage-item';
import { useAuth } from '@/context/authProvider';
import { PathItem } from '@/models/PathItem';
import { Trip } from '@/models/Trip';
import Button from '@/components/button';
import { db } from '@/firebase/config';
import PageTitle from '@/components/page-title';
import EmptyData from '@/components/empty-data';
import Loader from '@/components/loader';

// Carica la mappa dinamicamente per evitare problemi con il rendering lato server
const StagesMap = dynamic(() => import('@/components/map-bound'), {
    ssr: false,
    loading: () => <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
});

// Funzione helper per formattare le date per le intestazioni dei gruppi
const formatDateForGroup = (dateString: string): string => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
};

export default function TripDetailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId as string;

    const [trip, setTrip] = useState<Trip | null>(null);
    const [isLoadingTrip, setIsLoadingTrip] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State per il modale di eliminazione
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Breadcrumb dinamico
    const breadcrumbPaths: PathItem[] = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: trip ? trip.name : 'Dettagli Viaggio', href: `#` }
    ];

    // Recupera e ascolta le modifiche al viaggio in tempo reale
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }

        if (user && tripId) {
            const tripDocRef = doc(db, 'trips', tripId);
            const unsubscribe = onSnapshot(tripDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    const tripData = { id: docSnap.id, ...docSnap.data() } as Trip;
                    if (tripData) {
                        setTrip(tripData);
                    }
                } else {
                    setError("Viaggio non trovato.");
                }
                setIsLoadingTrip(false);
            });

            return () => unsubscribe(); // Pulisce il listener
        }
    }, [user, loading, tripId, router]);

    // Logica per l'eliminazione di una tappa
    const handleOpenDeleteModal = (stageId: string) => {
        setSelectedStageId(stageId);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!user || !tripId || !selectedStageId) return;

        const stageToDelete = trip?.stages?.find(s => s.id === selectedStageId);
        if (!stageToDelete) return;

        setIsDeleting(true);
        try {
            const tripDocRef = doc(db, 'trips', tripId);
            await updateDoc(tripDocRef, {
                stages: arrayRemove(stageToDelete)
            });
        } catch (error) {
            console.error("Errore durante l'eliminazione della tappa:", error);
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setSelectedStageId(null);
        }
    };

    if (loading || isLoadingTrip) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                <Navbar backPath="/dashboard" breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Errore', href: '#' }]} />
                <main className="container mx-auto px-4 py-8 text-center">
                    <p className="text-red-500">{error}</p>
                </main>
            </div>
        );
    }

    const selectedStage = trip?.stages?.find(s => s.id === selectedStageId);

    // Logica per raggruppare le tappe per data
    const groupedStages = trip?.stages?.reduce((acc, stage) => {
        const date = stage.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(stage);
        return acc;
    }, {} as Record<string, any[]>);

    const sortedDates = groupedStages ? Object.keys(groupedStages).sort() : [];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar backPath="/dashboard" breadcrumb={breadcrumbPaths} />
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
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

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Intestazione principale della pagina (bottone rimosso) */}

                <PageTitle title={trip?.name ?? ''}
                    subtitle="Pianifica i dettagli della tua avventura." >
                    <Button
                        variant="secondary"
                        className="w-full sm:w-auto"
                        onClick={() => { router.push(`/dashboard/trips/${tripId}/detail/stage/new`) }}
                    >
                        <FaPlus className="mr-2" />
                        Aggiungi Tappa
                    </Button>
                </PageTitle>

                <div className="flex flex-col gap-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Mappa del Viaggio</h2>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2">
                            <StagesMap stages={trip?.stages || []} />
                        </div>
                    </div>

                    <div>
                        {/* Nuova intestazione per la sezione delle tappe */}
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tappe del Viaggio</h2>

                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            {sortedDates && sortedDates.length > 0 ? (
                                <div className="space-y-6">
                                    {sortedDates.map(date => (
                                        <div key={date}>
                                            <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 capitalize">
                                                {formatDateForGroup(date)}
                                            </h4>
                                            <ul className="space-y-4 mt-3">
                                                {groupedStages[date].map((stage: any) => (
                                                    <StageItem
                                                        key={stage.id}
                                                        stage={stage}
                                                        tripId={tripId}
                                                        onDelete={handleOpenDeleteModal}
                                                    />
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyData title='Nessuna tappa ancora' subtitle='Inizia ad aggiungere le tappe del tuo viaggio.' />


                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

