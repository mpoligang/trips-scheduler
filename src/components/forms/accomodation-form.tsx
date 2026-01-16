'use client';

import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { FaPen, FaMap, FaUndo, FaHotel, FaMapMarkerAlt, FaCalendarAlt, FaCheck } from 'react-icons/fa';

import { db } from '@/firebase/config';
import { Trip } from '@/models/Trip';
import { Accommodation } from '@/models/AccomModation';

import ContextMenu from '@/components/actions/context-menu';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import PageTitle from '../generics/page-title';
import CurrencyInput from '../inputs/currency-input';
import LinkPreview from '../inputs/link-preview';
import SearchLocation from '../inputs/search-location';
import { DateRange } from 'react-day-picker';
import Dropdown from '../inputs/dropdown';
import Input from '../inputs/input';
import Button from '../actions/button';
import { EntityKeys } from '@/utils/entityKeys';

interface AccommodationFormProps {
    trip: Trip;
    tripId: string;
    accommodationId: string;
    isOwner: boolean;
    isNew: boolean;
}

export default function AccommodationForm({
    trip,
    tripId,
    accommodationId,
    isNew,
    isOwner
}: Readonly<AccommodationFormProps>) {
    const router = useRouter();

    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [name, setName] = useState('');
    const [link, setLink] = useState('');
    const [cost, setCost] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [accommodationDestination, setAccommodationDestination] = useState<{ id: string; name: string } | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dateOptions = useMemo(() => {
        if (!trip?.startDate || !trip?.endDate) return [];
        const dates = [];
        const start = trip.startDate.toDate();
        const end = trip.endDate.toDate();
        const current = new Date(start);
        current.setHours(0, 0, 0, 0);
        const finalEnd = new Date(end);
        finalEnd.setHours(0, 0, 0, 0);

        while (current <= finalEnd) {
            const dateObj = new Date(current);
            const id = dateObj.toISOString().split('T')[0];
            dates.push({
                id: id,
                name: dateObj.toLocaleDateString('it-IT', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }),
                date: dateObj
            });
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, [trip?.startDate, trip?.endDate]);

    const selectedStartDateOption = useMemo(() => {
        if (!dateRange?.from) return null;
        const iso = dateRange.from.toISOString().split('T')[0];
        return dateOptions.find(opt => opt.id === iso) || null;
    }, [dateRange?.from, dateOptions]);

    const selectedEndDateOption = useMemo(() => {
        if (!dateRange?.to) return null;
        const iso = dateRange.to.toISOString().split('T')[0];
        return dateOptions.find(opt => opt.id === iso) || null;
    }, [dateRange?.to, dateOptions]);

    const handleStartDateSelect = (val: { id: string; name: string; date: Date } | null) => {
        const newDate = val?.date;
        setDateRange(prev => ({
            from: newDate,
            to: prev?.to && newDate && newDate > prev.to ? undefined : prev?.to
        }));
        setError(null);
    };

    const handleEndDateSelect = (val: { id: string; name: string; date: Date } | null) => {
        const newDate = val?.date;
        setDateRange(prev => ({
            from: prev?.from && newDate && newDate < prev.from ? undefined : prev?.from,
            to: newDate
        }));
    };

    const populateForm = useCallback(() => {
        const accommodation = trip.accommodations?.find(acc => acc.id === accommodationId);
        if (accommodation) {
            setName(accommodation.name);
            setLink(accommodation.link || '');
            setLocation(accommodation.location);
            setCost(accommodation.cost ? accommodation.cost.toString() : '');
            setDateRange({
                from: (accommodation.startDate).toDate(),
                to: (accommodation.endDate).toDate(),
            });
            if (accommodation.destination) {
                setAccommodationDestination({ id: accommodation.destination, name: accommodation.destination });
            }
        } else {
            setName(''); setLink(''); setCost(''); setLocation(null); setAccommodationDestination(null); setDateRange(undefined);
        }
    }, [trip.accommodations, accommodationId]);

    useEffect(() => { populateForm(); }, [populateForm]);

    const handleCancel = () => {
        if (isNew) { router.back(); }
        else { populateForm(); setIsReadOnly(true); setError(null); }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (dateRange?.from && dateRange?.to && dateRange.from > dateRange.to) {
            setError("La data di check-in deve essere precedente alla data di check-out.");
            return;
        }
        if (!trip || !name || !dateRange?.from || !dateRange.to || !location || !accommodationDestination) {
            setError("Tutti i campi obbligatori devono essere compilati.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
        const accommodationData = {
            name, location, link, cost: cost ? Number.parseFloat(cost) : 0,
            startDate: Timestamp.fromDate(dateRange.from),
            endDate: Timestamp.fromDate(dateRange.to),
            destination: accommodationDestination.name
        };
        try {
            if (!isNew) {
                const updatedAccommodations = trip.accommodations?.map(acc =>
                    acc.id === accommodationId ? { ...acc, ...accommodationData } : acc
                ) || [];
                await updateDoc(tripDocRef, { accommodations: updatedAccommodations });
                setIsReadOnly(true);
            } else {
                const newAccommodation: Accommodation = { id: uuidv4(), ...accommodationData };
                await updateDoc(tripDocRef, { accommodations: arrayUnion(newAccommodation) });
                router.push(appRoutes.tripDetails(tripId));
            }
        } catch (err) {
            console.error("Errore nel salvataggio:", err);
            setError("Impossibile salvare i dati. Riprova.");
        } finally { setIsSubmitting(false); }
    };

    const destinationOptions = trip?.destinations?.map(d => ({ id: d, name: d })) || [];
    const submitButtonLabel = isSubmitting ? 'Salvataggio...' : (isNew ? 'Aggiungi' : 'Salva');

    const menuItems = [
        {
            label: 'Indicazioni',
            icon: <FaMap />,
            onClick: () => { if (location?.address) window.open(mapNavigationUrl(location.address), '_blank'); }
        }
    ];

    if (isOwner) {
        menuItems.unshift({
            label: isReadOnly ? 'Modifica' : 'Annulla',
            icon: isReadOnly ? <FaPen /> : <FaUndo />,
            onClick: () => { if (isReadOnly) setIsReadOnly(false); else handleCancel(); }
        });
    }

    return (
        <div className="space-y-8 max-w-4xl pb-12">
            <PageTitle
                title={isNew ? 'Aggiungi un Alloggio' : ''}
                subtitle={isNew ? "Pianifica dove riposerai durante il tuo viaggio." : "Visualizza o aggiorna le informazioni del tuo soggiorno."}
            >
                {!isNew && <ContextMenu items={menuItems} />}
            </PageTitle>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* SEZIONE 1: IDENTITÀ ALLOGGIO */}
                <section className="bg-white dark:bg-gray-800 sm:p-6 rounded-xl  sm:border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Informazioni Base</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            id="acc-name"
                            label="Nome dell'alloggio"
                            placeholder="es. Hotel Bellavista"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            readOnly={isReadOnly}
                        />
                        <Dropdown<{ id: string; name: string }>
                            label="Destinazione del Viaggio"
                            items={destinationOptions}
                            selected={accommodationDestination}
                            onSelect={setAccommodationDestination}
                            optionValue="id"
                            optionLabel="name"
                            required
                            placeholder="Seleziona destinazione"
                            readOnly={isReadOnly}
                        />
                    </div>
                </section>

                {/* SEZIONE 2: LOCATION E PRENOTAZIONE */}
                <section className="bg-white dark:bg-gray-800 sm:p-6 rounded-xl  sm:border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">

                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Posizione e Prenotazione</h3>
                    </div>
                    <div className="space-y-6">
                        <SearchLocation
                            value={location}
                            onSelect={isReadOnly ? () => { } : setLocation}
                            placeholder="Cerca indirizzo o nome hotel..."
                            label="Indirizzo esatto"
                            readOnly={isReadOnly}
                        />
                        <LinkPreview
                            label="Link di prenotazione (Booking, Airbnb, ecc)"
                            value={link}
                            onChange={setLink}
                            readOnly={isReadOnly}
                            placeholder="Incolla qui l'URL..."
                        />
                    </div>
                </section>

                {/* SEZIONE 3: DETTAGLI LOGISTICI */}
                <section className="bg-white dark:bg-gray-800 sm:p-6 rounded-xl  sm:border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">

                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Dettagli Soggiorno</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 items-end">
                        <Dropdown<{ id: string; name: string; date: Date }>
                            label="Data Check-in"
                            items={dateOptions}
                            selected={selectedStartDateOption}
                            onSelect={handleStartDateSelect}
                            optionValue="id"
                            optionLabel="name"
                            placeholder="Seleziona arrivo"
                            readOnly={isReadOnly}
                            required
                        />
                        <Dropdown<{ id: string; name: string; date: Date }>
                            label="Data Check-out"
                            items={dateOptions}
                            selected={selectedEndDateOption}
                            onSelect={handleEndDateSelect}
                            optionValue="id"
                            optionLabel="name"
                            placeholder="Seleziona partenza"
                            readOnly={isReadOnly}
                            required
                        />

                    </div>
                </section>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
                        <p className="text-sm font-semibold mx-auto">{error}</p>
                    </div>
                )}

                {!isReadOnly && (
                    <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <Button
                            className="w-full sm:w-auto px-8"
                            variant="secondary"
                            type="button"
                            onClick={handleCancel}
                        >
                            Annulla
                        </Button>
                        <Button className="w-full sm:w-auto px-10 shadow-lg shadow-purple-500/20" type="submit" disabled={isSubmitting}>
                            <div className="flex items-center gap-2">
                                {!isSubmitting && <FaCheck size={12} />}
                                <span>{isSubmitting ? 'Salvataggio...' : (isNew ? 'Aggiungi' : 'Salva')}</span>
                            </div>
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}