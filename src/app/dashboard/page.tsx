'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';

import { Trip } from '@/models/Trip';
import { useAuth } from '@/context/authProvider';
import { getUserTripsAction, deleteOrLeaveTripAction } from '@/actions/trip-actions';

import DialogComponent from '@/components/modals/confirm-modal';
import Navbar from '@/components/navigations/navbar';
import TripCard from '@/components/cards/trip-card';
import Button from '@/components/actions/button';
import PageTitle from '@/components/generics/page-title';
import EmptyData from '@/components/cards/empty-data';
import Loader from '@/components/generics/loader';
import { appRoutes } from '@/utils/appRoutes';
import { sendEmailToUpgrade } from '@/utils/open-link.utils';
import { AuthStatusEnum } from '@/models/Auth';

export default function DashboardPage() {
    const { user, userData, status, refreshUserData } = useAuth();
    const router = useRouter();

    const [ownedTrips, setOwnedTrips] = useState<Trip[]>([]);
    const [participantTrips, setParticipantTrips] = useState<Trip[]>([]);
    const [isLoadingTrips, setIsLoadingTrips] = useState(true);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLimitModalOpen, setIsLimitModalOpen] = useState<boolean>(false);

    const allTrips = useMemo(() => [...ownedTrips, ...participantTrips], [ownedTrips, participantTrips]);

    // --- FETCH CON SERVER ACTION ---
    const fetchTrips = useCallback(async () => {
        if (!user) return;
        setIsLoadingTrips(true);

        const result = await getUserTripsAction(user.id);

        if (result.success && result.data) {
            setOwnedTrips(result.data.owned as Trip[]);
            setParticipantTrips(result.data.participated as Trip[]);
        } else {
            toast.error("Errore nel caricamento dei viaggi");
        }

        setIsLoadingTrips(false);
    }, [user]);

    useEffect(() => {
        if (user) fetchTrips();
    }, [user, fetchTrips]);

    // --- DELETE CON SERVER ACTION ---
    async function handleConfirmDelete() {
        if (!user || !selectedTrip) return;

        setIsDeleting(true);
        const isOwner = selectedTrip.owner_id === user.id;
        const toastId = toast.loading(isOwner ? "Eliminazione viaggio..." : "Abbandono viaggio...");

        const result = await deleteOrLeaveTripAction(selectedTrip.id, user.id, isOwner);

        if (result.success) {
            toast.success(isOwner ? "Viaggio eliminato" : "Viaggio abbandonato", { id: toastId });
            await fetchTrips();
            await refreshUserData();
        } else {
            toast.error(result.error || "Errore durante l'operazione", { id: toastId });
        }

        setIsDeleting(false);
        setIsDeleteModalOpen(false);
    }

    function handleAddTripClick() {
        const ownedCount = ownedTrips.length;
        const plan = userData?.plan;
        if (plan?.max_trips !== null && ownedCount >= (plan?.max_trips || 0)) {
            setIsLimitModalOpen(true);
            return;
        }
        router.push(appRoutes.settings('new'));
    }

    if (status === AuthStatusEnum.INITIALIZING && !user) return <Loader />;
    if (status === AuthStatusEnum.UNAUTHENTICATED) return null;

    return (
        <div className="min-h-screen bg-gray-900">
            <Navbar breadcrumb={[]} />

            <DialogComponent
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title={selectedTrip?.owner_id === user?.id ? "Elimina Viaggio" : "Abbandona Viaggio"}
                confirmText={selectedTrip?.owner_id === user?.id ? "Elimina" : "Esci"}
            >
                <p>Stai per {selectedTrip?.owner_id === user?.id ? "eliminare" : "abbandonare"} <strong className="text-white">{selectedTrip?.name}</strong>.</p>
            </DialogComponent>

            <DialogComponent
                isLoading={false}
                isOpen={isLimitModalOpen}
                onClose={() => setIsLimitModalOpen(false)}
                onConfirm={() => sendEmailToUpgrade(`${userData?.first_name} ${userData?.last_name}`, `${user?.email || ''}`)}
                title="Limite raggiunto"
                confirmText="Upgrade"
            >
                <p>Hai raggiunto il limite del piano {userData?.plan?.name}.</p>
            </DialogComponent>

            <main className="p-6">
                <PageTitle title='I miei viaggi' subtitle="Gestisci le tue avventure.">
                    <Button variant="secondary" size="sm" onClick={handleAddTripClick} disabled={isLoadingTrips || !userData}>
                        <FaPlus className="mr-2" /> Aggiungi
                    </Button>
                </PageTitle>

                {isLoadingTrips ? (
                    <div className="flex justify-center py-20"><Loader /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {allTrips.map(trip => (
                            <TripCard
                                key={trip.id}
                                trip={trip}
                                isOwner={trip.owner_id === user?.id}
                                onDelete={() => { setSelectedTrip(trip); setIsDeleteModalOpen(true); }}
                            />
                        ))}
                    </div>
                )}
                {!isLoadingTrips && allTrips.length === 0 && (
                    <EmptyData title="Aggiungi il tuo primo viaggio" subtitle="Clicca sul pulsante qui sopra per iniziare!" />
                )}
            </main>
        </div>
    );
}