'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { useAuth } from '@/context/authProvider';
import { upsertTripAction } from '@/actions/trip-actions';
import { useTrip } from '@/context/tripContext';
import { appRoutes } from '@/utils/appRoutes';

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
import { FaPlus, FaTrashAlt, FaExclamationTriangle } from 'react-icons/fa';
import { sendEmailToUpgrade } from '@/utils/openMailer';
import { UserData } from '@/models/UserData';
import Badge from '../generics/badge';
import toast from 'react-hot-toast';
import { formatDateForPostgres } from '@/utils/dateTripUtils';

export default function TripForm() {
    const { user, refreshUserData, userData } = useAuth();
    const { trip, participants, loading: contextLoading, refreshData } = useTrip();

    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId as string;
    const isEditMode = tripId !== 'new';

    const [name, setName] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [destinations, setDestinations] = useState<string[]>([]);
    const [currentDestination, setCurrentDestination] = useState('');
    const [participantsState, setParticipants] = useState<Partial<UserData>[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [limitError, setLimitError] = useState<{ title: string; message: string } | null>(null);

    // 1. POPOLAMENTO DATI (Edit Mode & Participants Sync)
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

        // Sincronizza i partecipanti dal context allo stato locale
        // Il context restituisce oggetti già "appiattiti" (senza .profiles)
        if (participants && participants.length > 0) {
            setParticipants(participants);
        }
    }, [isEditMode, trip, participants]);

    // Gestione Destinazioni
    const handleAddDestination = () => {
        const trimmedDest = currentDestination.trim();
        if (trimmedDest && !destinations.includes(trimmedDest)) {
            setDestinations([...destinations, trimmedDest]);
        }
        setCurrentDestination('');
    };

    const handleRemoveDestination = (dest: string) => setDestinations(prev => prev.filter(d => d !== dest));

    const handleAddParticipant = (searchResult: Partial<UserData>) => {
        const newParticipant = {
            id: searchResult.id,
            first_name: searchResult.first_name,
            last_name: searchResult.last_name,
            trip_id: tripId
        };
        setParticipants(() => [...participantsState, newParticipant]);
    };

    const handleRemoveParticipant = (identifier: string) => {
        setParticipants((prev) => prev.filter(p => (p.id !== identifier)));
    };

    // 3. SUBMIT
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!user || !dateRange?.from || !dateRange.to) {
            toast.error("Compila tutti i campi obbligatori.");
            return;
        }

        setIsSubmitting(true);
        toast.dismiss();

        try {
            // Logica corretta estrazione ID
            const participantIds = participantsState.map((p: any) => {
                // Priorità 1: 'uid' (Nuovi aggiunti dalla ricerca)
                if (p.uid) return p.uid;
                // Priorità 2: 'id' (Esistenti caricati dal Context/DB)
                if (p.id) return p.id;

                return null;
            }).filter((id) => id !== null) as string[];


            const result = await upsertTripAction({
                id: isEditMode ? tripId : 'new',
                name,
                startDate: formatDateForPostgres(dateRange.from),
                endDate: formatDateForPostgres(dateRange.to),
                destinations,
                participantIds: participantIds
            });

            if (result.error === "limit_reached") {
                setLimitError({
                    title: "Limite Raggiunto",
                    message: result.message || "Non puoi creare altri viaggi."
                });
            } else if (result.error) {
                toast.error(result.error);
            } else {
                await refreshUserData();
                if (trip?.id) {
                    await refreshData(true);
                } else {
                    router.push(appRoutes.home);
                }
            }
        } catch (err) {
            console.error("Errore submit:", err);
            toast.error("Errore imprevisto. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isEditMode && (contextLoading || !trip)) return <Loader />;

    return (
        <div className="space-y-8 pb-24">
            <PageTitle
                title={isEditMode ? 'Modifica Viaggio' : 'Nuovo Viaggio'}
                subtitle={isEditMode ? 'Aggiorna i dettagli.' : 'Inizia una nuova avventura.'}
            />

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
                    <p className="text-gray-400">{limitError?.message}</p>
                </div>
            </DialogComponent>

            <form onSubmit={handleSubmit} className='space-y-8'>
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
                        <Button variant="secondary" type="button" onClick={handleAddDestination} size="sm" className='h-10'>
                            <FaPlus className="mr-2" /> Aggiungi
                        </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {destinations.map(dest => (
                            <Badge key={dest} text={dest} remove={handleRemoveDestination} showRemove />
                        ))}
                    </div>
                </FormSection>

                <FormSection title="Compagni di Viaggio">
                    <div className="mb-6">
                        <UserSearch
                            onSelect={handleAddParticipant}
                            excludeIds={[user?.id || '', ...participantsState.map((p: Partial<UserData>) => p.id as string)]}
                        />
                    </div>

                    {participantsState.length > 0 ? (
                        <ul className="divide-y divide-gray-800 rounded-lg overflow-hidden">
                            {participantsState.map((p) => (
                                <li key={p.username} className="flex mb-4 items-center rounded-md justify-between p-3 bg-gray-800 hover:bg-gray-700/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 flex-shrink-0 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                                            {(p.first_name as string).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-100">
                                                {p.first_name} {p.last_name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">

                                        {/* Mostra il cestino solo se NON è l'owner e NON è l'utente corrente */}
                                        {(p.id !== trip?.owner_id) && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveParticipant(p.id as string)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-900/20"
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

                <ActionStickyBar
                    handleCancel={() => router.push(appRoutes.home)}
                    isSubmitting={isSubmitting}
                    isNew={!isEditMode}
                />
            </form>
        </div>
    );
}