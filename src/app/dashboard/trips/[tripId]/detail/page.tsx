'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot, updateDoc, arrayRemove } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { FaPlus, FaExclamationTriangle, FaMapMarkerAlt, FaBed, } from 'react-icons/fa';

// Assicurati che i percorsi siano corretti per la tua struttura
import ConfirmationModal from '@/components/confirm-modal';
import Navbar from '@/components/navbar';
import DetailItemCard from '@/components/detail-item-card';
import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
import { PathItem } from '@/models/PathItem';
import { Trip } from '@/models/Trip';
import { Stage } from '@/models/Stage';
import Button from '@/components/button';
import PageTitle from '@/components/page-title';
import EmptyData from '@/components/empty-data';
import Loader from '@/components/loader';
import Tabs, { TabItem } from '@/components/tabs';
import { Accommodation } from '@/models/AccomModation';

// Carica la mappa dinamicamente
const StagesMap = dynamic(() => import('@/components/map-bound'), {
    ssr: false,
    loading: () => <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
});

const formatDateForGroup = (dateString: string): string => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long', day: 'numeric', month: 'long',
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

    // Stati per l'eliminazione di tappe e alloggi
    const [isDeleteStageModalOpen, setIsDeleteStageModalOpen] = useState(false);
    const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
    const [isDeletingStage, setIsDeletingStage] = useState(false);

    const [isDeleteAccModalOpen, setIsDeleteAccModalOpen] = useState(false);
    const [selectedAccId, setSelectedAccId] = useState<string | null>(null);
    const [isDeletingAcc, setIsDeletingAcc] = useState(false);

    const breadcrumbPaths: PathItem[] = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: trip ? trip.name : 'Dettagli Viaggio', href: `#` }
    ];

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
            return;
        }
        if (user && tripId) {
            const tripDocRef = doc(db, 'trips', tripId);
            const unsubscribe = onSnapshot(tripDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setTrip({ id: docSnap.id, ...docSnap.data() } as Trip);
                } else {
                    setError("Viaggio non trovato.");
                }
                setIsLoadingTrip(false);
            });
            return () => unsubscribe();
        }
    }, [user, loading, tripId, router]);

    const handleOpenDeleteStageModal = (stageId: string) => {
        setSelectedStageId(stageId);
        setIsDeleteStageModalOpen(true);
    };

    const handleConfirmDeleteStage = async () => {
        if (!user || !tripId || !selectedStageId) return;
        const stageToDelete = trip?.stages?.find(s => s.id === selectedStageId);
        if (!stageToDelete) return;

        setIsDeletingStage(true);
        try {
            const tripDocRef = doc(db, 'trips', tripId);
            await updateDoc(tripDocRef, { stages: arrayRemove(stageToDelete) });
        } catch (error) {
            console.error("Errore durante l'eliminazione:", error);
        } finally {
            setIsDeletingStage(false);
            setIsDeleteStageModalOpen(false);
            setSelectedStageId(null);
        }
    };

    const handleOpenDeleteAccModal = (accommodationId: string) => {
        setSelectedAccId(accommodationId);
        setIsDeleteAccModalOpen(true);
    };

    const handleConfirmDeleteAcc = async () => {
        if (!user || !tripId || !selectedAccId) return;
        const accommodationToDelete = trip?.accommodations?.find(a => a.id === selectedAccId);
        if (!accommodationToDelete) return;

        setIsDeletingAcc(true);
        try {
            const tripDocRef = doc(db, 'trips', tripId);
            await updateDoc(tripDocRef, { accommodations: arrayRemove(accommodationToDelete) });
        } catch (error) {
            console.error("Errore durante l'eliminazione dell'alloggio:", error);
        } finally {
            setIsDeletingAcc(false);
            setIsDeleteAccModalOpen(false);
            setSelectedAccId(null);
        }
    };

    if (loading || isLoadingTrip) {
        return <Loader />;
    }

    if (error) {
        // ... (codice di gestione errore invariato)
    }

    const selectedStage = trip?.stages?.find(s => s.id === selectedStageId);
    const selectedAccommodation = trip?.accommodations?.find(a => a.id === selectedAccId);

    // Logica per il raggruppamento Giorno > Destinazione > Tappe
    const groupedStages = trip?.stages?.reduce((acc, stage) => {
        const date = stage.date;
        const destination = stage.destination;
        if (!acc[date]) {
            acc[date] = {};
        }
        if (!acc[date][destination]) {
            acc[date][destination] = [];
        }
        acc[date][destination].push(stage);
        return acc;
    }, {} as Record<string, Record<string, Stage[]>>);
    const sortedDates = groupedStages ? Object.keys(groupedStages).sort() : [];

    // Logica per raggruppare gli alloggi per destinazione
    const groupedAccommodations = trip?.accommodations?.reduce((acc, accommodation) => {
        const destination = accommodation.destination;
        (acc[destination] = acc[destination] || []).push(accommodation);
        return acc;
    }, {} as Record<string, Accommodation[]>);
    const sortedDestinations = groupedAccommodations ? Object.keys(groupedAccommodations).sort() : [];

    const tabs: TabItem[] = [
        {
            label: 'Tappe del Viaggio',
            content: (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Itinerario</h3>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push(`/trip/${tripId}/stage/new`)}
                        >
                            <FaPlus className="mr-2" />
                            Aggiungi Tappa
                        </Button>
                    </div>
                    {sortedDates.length > 0 ? (
                        <div className="space-y-6">
                            {sortedDates.map(date => (
                                <div key={date}>
                                    <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 capitalize">
                                        {formatDateForGroup(date)}
                                    </h4>
                                    <div className="space-y-4 mt-3">
                                        {groupedStages && Object.keys(groupedStages[date]).sort().map(destination => (
                                            <div className='w-auto' key={destination}>
                                                <span key={destination} className=" w-auto  mb-4 gap-2 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-sm font-medium px-3 py-1 rounded-full">
                                                    {destination}
                                                </span>

                                                <ul className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 mt-4">
                                                    {groupedStages[date][destination].map((stage) => (
                                                        <DetailItemCard
                                                            key={stage.id}
                                                            icon={<FaMapMarkerAlt className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                                                            title={stage.name}
                                                            subtitle={stage.location.address}
                                                            directionsUrl={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stage.location.address)}`}
                                                            editUrl={`/dashboard/trips/${tripId}/detail/stage/${stage.id}`}
                                                            onDelete={() => handleOpenDeleteStageModal(stage.id)}
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
            )
        },
        {
            label: 'Alloggi',
            content: (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">I tuoi Alloggi</h3>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => router.push(`/dashboard/trips/${tripId}/detail/accommodation/new`)}
                        >
                            <FaPlus className="mr-2" />
                            Aggiungi Alloggio
                        </Button>
                    </div>
                    {sortedDestinations.length > 0 ? (
                        <div className="space-y-6">
                            {sortedDestinations.map(destination => (
                                <div key={destination}>
                                    <span key={destination} className=" w-auto  mb-4 gap-2 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-sm font-medium px-3 py-1 rounded-full">
                                        {destination}
                                    </span>

                                    <ul className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600 mt-4">
                                        {groupedAccommodations?.[destination].map((accommodation) => (
                                            <DetailItemCard
                                                key={accommodation.id}
                                                icon={<FaBed className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
                                                title={accommodation.name}
                                                subtitle={accommodation.location.address}
                                                directionsUrl={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(accommodation.location.address)}`}
                                                editUrl={`/dashboard/trips/${tripId}/detail/accommodation/${accommodation.id}`}
                                                onDelete={() => handleOpenDeleteAccModal(accommodation.id ?? '')}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyData title='Nessun alloggio inserito' subtitle='Aggiungi gli hotel, B&B o appartamenti del tuo viaggio.' />
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar backPath="/dashboard" breadcrumb={breadcrumbPaths} />
            <ConfirmationModal
                isOpen={isDeleteStageModalOpen}
                onClose={() => setIsDeleteStageModalOpen(false)}
                onConfirm={handleConfirmDeleteStage}
                isLoading={isDeletingStage}
                title="Confermi l'eliminazione della tappa?"
                confirmText="Sì, elimina"
                icon={<FaExclamationTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
            >
                <p>
                    Stai per eliminare la tappa <strong className="font-semibold text-gray-800 dark:text-gray-200">{selectedStage?.name}</strong>. Questa azione è irreversibile.
                </p>
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={isDeleteAccModalOpen}
                onClose={() => setIsDeleteAccModalOpen(false)}
                onConfirm={handleConfirmDeleteAcc}
                isLoading={isDeletingAcc}
                title="Confermi l'eliminazione dell'alloggio?"
                confirmText="Sì, elimina"
                icon={<FaExclamationTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
            >
                <p>
                    {`Stai per eliminare l'alloggio`} <strong className="font-semibold text-gray-800 dark:text-gray-200">{selectedAccommodation?.name}</strong>. Questa azione è irreversibile.
                </p>
            </ConfirmationModal>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PageTitle title={trip?.name ?? ''} subtitle="Pianifica i dettagli della tua avventura." />

                <div className="flex flex-col gap-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Mappa del Viaggio</h2>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2">
                            <StagesMap stages={trip?.stages || []} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <Tabs tabs={tabs} />
                    </div>
                </div>
            </main>
        </div>
    );
}

