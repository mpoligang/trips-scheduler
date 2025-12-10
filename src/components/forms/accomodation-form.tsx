'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { FaPen, FaMap, FaUndo } from 'react-icons/fa';

import { db } from '@/firebase/config';
import { Trip } from '@/models/Trip';
import { Accommodation } from '@/models/AccomModation';

import ContextMenu from '@/components/actions/context-menu';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import PageTitle from '../generics/page-title';
import CurrencyInput from '../inputs/currency-input';
import DateRangePicker from '../inputs/date-range-picker';
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
            setName('');
            setLink('');
            setCost('');
            setLocation(null);
            setAccommodationDestination(null);
            setDateRange(undefined);
        }
    }, [trip.accommodations, accommodationId]);

    useEffect(() => {
        populateForm();
    }, [populateForm]);

    const handleCancel = () => {
        if (isNew) {
            router.back();
        } else {
            populateForm();
            setIsReadOnly(true);
            setError(null);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!trip || !name || !dateRange?.from || !dateRange.to || !location || !accommodationDestination) {
            setError("Tutti i campi obbligatori devono essere compilati.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);

        const accommodationData = {
            name,
            location,
            link,
            cost: cost ? Number.parseFloat(cost) : 0,
            startDate: Timestamp.fromDate(dateRange.from),
            endDate: Timestamp.fromDate(dateRange.to),
            destination: accommodationDestination.name
        };

        try {
            if (!isNew && accommodationData) {
                const updatedAccommodations = trip.accommodations?.map(acc =>
                    acc.id === accommodationId
                        ? { ...acc, ...accommodationData }
                        : acc
                ) || [];
                await updateDoc(tripDocRef, { accommodations: updatedAccommodations });
                setIsReadOnly(true);
            } else {
                const newAccommodation: Accommodation = {
                    id: uuidv4(),
                    ...accommodationData
                };
                await updateDoc(tripDocRef, { accommodations: arrayUnion(newAccommodation) });
                router.push(appRoutes.tripDetails(tripId));
            }

        } catch (err) {
            console.error("Errore nel salvataggio dell'alloggio:", err);
            setError("Impossibile salvare l'alloggio. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const destinationOptions = trip?.destinations?.map(d => ({ id: d, name: d })) || [];

    const submitButtonLabel = isSubmitting ? 'Salvataggio...' : (isNew ? 'Aggiungi Alloggio' : 'Salva Modifiche');

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
            onClick: () => {
                if (isReadOnly) {
                    setIsReadOnly(false);
                } else {
                    handleCancel();
                }
            }
        });
    }

    return (
        <div className="space-y-6">
            {/* Intestazione con Titolo e Context Menu inclusa nel form */}
            <PageTitle
                title={isNew ? 'Aggiungi un Alloggio' : (name || 'Dettaglio Alloggio')}
                subtitle={isNew ? "Inserisci i dettagli del luogo in cui pernotterai." : "Visualizza o modifica i dettagli del tuo soggiorno."}
            >
                {!isNew && (
                    <ContextMenu items={menuItems} />
                )}
            </PageTitle>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
                <div className="space-y-6">
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
                        label="Destinazione"
                        items={destinationOptions}
                        selected={accommodationDestination}
                        onSelect={setAccommodationDestination}
                        optionValue="id"
                        optionLabel="name"
                        required
                        placeholder="Seleziona una destinazione"
                        readOnly={isReadOnly}
                    />

                    <div>
                        <SearchLocation
                            value={location}
                            onSelect={isReadOnly ? () => { } : setLocation}
                            placeholder="Digita indirizzo, città o nome hotel..."
                            label="Indirizzo dell'alloggio"
                            readOnly={isReadOnly}
                        />
                    </div>

                    <LinkPreview
                        label="Link di prenotazione"
                        value={link}
                        onChange={setLink}
                        readOnly={isReadOnly}
                        placeholder="Incolla qui il link di Booking, Airbnb, ecc..."
                    />

                    <div>

                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            readOnly={isReadOnly}
                            required

                        />
                    </div>
                    <div className="w-full">
                        <CurrencyInput
                            id="acc-cost"
                            label="Costo Totale"
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            symbol="€"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            readOnly={isReadOnly}
                        />
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                {!isReadOnly && (
                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            className='w-auto'
                            variant="secondary"
                            type="button"
                            onClick={handleCancel}
                        >
                            Annulla
                        </Button>
                        <Button className='w-auto' type="submit" disabled={isSubmitting}>
                            {submitButtonLabel}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}