'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, doc, deleteDoc, where } from 'firebase/firestore';
import { Trip } from '@/models/Trip';
import { FaPlus } from 'react-icons/fa';
import DialogComponent from '@/components/modals/confirm-modal';
import Navbar from '@/components/navigations/navbar';
import TripCard from '@/components/cards/trip-card';
import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
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



    useEffect(() => {
        if (!loading && !user) { router.push(appRoutes.login); }
    }, [user, loading, router]);

    const [ownedTrips, setOwnedTrips] = useState<Trip[]>([]);
    const [participantTrips, setParticipantTrips] = useState<Trip[]>([]);


    useEffect(() => {
        const allTrips = [...ownedTrips, ...participantTrips];
        const uniqueTrips = Array.from(new Map(allTrips.map(item => [item.id, item])).values());
        setTrips(uniqueTrips);
        setIsLoadingTrips(false);

    }, [ownedTrips, participantTrips]);

    useEffect(() => {
        if (!user) { return; }

        const qOwner = query(
            collection(db, EntityKeys.tripsKey),
            where('owner', '==', user.uid)
        );

        const qParticipant = query(
            collection(db, EntityKeys.tripsKey),
            where('participantIds', 'array-contains', user.uid)
        );

        const unsubscribeOwner = onSnapshot(qOwner, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Trip[];
            setOwnedTrips(data);
        }, (error) => console.error("Err Owner:", error));

        const unsubscribeParticipant = onSnapshot(qParticipant, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Trip[];
            setParticipantTrips(data);
        }, (error) => console.error("Err Participant:", error));

        return () => {
            unsubscribeOwner();
            unsubscribeParticipant();
        };
    }, [user]);


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
            <Navbar breadcrumb={[]} />
            <DialogComponent
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title="Confermi l'eliminazione?"
                confirmText="Elimina"
            >
                <p>
                    Stai per eliminare il viaggio <strong className="font-semibold text-gray-800 dark:text-gray-200">{selectedTrip?.name}</strong>. Questa azione è irreversibile.
                </p>
            </DialogComponent>

            <main className="p-6">

                <PageTitle title=' I miei viaggi' subtitle='Organizza e visualizza le tue prossime avventure.' className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                    <Button
                        variant="secondary"
                        size={"sm"}
                        onClick={() => router.push(appRoutes.settings('new'))}
                        className="w-full md:w-auto whitespace-nowrap"
                    >
                        <FaPlus className="mr-2" />
                        Aggiungi Viaggio
                    </Button>
                </PageTitle>


                {(() => {
                    if (isLoadingTrips) {
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                                {[new Array(6)].map((_, i) => {
                                    const key = `loading-${i}`;
                                    return <div key={key} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-40"></div>;
                                })}
                            </div>
                        );
                    } else if (trips.length > 0) {
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div >
    );
}

