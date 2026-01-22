'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, doc, deleteDoc, where, updateDoc, increment } from 'firebase/firestore';
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
import { sendEmailToUpgrade } from '@/utils/openMailer';
import { getActivePlan } from '@/utils/planUtils';
import { unlimited } from '@/configs/app-config';

export default function DashboardPage() {
    const { user, loading, userData } = useAuth();
    const router = useRouter();

    const [ownedTrips, setOwnedTrips] = useState<Trip[]>([]);
    const [participantTrips, setParticipantTrips] = useState<Trip[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoadingTrips, setIsLoadingTrips] = useState(true);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLimitModalOpen, setIsLimitModalOpen] = useState<boolean>(false);

    const planConfig = useMemo(() => getActivePlan(userData), [userData]);

    // Snapshot per i viaggi di PROPRIETÀ
    useEffect(() => {
        if (!user) return;
        const qOwner = query(collection(db, EntityKeys.tripsKey), where('owner', '==', user.uid));
        return onSnapshot(qOwner, (snapshot) => {
            setOwnedTrips(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Trip[]);
        });
    }, [user]);

    // Snapshot per i viaggi come PARTECIPANTE
    useEffect(() => {
        if (!user) return;
        const qPart = query(collection(db, EntityKeys.tripsKey), where('participantIds', 'array-contains', user.uid));
        return onSnapshot(qPart, (snapshot) => {
            // Filtriamo per sicurezza quelli dove non siamo owner (per non avere duplicati)
            const data = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Trip))
                .filter(t => t.owner !== user.uid);
            setParticipantTrips(data);
            setIsLoadingTrips(false);
        });
    }, [user]);

    // Unione delle liste per la visualizzazione
    useEffect(() => {
        setTrips([...ownedTrips, ...participantTrips]);
    }, [ownedTrips, participantTrips]);

    const handleConfirmDelete = async () => {
        if (!user || !selectedTrip) return;
        setIsDeleting(true);
        try {
            // 1. Verifichiamo se siamo i proprietari PRIMA di eliminare
            const isOwner = selectedTrip.owner === user.uid;

            if (isOwner) {
                // Se sono il proprietario, elimino il viaggio per tutti
                await deleteDoc(doc(db, EntityKeys.tripsKey, selectedTrip.id as string));

                // 2. Decrementiamo il contatore solo se il viaggio era il nostro
                if (userData?.uid) {
                    await updateDoc(doc(db, EntityKeys.usersKey, userData.uid), {
                        totalTripsCreated: increment(-1)
                    });
                }
            } else {
                // Se sono solo un partecipante, dovrei solo "uscire" dal viaggio
                // (Logica opzionale: rimuovere il proprio UID da participantIds)
                console.log("L'utente non è il proprietario, non può eliminare il viaggio globale.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setSelectedTrip(null);
        }
    };

    const handleAddTripClick = () => {
        // --- IL CUORE DELLA TUA RICHIESTA ---
        // Controlliamo il numero di viaggi POSSEDUTI, non il totale della lista
        const ownedCount = ownedTrips.length;

        if (planConfig.maxTrips !== unlimited && ownedCount >= (planConfig.maxTrips as number)) {
            setIsLimitModalOpen(true);
            return;
        }
        router.push(appRoutes.settings('new'));
    };

    if (loading || !user) return <Loader />;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar breadcrumb={[]} />

            {/* Modale Eliminazione */}
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

            {/* Modale Limite (Basato su ownedTrips) */}
            <DialogComponent
                isOpen={isLimitModalOpen}
                onClose={() => setIsLimitModalOpen(false)}
                onConfirm={() => sendEmailToUpgrade(`${userData?.firstName} ${userData?.lastName}`, `${userData?.email || ''}`)}
                title="Limite viaggi raggiunto"
                confirmText="Contattaci"
                isLoading={false}
            >
                <p>Hai già creato <strong>{ownedTrips.length}</strong> viaggi (limite piano {planConfig.name}).</p>
                <p>Contatta il supporto per eseguire l&apos;upgrade del tuo piano. I viaggi a cui partecipi come invitato non contano per questo limite.</p>
            </DialogComponent>

            <main className="p-6">
                <PageTitle title='I miei viaggi' subtitle="Gestisci i tuoi viaggi e pianifica nuove avventure.">
                    <Button variant="secondary" size="sm" onClick={handleAddTripClick}>
                        <FaPlus className="mr-2" /> Aggiungi
                    </Button>
                </PageTitle>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ">
                    {trips.length > 0 && (
                        trips.map(trip => (
                            <TripCard
                                key={trip.id}
                                trip={trip}
                                isOwner={trip.owner === user.uid}
                                onDelete={() => {
                                    setSelectedTrip(trip);
                                    setIsDeleteModalOpen(true);
                                }}
                            />
                        ))
                    )}

                </div>
                {
                    !isLoadingTrips && trips.length === 0 && (
                        <EmptyData

                            title="Nessun viaggio trovato"
                            subtitle="Crea il tuo primo viaggio per iniziare a pianificare le tue avventure!"
                        />
                    )
                }
            </main>
        </div>
    );
}