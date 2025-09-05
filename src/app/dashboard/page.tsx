'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { PathItem } from '@/models/PathItem';
import { Trip } from '@/models/Trip';
import { FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import ConfirmationModal from '@/components/confirm-modal';
import Navbar from '@/components/navbar';
import TripCard from '@/components/trip-card';
import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
import Button from '@/components/button';
import PageTitle from '@/components/page-title';
import EmptyData from '@/components/empty-data';
import Loader from '@/components/loader';

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoadingTrips, setIsLoadingTrips] = useState(true);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const breadcrumbPaths: PathItem[] = [{ label: 'Dashboard', href: '/dashboard' }];

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            const q = query(collection(db, 'trips'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const tripsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Trip[];
                setTrips(tripsData);
                setIsLoadingTrips(false);
            });
            return () => unsubscribe();
        }
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
            const tripDocRef = doc(db, 'trips', selectedTrip.id as string);
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

                <PageTitle title='I Miei Viaggi' subtitle='Organizza e visualizza le tue prossime avventure.'>
                    <Button
                        variant="secondary"
                        onClick={() => router.push('/dashboard/trips/new/metadata')}
                        className="w-full md:w-auto"
                    >
                        <FaPlus className="mr-2" />
                        Aggiungi Viaggio
                    </Button>
                </PageTitle>


                {isLoadingTrips ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-40"></div>
                        ))}
                    </div>
                ) : trips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trips.map(trip => (
                            <TripCard key={trip.id} trip={trip} onDelete={() => handleOpenDeleteModal(trip)} />
                        ))}
                    </div>
                ) : (
                    <EmptyData title='Nessun viaggio ancora' subtitle='Inizia a pianificare la tua prossima avventura' />
                )}
            </main>
        </div>
    );
}

