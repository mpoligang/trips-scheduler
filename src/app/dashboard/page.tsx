'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, where, or } from 'firebase/firestore';
import { PathItem } from '@/models/PathItem';
import { Trip } from '@/models/Trip';
import { FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import ConfirmationModal from '@/components/modals/confirm-modal';
import Navbar from '@/components/navigations/navbar';
import TripCard from '@/components/cards/trip-card';
import { useAuth } from '@/context/authProvider';
import { app, db } from '@/firebase/config';
import Button from '@/components/actions/button';
import PageTitle from '@/components/generics/page-title';
import EmptyData from '@/components/cards/empty-data';
import Loader from '@/components/generics/loader';
import { EntityKeys } from '@/utils/entityKeys';
import { appRoutes } from '@/utils/appRoutes';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoadingTrips, setIsLoadingTrips] = useState(true);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbPaths: PathItem[] = [{ label: 'Dashboard', href: appRoutes.home }];

    useEffect(() => {
        if (!loading && !user) { router.push(appRoutes.login); }
    }, [user, loading, router]);

    // Stati separati per evitare conflitti durante i caricamenti asincroni
    const [ownedTrips, setOwnedTrips] = useState<Trip[]>([]);
    const [participantTrips, setParticipantTrips] = useState<Trip[]>([]);

    // Uniamo i due array ogni volta che uno dei due cambia
    useEffect(() => {
        // Uniamo
        const allTrips = [...ownedTrips, ...participantTrips];

        // Rimuoviamo duplicati (caso raro in cui sei sia owner che participant, ma possibile per errore)
        const uniqueTrips = Array.from(new Map(allTrips.map(item => [item.id, item])).values());

        // Ordiniamo in JS (come discusso prima)


        setTrips(uniqueTrips);

        // Se abbiamo caricato (o tentato di caricare), togliamo il loader
        // Nota: Questa logica è semplificata, idealmente controlleresti se entrambi i listener hanno emesso almeno una volta
        setIsLoadingTrips(false);

    }, [ownedTrips, participantTrips]);

    useEffect(() => {
        if (!user) return;

        // 1. Query per i viaggi di cui sei OWNER
        const qOwner = query(
            collection(db, EntityKeys.tripsKey),
            where('owner', '==', user.uid)
        );

        // 2. Query per i viaggi di cui sei PARTECIPANTE
        const qParticipant = query(
            collection(db, EntityKeys.tripsKey),
            where('participantIds', 'array-contains', user.uid)
        );

        // Listener 1: Owner
        const unsubscribeOwner = onSnapshot(qOwner, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Trip[];
            setOwnedTrips(data);
        }, (error) => console.error("Err Owner:", error));

        // Listener 2: Participant
        const unsubscribeParticipant = onSnapshot(qParticipant, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Trip[];
            setParticipantTrips(data);
        }, (error) => console.error("Err Participant:", error));

        return () => {
            unsubscribeOwner();
            unsubscribeParticipant();
        };
    }, [user]);


    // Funzione per aprire il modale
    const handleOpenDeleteModal = (trip: Trip) => {
        const tripToDelete = trips.find(t => t.id === trip?.id);
        if (tripToDelete) {
            setSelectedTrip(tripToDelete);
            setIsDeleteModalOpen(true);
        }
    };

    const handleConfirmDelete = async () => {
        if (!user || !selectedTrip) { return; }

        setIsDeleting(true);
        try {
            const tripDocRef = doc(db, EntityKeys.tripsKey, selectedTrip.id as string);
            await deleteDoc(tripDocRef);
        } catch (error) {
            console.error("Errore durante l'eliminazione:", error);
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setSelectedTrip(null);
        }
    };

    if (loading || !user) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar backPath="/dashboard" breadcrumb={breadcrumbPaths} />
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title="Confermi l'eliminazione?"
                confirmText="Elimina"
                icon={<FaExclamationTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
            >
                <p>
                    Stai per eliminare il viaggio <strong className="font-semibold text-gray-800 dark:text-gray-200">{selectedTrip?.name}</strong>. Questa azione è irreversibile.
                </p>
            </ConfirmationModal>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <PageTitle title='I Miei Viaggi' subtitle='Organizza e visualizza le tue prossime avventure.' className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    <Button
                        variant="secondary"
                        size={"sm"}
                        onClick={() => router.push(appRoutes.tripMetadata('new'))}
                        className="w-full md:w-auto whitespace-nowrap"
                    >
                        <FaPlus className="mr-2" />
                        Aggiungi Viaggio
                    </Button>
                </PageTitle>


                {(() => {
                    if (isLoadingTrips) {
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                                {[new Array(6)].map((_, i) => {
                                    const key = `loading-${i}`;
                                    return <div key={key} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-40"></div>;
                                })}
                            </div>
                        );
                    } else if (trips.length > 0) {
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {trips.map(trip => (
                                    <TripCard
                                        isOwner={trip.owner === user.uid}
                                        key={trip.id} trip={trip} onDelete={() => handleOpenDeleteModal(trip)} />
                                ))}
                            </div>
                        );
                    } else {
                        return (
                            <EmptyData title='Nessun viaggio ancora' subtitle='Inizia a pianificare la tua prossima avventura' />
                        );
                    }
                })()}
            </main>
        </div>
    );
}

