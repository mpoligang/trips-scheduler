'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus } from 'react-icons/fa';

import { Trip } from '@/models/Trip';
import DialogComponent from '@/components/modals/confirm-modal';
import Navbar from '@/components/navigations/navbar';
import TripCard from '@/components/cards/trip-card';
import { useAuth } from '@/context/authProvider';
import Button from '@/components/actions/button';
import PageTitle from '@/components/generics/page-title';
import EmptyData from '@/components/cards/empty-data';
import Loader from '@/components/generics/loader';
import { appRoutes } from '@/utils/appRoutes';
import { sendEmailToUpgrade } from '@/utils/openMailer';
import { createClient } from '@/lib/client';
import { AuthStatusEnum } from '@/models/Auth';
import { EntityKeys } from '@/utils/entityKeys';

export default function DashboardPage() {
    const supabase = createClient();
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

    const fetchTrips = useCallback(async () => {
        if (!user) return;
        setIsLoadingTrips(true);
        try {
            const [ownedRes, partRes] = await Promise.all([
                supabase.from(EntityKeys.tripsKey).select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
                supabase.from(EntityKeys.participantsKey).select('trips (*)').eq('user_id', user.id)
            ]);

            if (ownedRes.error) throw ownedRes.error;
            setOwnedTrips(ownedRes.data || []);

            const participated = (partRes.data as any[])
                ?.map(row => row.trips)
                .filter(trip => trip && trip.owner_id !== user.id) || [];
            setParticipantTrips(participated as Trip[]);
        } catch (error) {
            console.error("❌ Errore fetchTrips:", error);
        } finally {
            setIsLoadingTrips(false);
        }
    }, [user, supabase]);

    // Avviamo il fetch non appena abbiamo l'utente, non importa lo status del profilo
    useEffect(() => {
        if (user) {
            fetchTrips();
        }
    }, [user, fetchTrips]);

    // --- RENDER LOGIC ---

    // 1. Caricamento critico: non sappiamo ancora se l'utente esiste (nuova scheda/refresh)
    if (status === AuthStatusEnum.INITIALIZING && !user) {
        return <Loader />;
    }


    // 2. Protezione: se siamo arrivati qui e non c'è user, usciamo
    if (status === AuthStatusEnum.UNAUTHENTICATED) return null;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar breadcrumb={[]} />

            {/* Modali */}
            <DialogComponent
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title={selectedTrip?.owner_id === user?.id ? "Elimina Viaggio" : "Abbandona Viaggio"}
                confirmText={selectedTrip?.owner_id === user?.id ? "Elimina" : "Esci"}
            >
                <p>Stai per {selectedTrip?.owner_id === user?.id ? "eliminare" : "abbandonare"} {selectedTrip?.name}.</p>
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
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleAddTripClick}
                        disabled={isLoadingTrips || !userData}
                    >
                        <FaPlus className="mr-2" /> Aggiungi
                    </Button>
                </PageTitle>

                {/* Grid Viaggi con caricamento locale */}
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
                {allTrips.length === 0 && <EmptyData title="Aggiungi il tuo primo viaggio" subtitle="Clicca sul pulsante qui sopra per iniziare!" />}
            </main>

        </div>
    );

    // Funzioni helper portate dentro per pulizia
    async function handleConfirmDelete() {
        if (!user || !selectedTrip) return;
        setIsDeleting(true);
        try {
            if (selectedTrip.owner_id === user.id) {
                await supabase.from(EntityKeys.tripsKey).delete().eq('id', selectedTrip.id);
            } else {
                await supabase.from(EntityKeys.participantsKey).delete().eq('trip_id', selectedTrip.id).eq('user_id', user.id);
            }
            await fetchTrips();
            await refreshUserData();

        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
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
}