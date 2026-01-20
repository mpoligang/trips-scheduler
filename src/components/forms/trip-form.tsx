'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { DateRange } from 'react-day-picker';
import { Trip, TripParticipant } from '@/models/Trip'; // Importa anche TripParticipant
import DateRangePicker from '@/components/inputs/date-range-picker';
import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import PageTitle from '@/components/generics/page-title';
import Loader from '@/components/generics/loader';
import { FaPlus, FaTimes, FaTrashAlt } from 'react-icons/fa';
import UserSearch from '@/components/inputs/user-search'; // Nuovo componente
import { appRoutes } from '@/utils/appRoutes';
import EmptyData from '@/components/cards/empty-data';
import { EntityKeys } from '@/utils/entityKeys';
import ActionStickyBar from '../actions/action-sticky-bar';
import FormSection from '../generics/form-section';

export default function TripForm() {

    const { user, loading } = useAuth();
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


    // Carica i dati in modalità modifica
    useEffect(() => {
        const getData = async () => {
            if (isEditMode && user) {
                const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
                const tripDoc = await getDoc(tripDocRef);
                if (tripDoc.exists()) {
                    const data = tripDoc.data() as Trip;
                    // Controllo sicurezza: solo owner o partecipanti possono vedere/modificare
                    // (Anche se Firestore rules bloccano, è bene gestire UI)
                    if (data.owner !== user.uid && !data.participantIds?.includes(user.uid)) {
                        setError("Non hai i permessi per modificare questo viaggio.");
                        setIsLoadingData(false);
                        return;
                    }

                    setName(data.name);
                    setDestinations(data.destinations || []);
                    setParticipants(data.participants || []); // Carica partecipanti
                    setDateRange({
                        from: (data.startDate as Timestamp).toDate(),
                        to: (data.endDate as Timestamp).toDate(),
                    });
                } else {
                    setError("Viaggio non trovato.");
                }
            }
            setIsLoadingData(false);
        };
        getData();
    }, [isEditMode, tripId, user]);

    // Gestione Destinazioni
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

    // Gestione Partecipanti
    const handleAddParticipant = (userToAdd: any) => {
        // Evita duplicati
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

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !dateRange?.from || !dateRange.to) {
            setError("Tutti i campi obbligatori devono essere compilati.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        // Estrai solo gli ID per le regole di sicurezza
        const participantIds = participants.map(p => p.uid);

        const tripData: Partial<Trip> = {
            name,
            startDate: Timestamp.fromDate(dateRange.from),
            endDate: Timestamp.fromDate(dateRange.to),
            // owner: user.uid, // Non sovrascrivere l'owner in edit!
            destinations,
            participants,   // Salva dati completi per UI
            participantIds, // Salva ID per Security Rules
        };

        try {
            if (isEditMode) {
                const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
                await updateDoc(tripDocRef, tripData);
            } else {
                const tripsCollectionRef = collection(db, EntityKeys.tripsKey);
                // In creazione aggiungi l'owner
                await addDoc(tripsCollectionRef, {
                    ...tripData,
                    owner: user.uid,
                    createdAt: serverTimestamp()
                });
            }
            router.push(appRoutes.home);
        } catch (err) {
            console.error("Errore nel salvataggio del viaggio:", err);
            setError("Impossibile salvare il viaggio. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || isLoadingData) {
        return <Loader />;
    }

    return (
        <div className="space-y-8 pb-24">

            <PageTitle title={isEditMode ? 'Modifica il tuo viaggio' : 'Crea un nuovo viaggio'}
                subtitle={isEditMode ? 'Aggiorna i dettagli e invita i tuoi amici.' : 'Pianifica la tua prossima avventura.'} />

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
                            label=" Paesi o città da visitare"
                            type="text"
                            value={currentDestination}
                            onChange={(e) => setCurrentDestination(e.target.value)}
                            placeholder="Es. Roma"
                            className="flex-grow"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDestination(); } }}
                        />
                        <Button variant="secondary" type="button" onClick={handleAddDestination} className="w-auto h-10" size="sm">
                            <FaPlus />
                            <span className="ml-2">Aggiungi</span>
                        </Button>
                    </div>
                    {destinations.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {destinations.map(dest => (
                                <span key={dest} className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-sm font-medium px-3 py-1 rounded-full">
                                    {dest}
                                    <button type="button" onClick={() => handleRemoveDestination(dest)} className="text-purple-500 hover:text-purple-700 dark:hover:text-purple-300">
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
                            excludeIds={[user?.uid || '', ...participants.map(p => p.uid)]} // Esclude se stessi e chi è già aggiunto
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
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{participant.displayName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{participant.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveParticipant(participant.uid)}
                                        className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                                        title="Rimuovi partecipante"
                                    >
                                        <FaTrashAlt size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyData title='Nessun compagno di viaggio aggiunto.' subtitle='Invita i tuoi amici a unirsi al viaggio!' />
                    )}
                </FormSection>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <ActionStickyBar
                    handleCancel={() => { router.push(appRoutes.home); }}
                    isSubmitting={isSubmitting}
                    isNew={!isEditMode}
                />


            </form>
        </div>
    );
}