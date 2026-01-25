'use client';

import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaPen, FaMap, FaUndo } from 'react-icons/fa';

// Supabase & Context
import { createClient } from '@/lib/client';
import { useTrip } from '@/context/tripContext';

// Modelli e Utility
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import { formatDateForPostgres, generateDateOptions, selectDateOption } from '@/utils/dateTripUtils';
import { Location } from '@/models/Location';

// Componenti UI
import ContextMenu from '@/components/actions/context-menu';
import PageTitle from '../generics/page-title';
import LinkPreview from '../inputs/link-preview';
import SearchLocation from '../inputs/search-location';
import Dropdown from '../inputs/dropdown';
import Input from '../inputs/input';
import ActionStickyBar from '../actions/action-sticky-bar';
import FormSection from '../generics/form-section';
import RichTextInput from '../inputs/rich-text-editor';

export default function AccommodationForm() {
    const router = useRouter();
    const params = useParams();
    const supabase = createClient();

    const { trip, accommodations, refreshData, isOwner } = useTrip();

    const tripId = params.tripId as string;
    const accommodationId = params.id as string;
    const isNew = accommodationId === 'new';

    // Stati del Form
    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [link, setLink] = useState('');
    const [location, setLocation] = useState<Location | null>(null);
    const [accommodationDestination, setAccommodationDestination] = useState<{ id: string; name: string } | null>(null);
    const [notes, setNotes] = useState<string>('');

    // NUOVO: Stati separati per le date
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();

    // Generazione opzioni date basate sul viaggio
    const dateOptions = useMemo(() => {
        if (!trip?.start_date || !trip?.end_date) return [];
        return generateDateOptions(new Date(trip.start_date), new Date(trip.end_date));
    }, [trip?.start_date, trip?.end_date]);

    // Mapping delle date selezionate per i Dropdown
    const selectedStartDateOption = useMemo(() =>
        startDate ? selectDateOption(startDate, dateOptions) : null
        , [startDate, dateOptions]);

    const selectedEndDateOption = useMemo(() =>
        endDate ? selectDateOption(endDate, dateOptions) : null
        , [endDate, dateOptions]);

    const populateForm = useCallback(() => {
        const acc = accommodations?.find(a => a.id === accommodationId);
        if (acc) {
            setName(acc.name);
            setLink(acc.link || '');
            setNotes(acc.notes || '');
            setLocation({
                address: acc.address || '',
                lat: acc.lat || 0,
                lng: acc.lng || 0
            });
            // Popolamento stati date separati
            setStartDate(acc.start_date ? new Date(acc.start_date) : undefined);
            setEndDate(acc.end_date ? new Date(acc.end_date) : undefined);

            if (acc.destination) {
                setAccommodationDestination({ id: acc.destination, name: acc.destination });
            }
        }
    }, [accommodations, accommodationId]);

    useEffect(() => { if (!isNew) populateForm(); }, [populateForm, isNew]);

    const handleCancel = () => {
        if (isNew) router.back();
        else { populateForm(); setIsReadOnly(true); setError(null); }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validazione
        if (!name || !startDate || !endDate || !location || !accommodationDestination) {
            setError("Tutti i campi obbligatori devono essere compilati.");
            return;
        }

        if (startDate > endDate) {
            setError("La data di check-in non può essere successiva al check-out.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const accommodationData = {
            trip_id: tripId,
            name,
            destination: accommodationDestination.name,
            address: location.address,
            lat: location.lat,
            lng: location.lng,
            start_date: formatDateForPostgres(startDate),
            end_date: formatDateForPostgres(endDate),
            link,
            notes,
        };

        try {
            const query = isNew
                ? supabase.from('accommodations').insert([accommodationData])
                : supabase.from('accommodations').update(accommodationData).eq('id', accommodationId);

            const { error: apiError } = await query;
            if (apiError) { throw apiError; }

            await refreshData();

            if (isNew) router.push(appRoutes.accommodations(tripId));
            else setIsReadOnly(true);

        } catch (err: any) {
            console.error("Errore salvataggio:", err);
            setError(err.message || "Errore durante il salvataggio.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const destinationOptions = trip?.destinations?.map(d => ({ id: d, name: d })) || [];

    return (
        <div className="space-y-8 pb-24">
            <PageTitle
                title={isNew ? 'Aggiungi un Alloggio' : isReadOnly ? 'Dettagli Alloggio' : 'Modifica Alloggio'}
                subtitle={isNew ? "Pianifica dove riposerai." : "Gestisci le informazioni del tuo soggiorno."}
            >
                {!isNew && isOwner && (
                    <ContextMenu items={[
                        {
                            label: isReadOnly ? 'Modifica' : 'Annulla',
                            icon: isReadOnly ? <FaPen /> : <FaUndo />,
                            onClick: () => isReadOnly ? setIsReadOnly(false) : handleCancel()
                        },
                        {
                            label: 'Indicazioni',
                            icon: <FaMap />,
                            onClick: () => window.open(mapNavigationUrl(location?.address || ''), '_blank')
                        }
                    ]} />
                )}
            </PageTitle>

            <form onSubmit={handleSubmit} className="space-y-4">
                <FormSection title='Informazioni Base'>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            id='accommodation-name'
                            label="Nome dell'alloggio"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            readOnly={isReadOnly}
                        />
                        <Dropdown
                            label="Destinazione"
                            items={destinationOptions}
                            selected={accommodationDestination}
                            onSelect={setAccommodationDestination}
                            optionValue='id'
                            optionLabel="name"
                            required
                            readOnly={isReadOnly}
                        />
                    </div>
                </FormSection>

                <FormSection title='Posizione e Prenotazione'>
                    <div className="space-y-6">
                        <SearchLocation
                            value={location}
                            onSelect={setLocation}
                            label="Indirizzo"
                            readOnly={isReadOnly}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <LinkPreview
                                    label="Link prenotazione"
                                    value={link}
                                    onChange={setLink}
                                    readOnly={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>
                </FormSection>

                <FormSection title='Dettagli Soggiorno'>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Dropdown
                            label="Check-in"
                            items={dateOptions}
                            selected={selectedStartDateOption}
                            onSelect={(val) => setStartDate(val?.date)}
                            optionLabel="name"
                            optionValue='id'
                            readOnly={isReadOnly}
                            required
                        />
                        <Dropdown
                            label="Check-out"
                            items={dateOptions}
                            selected={selectedEndDateOption}
                            onSelect={(val) => setEndDate(val?.date)}
                            optionLabel="name"
                            optionValue='id'
                            readOnly={isReadOnly}
                            required
                        />
                    </div>
                </FormSection>

                <FormSection title='Contenuti Aggiuntivi'>
                    <RichTextInput
                        value={notes}
                        onChange={setNotes}
                        readOnly={isReadOnly}
                    />
                </FormSection>

                {error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700 text-center text-sm font-semibold">
                        {error}
                    </div>
                )}

                {!isReadOnly && (
                    <ActionStickyBar
                        handleCancel={handleCancel}
                        isSubmitting={isSubmitting}
                        isNew={isNew}
                    />
                )}
            </form>
        </div>
    );
}