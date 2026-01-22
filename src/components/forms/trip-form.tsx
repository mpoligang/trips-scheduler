'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, Timestamp, increment } from 'firebase/firestore';
import { DateRange } from 'react-day-picker';
import { Trip, TripParticipant } from '@/models/Trip';
import DateRangePicker from '@/components/inputs/date-range-picker';
import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import PageTitle from '@/components/generics/page-title';
import Loader from '@/components/generics/loader';
import { FaPlus, FaTimes, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';
import UserSearch from '@/components/inputs/user-search';
import { appRoutes } from '@/utils/appRoutes';
import EmptyData from '@/components/cards/empty-data';
import { EntityKeys } from '@/utils/entityKeys';
import ActionStickyBar from '../actions/action-sticky-bar';
import FormSection from '../generics/form-section';
import DialogComponent from '@/components/modals/confirm-modal'; // Importa il modale
import { getActivePlan } from '@/utils/planUtils';
import { unlimited } from '@/configs/app-config';

export default function TripForm() {
    const { user, loading, userData } = useAuth();
    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId as string;
    const isEditMode = tripId !== 'new';

    // State del form
    const [name, setName] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [destinations, setDestinations] = useState<string[]>([]);
    const [participants, setParticipants] = useState<TripParticipant[]>([]);
    const [currentDestination, setCurrentDestination] = useState('');

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(isEditMode);

    // Stato per il modale dei limiti
    const [limitError, setLimitError] = useState<{ title: string; message: string } | null>(null);

    // Calcolo del piano attivo
    const planConfig = useMemo(() => getActivePlan(userData), [userData]);

    useEffect(() => {
        const getData = async () => {
            if (isEditMode && user) {
                try {
                    const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
                    const tripDoc = await getDoc(tripDocRef);
                    if (tripDoc.exists()) {
                        const data = tripDoc.data() as Trip;
                        if (data.owner !== user.uid && !data.participantIds?.includes(user.uid)) {
                            setError("Non hai i permessi per modificare questo viaggio.");
                            setIsLoadingData(false);
                            return;
                        }

                        setName(data.name);
                        setDestinations(data.destinations || []);
                        setParticipants(data.participants || []);
                        setDateRange({
                            from: (data.startDate as Timestamp).toDate(),
                            to: (data.endDate as Timestamp).toDate(),
                        });
                    } else {
                        setError("Viaggio non trovato.");
                    }
                } catch (err) {
                    console.error(err);
                    setError("Errore nel caricamento dei dati.");
                }
            }
            setIsLoadingData(false);
        };
        getData();
    }, [isEditMode, tripId, user]);

    const handleAddDestination = () => {
        const trimmedDest = currentDestination.trim();
        if (trimmedDest && !destinations.includes(trimmedDest)) {
            setDestinations([...destinations, trimmedDest]);
        }
        setCurrentDestination('');
    };

    const handleRemoveDestination = (destinationToRemove: string) => {
        setDestinations(destinations.filter(d => d !== destinationToRemove));
    };

    const handleAddParticipant = (userToAdd: any) => {
        if (participants.some(p => p.uid === userToAdd.uid)) return;
        const newParticipant: TripParticipant = {
            uid: userToAdd.uid,
            email: userToAdd.email,
            displayName: userToAdd.firstName ? `${userToAdd.firstName} ${userToAdd.lastName || ''}` : userToAdd.email.split('@')[0]
        };
        setParticipants([...participants, newParticipant]);
    };

    const handleRemoveParticipant = (uidToRemove: string) => {
        setParticipants(participants.filter(p => p.uid !== uidToRemove));
    };

    // Funzione per incrementare il numero di viaggi nell'utente
    const incrementUserTripCount = async () => {
        if (!userData?.uid) return;
        const userRef = doc(db, EntityKeys.usersKey, userData.uid);
        await updateDoc(userRef, {
            totalTripsCreated: increment(1)
        });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!user || !dateRange?.from || !dateRange.to) {
            setError("Tutti i campi obbligatori devono essere compilati.");
            return;
        }

        // --- CONTROLLO LIMITI PIANO ---
        if (!isEditMode) {
            const currentTrips = userData?.totalTripsCreated || 0;
            if (planConfig.maxTrips !== unlimited && currentTrips >= (planConfig.maxTrips as number)) {
                setLimitError({
                    title: "Limite Viaggi Raggiunto",
                    message: `Il tuo piano ${planConfig.name} ti permette di creare fino a ${planConfig.maxTrips} viaggi. Passa a Premium per crearne infiniti!`
                });
                return;
            }
        }

        setIsSubmitting(true);
        setError(null);

        const participantIds = participants.map(p => p.uid);
        const tripData: Partial<Trip> = {
            name,
            startDate: Timestamp.fromDate(dateRange.from),
            endDate: Timestamp.fromDate(dateRange.to),
            destinations,
            participants,
            participantIds,
        };

        try {
            if (isEditMode) {
                const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
                await updateDoc(tripDocRef, tripData);
            } else {
                const tripsCollectionRef = collection(db, EntityKeys.tripsKey);
                await addDoc(tripsCollectionRef, {
                    ...tripData,
                    owner: user.uid,
                    createdAt: serverTimestamp()
                });

                await incrementUserTripCount();
            }
            router.push(appRoutes.home);
        } catch (err) {
            console.error("Errore nel salvataggio:", err);
            setError("Impossibile salvare il viaggio. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || isLoadingData) return <Loader />;

    return (
        <div className="space-y-8 pb-24">
            <PageTitle
                title={isEditMode ? 'Modifica il tuo viaggio' : 'Crea un nuovo viaggio'}
                subtitle={isEditMode ? 'Aggiorna i dettagli e invita i tuoi amici.' : 'Pianifica la tua prossima avventura.'}
            />

            {/* Modale Errore Limiti */}
            <DialogComponent
                isOpen={!!limitError}
                onClose={() => setLimitError(null)}
                onConfirm={() => {
                    setLimitError(null);
                    // Opzionale: router.push(appRoutes.billing)
                }}
                title={limitError?.title || ''}
                isLoading={false}
                confirmText="Scopri i piani"
                showCancelButton={true}
                cancelText="Chiudi"
            >
                <div className="flex flex-col items-center text-center py-4">
                    <FaExclamationTriangle className="text-amber-500 text-4xl mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{limitError?.message}</p>
                </div>
            </DialogComponent>

            <form onSubmit={handleSubmit} className='space-y-8'>
                <FormSection title="Dettagli del Viaggio">
                    <div className="space-y-6">
                        <Input id="trip-name" label="Nome del Viaggio" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                        <DateRangePicker value={dateRange} onChange={setDateRange} />
                    </div>
                </FormSection>

                <FormSection title="Destinazioni" >
                    <div className="flex items-end gap-2">
                        <Input
                            id="destination-input"
                            label="Paesi o città da visitare"
                            value={currentDestination}
                            onChange={(e) => setCurrentDestination(e.target.value)}
                            placeholder="Es. Roma"
                            className="flex-grow"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDestination(); } }}
                        />
                        <Button variant="secondary" type="button" onClick={handleAddDestination} className="w-auto h-10" size="sm">
                            <FaPlus /> <span className="ml-2">Aggiungi</span>
                        </Button>
                    </div>
                    {destinations.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {destinations.map(dest => (
                                <span key={dest} className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-sm font-medium px-3 py-1 rounded-full">
                                    {dest}
                                    <button type="button" onClick={() => handleRemoveDestination(dest)} className="text-purple-500 hover:text-purple-700">
                                        <FaTimes size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </FormSection>

                <FormSection title="Compagni di Viaggio" >
                    <div className="w-full mb-5">
                        <UserSearch
                            onSelect={handleAddParticipant}
                            placeholder="Cerca amici per email..."
                            excludeIds={[user?.uid || '', ...participants.map(p => p.uid)]}
                        />
                    </div>
                    {participants.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {participants.map((participant) => (
                                <li key={participant.uid} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                                            {participant.displayName?.charAt(0).toUpperCase() || participant.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{participant.displayName}</p>
                                            <p className="text-xs text-gray-500">{participant.email}</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveParticipant(participant.uid)} className="text-gray-400 hover:text-red-500 p-2">
                                        <FaTrashAlt size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyData title='Nessun compagno.' subtitle='Invita i tuoi amici!' />
                    )}
                </FormSection>

                {error && <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</p>}

                <ActionStickyBar
                    handleCancel={() => { router.push(appRoutes.home); }}
                    isSubmitting={isSubmitting}
                    isNew={!isEditMode}
                />
            </form>
        </div>
    );
}