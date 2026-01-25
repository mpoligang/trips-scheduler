'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { useAuth } from '@/context/authProvider';
import { upsertTripAction } from '@/actions/trip-actions'; // La server action aggiornata
import { useTrip } from '@/context/tripContext';
import { appRoutes } from '@/utils/appRoutes';
import { UserResult } from '@/components/inputs/user-search'; // Assumo tu abbia questo tipo esportato

// Components
import DateRangePicker from '@/components/inputs/date-range-picker';
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import PageTitle from '@/components/generics/page-title';
import Loader from '@/components/generics/loader';
import UserSearch from '@/components/inputs/user-search';
import EmptyData from '@/components/cards/empty-data';
import ActionStickyBar from '../actions/action-sticky-bar';
import FormSection from '../generics/form-section';
import DialogComponent from '@/components/modals/confirm-modal';
import { FaPlus, FaTimes, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';
import { TripParticipant } from '@/models/Trip';
import { sendEmailToUpgrade } from '@/utils/openMailer';

export default function TripForm() {
    const { user, refreshUserData, userData } = useAuth();
    // Assicurati che il context esponga questi metodi/dati
    const { trip, participants, loading: contextLoading } = useTrip();

    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId as string;
    const isEditMode = tripId !== 'new';

    // Form State
    const [name, setName] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [destinations, setDestinations] = useState<string[]>([]);
    const [currentDestination, setCurrentDestination] = useState('');
    const [participantsState, setParticipants] = useState<TripParticipant[]>(participants || []);

    // UI State
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [limitError, setLimitError] = useState<{ title: string; message: string } | null>(null);

    // 1. POPOLAMENTO DATI (Edit Mode)
    // Sincronizza lo stato locale con i dati del context quando vengono caricati
    useEffect(() => {
        if (isEditMode && trip) {
            setName(trip.name);
            setDestinations(trip.destinations || []);
            if (trip.start_date && trip.end_date) {
                setDateRange({
                    from: new Date(trip.start_date),
                    to: new Date(trip.end_date)
                });
            }
        }
    }, [isEditMode, trip]);

    // Gestione Destinazioni
    const handleAddDestination = () => {
        const trimmedDest = currentDestination.trim();
        if (trimmedDest && !destinations.includes(trimmedDest)) {
            setDestinations([...destinations, trimmedDest]);
        }
        setCurrentDestination('');
    };

    const handleRemoveDestination = (dest: string) => setDestinations(prev => prev.filter(d => d !== dest));

    // 2. GESTIONE PARTECIPANTI (Normalizzazione)
    const handleAddParticipant = (searchResult: UserResult) => {
        // Evita duplicati o se stesso
        if (participants.some(p => p.uid === searchResult.uid)) return;
        if (searchResult.uid === user?.id) return;

        // Normalizziamo i dati per matchare la struttura del DB (snake_case) usata nel context
        const newParticipant = {
            uid: searchResult.uid,
            user_id: searchResult.uid,
            email: searchResult.email,
            first_name: searchResult.firstName, // Mapping fondamentale
            last_name: searchResult.lastName,
            trip_id: tripId
        };

        setParticipants((prev: TripParticipant[]) => [...prev, newParticipant]);
    };

    const handleRemoveParticipant = (uid: string) => setParticipants((prev: TripParticipant[]) => prev.filter(p => p.uid !== uid));

    // 3. SUBMIT
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!user || !dateRange?.from || !dateRange.to) {
            setError("Compila tutti i campi obbligatori.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Estraiamo solo gli ID per la server action
            const participantIds = participants.map(p => p.uid);

            const result = await upsertTripAction({
                id: isEditMode ? tripId : 'new',
                name,
                startDate: dateRange.from,
                endDate: dateRange.to,
                destinations,
                participantIds: participantIds
            });

            if (result.error === "limit_reached") {
                setLimitError({
                    title: "Limite Raggiunto",
                    message: result.message || "Non puoi creare altri viaggi."
                });
            } else if (result.error) {
                setError(result.error);
            } else {
                await refreshUserData(); // Aggiorna contatore viaggi utente
                router.push(appRoutes.home);
            }
        } catch (err) {
            console.error("Errore submit:", err);
            setError("Errore imprevisto. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Mostra loader se siamo in edit ma i dati non sono ancora nel context
    if (isEditMode && (contextLoading || !trip)) return <Loader />;

    return (
        <div className="space-y-8 pb-24">
            <PageTitle
                title={isEditMode ? 'Modifica Viaggio' : 'Nuovo Viaggio'}
                subtitle={isEditMode ? 'Aggiorna i dettagli.' : 'Inizia una nuova avventura.'}
            />

            {/* Modale Limiti */}
            <DialogComponent
                isOpen={!!limitError}
                onClose={() => setLimitError(null)}
                onConfirm={() => sendEmailToUpgrade(`${userData?.first_name} ${userData?.last_name}`, `${user?.email || ''}`)}
                title={limitError?.title || ''}
                isLoading={false}
                confirmText="Vedi Piani"
                showCancelButton={true}
                cancelText="Chiudi"
            >
                <div className="flex flex-col items-center text-center py-4">
                    <FaExclamationTriangle className="text-amber-500 text-4xl mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">{limitError?.message}</p>
                </div>
            </DialogComponent>

            <form onSubmit={handleSubmit} className='space-y-8'>
                {/* Sezione Dettagli */}
                <FormSection title="Dettagli Principali">
                    <div className="space-y-6">
                        <Input
                            id="trip-name"
                            label="Nome Viaggio"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <DateRangePicker value={dateRange} onChange={setDateRange} required />
                    </div>
                </FormSection>

                {/* Sezione Destinazioni */}
                <FormSection title="Destinazioni">
                    <div className="flex items-end gap-2">
                        <Input
                            id="dest-input"
                            label="Aggiungi tappa"
                            value={currentDestination}
                            onChange={(e) => setCurrentDestination(e.target.value)}
                            placeholder="Es. Parigi"
                            className="flex-grow"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDestination(); } }}
                        />
                        <Button variant="secondary" type="button" onClick={handleAddDestination} size="sm">
                            <FaPlus className="mr-2" /> Aggiungi
                        </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {destinations.map(dest => (
                            <span key={dest} className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 text-sm font-medium px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                                {dest}
                                <button type="button" onClick={() => handleRemoveDestination(dest)} className="text-purple-500 hover:text-red-500 transition-colors">
                                    <FaTimes size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </FormSection>

                {/* Sezione Partecipanti */}
                <FormSection title="Compagni di Viaggio">
                    <div className="mb-6">
                        <UserSearch
                            onSelect={handleAddParticipant}
                            placeholder="Cerca per email..."
                            excludeIds={[user?.id || '', ...participants.map(p => p.uid)]}
                        />
                    </div>

                    {participantsState.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-800  rounded-lg overflow-hidden">
                            {participantsState.map((p) => (
                                <li key={p.uid} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                                            {(p.first_name || p.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {p.first_name ? `${p.first_name} ${p.last_name || ''}` : p.email.split('@')[0]}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {p.uid === trip?.owner_id && (
                                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Owner</span>
                                        )}
                                        {p.uid !== user?.id && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveParticipant(p.uid)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <FaTrashAlt size={14} />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyData title="Viaggi da solo?" subtitle="Cerca un amico per aggiungerlo al gruppo." />
                    )}
                </FormSection>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-4 rounded-lg text-center text-sm">
                        {error}
                    </div>
                )}

                <ActionStickyBar
                    handleCancel={() => router.push(appRoutes.home)}
                    isSubmitting={isSubmitting}
                    isNew={!isEditMode}
                />
            </form>
        </div>
    );
}