'use client';

import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaPen, FaMap, FaUndo } from 'react-icons/fa';
import toast from 'react-hot-toast'; // Installalo se non lo hai: npm install react-hot-toast

import { useTrip } from '@/context/tripContext';

import { appRoutes } from '@/utils/appRoutes';
import { extractTimeFromDate, formatDateForPostgres, generateDateOptions, parseDateOnly, selectDateOption } from '@/utils/dateTripUtils';
import { Location } from '@/models/Location';

import ContextMenu from '@/components/actions/context-menu';
import PageTitle from '../generics/page-title';
import LinkPreview from '../inputs/link-preview';
import SearchLocation from '../inputs/search-location';
import Dropdown from '../inputs/dropdown';
import Input from '../inputs/input';
import TimeInput from '../inputs/time-input';
import ActionStickyBar from '../actions/action-sticky-bar';
import FormSection from '../generics/form-section';
import RichTextInput from '../inputs/rich-text-editor';
import { hasRealContent } from '@/utils/fileSizeUtils';
import { AttachmentList } from '../cards/attachment-manager';
import { upsertAccommodationAction } from '@/actions/accomodation-actions';
import { openLatLngLink } from '@/utils/open-link.utils';

export default function AccommodationForm() {
    const router = useRouter();
    const params = useParams();

    const { trip, accommodations, refreshData, isOwner } = useTrip();

    const tripId = params.tripId as string;
    const accommodationId = params.id as string;
    const isNew = accommodationId === 'new';
    const attachments = accommodations?.find(a => a.id === accommodationId)?.attachments || [];

    // Stati del Form
    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Errore rimosso, usiamo toast

    const [name, setName] = useState('');
    const [link, setLink] = useState('');
    const [location, setLocation] = useState<Location | null>(null);
    const [accommodationDestination, setAccommodationDestination] = useState<{ id: string; name: string } | null>(null);
    const [notes, setNotes] = useState<string>('');
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [checkInTime, setCheckInTime] = useState<string>('');
    const [checkOutTime, setCheckOutTime] = useState<string>('');

    const dateOptions = useMemo(() => {
        if (!trip?.start_date || !trip?.end_date) return [];
        return generateDateOptions(new Date(trip.start_date), new Date(trip.end_date));
    }, [trip?.start_date, trip?.end_date]);

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
            setLocation({ address: acc.address || '', lat: acc.lat || 0, lng: acc.lng || 0 });
            setStartDate(parseDateOnly(acc.start_date));
            setEndDate(parseDateOnly(acc.end_date));
            setCheckInTime(extractTimeFromDate(acc.start_date));
            setCheckOutTime(extractTimeFromDate(acc.end_date));
            if (acc.destination) setAccommodationDestination({ id: acc.destination, name: acc.destination });
        }
    }, [accommodations, accommodationId]);

    useEffect(() => { if (!isNew) populateForm(); }, [populateForm, isNew]);

    useEffect(() => {
        if (!accommodationDestination && trip?.destinations?.length === 1) {
            const only = trip.destinations[0];
            setAccommodationDestination({ id: only, name: only });
        }
    }, [trip?.destinations, accommodationDestination]);

    const handleCancel = () => {
        if (isNew) router.back();
        else { populateForm(); setIsReadOnly(true); }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validazione preventiva
        if (!name || !startDate || !endDate || !location || !accommodationDestination) {
            toast.error("Tutti i campi obbligatori devono essere compilati.");
            return;
        }

        if (startDate > endDate) {
            toast.error("La data di check-in non può essere successiva al check-out.");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading(isNew ? "Creando alloggio..." : "Aggiornando alloggio...");

        try {
            const result = await upsertAccommodationAction({
                id: isNew ? undefined : accommodationId,
                trip_id: tripId,
                name,
                destination: accommodationDestination.name,
                address: location.address,
                lat: location.lat,
                lng: location.lng,
                start_date: formatDateForPostgres(startDate, checkInTime),
                end_date: formatDateForPostgres(endDate, checkOutTime),
                link,
                notes,
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            toast.success(isNew ? "Alloggio creato!" : "Alloggio aggiornato!", { id: toastId });

            await refreshData(true);

            setIsReadOnly(true);
            if (isNew && result.id) {
                router.replace(appRoutes.accommodationDetails(tripId, result.id));
            }

        } catch (err: any) {
            toast.error(err.message || "Qualcosa è andato storto", { id: toastId });
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
                            onClick: () => {
                                if (location?.lat && location?.lng) {
                                    openLatLngLink(location.lat, location.lng);
                                }
                            }
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
                            required
                        />
                        <LinkPreview
                            label="Link prenotazione"
                            value={link}
                            onChange={setLink}
                            readOnly={isReadOnly}
                        />
                    </div>
                </FormSection>

                <FormSection title='Dettagli Soggiorno'>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="grid grid-cols-[1fr_7rem] gap-3 items-start">
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
                            {(!isReadOnly || checkInTime) && (
                                <TimeInput
                                    id="checkin-time"
                                    label="Ora"
                                    value={checkInTime}
                                    onChange={setCheckInTime}
                                    readOnly={isReadOnly}
                                />
                            )}
                        </div>
                        <div className="grid grid-cols-[1fr_7rem] gap-3 items-start">
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
                            {(!isReadOnly || checkOutTime) && (
                                <TimeInput
                                    id="checkout-time"
                                    label="Ora"
                                    value={checkOutTime}
                                    onChange={setCheckOutTime}
                                    readOnly={isReadOnly}
                                />
                            )}
                        </div>
                    </div>
                </FormSection>


                {(!isReadOnly || hasRealContent(notes)) && (
                    <FormSection title='Contenuti Aggiuntivi'>
                        <RichTextInput value={notes} onChange={setNotes} readOnly={isReadOnly} />
                    </FormSection>
                )}

                {isReadOnly && attachments.length > 0 && (
                    <FormSection title="Allegati">
                        <AttachmentList attachments={attachments} isReadOnly={true} />
                    </FormSection>
                )}


                {!isReadOnly && (
                    <ActionStickyBar
                        handleCancel={handleCancel}
                        isSubmitting={isSubmitting}
                    />
                )}
            </form>
        </div>
    );
}