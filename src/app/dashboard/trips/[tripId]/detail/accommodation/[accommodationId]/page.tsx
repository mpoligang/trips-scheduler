'use client';

import Button from '@/components/button';
import DateRangePicker from '@/components/date-range-picker';
import Input from '@/components/input';
import Loader from '@/components/loader';
import Navbar from '@/components/navbar';
import PageTitle from '@/components/page-title';
import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
import { PathItem } from '@/models/PathItem';
import { Trip } from '@/models/Trip';
import { doc, getDoc, Timestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, FormEvent } from 'react';
import { DateRange } from 'react-day-picker';
import { v4 as uuidv4 } from 'uuid';
import SearchLocation from '@/components/search-location';
import LinkPreview from '@/components/link-preview';
import CurrencyInput from '@/components/currency-input';
import PageContainer from '@/components/page-container';
import { FaMap, FaPen, FaRobot, FaUndo } from 'react-icons/fa';
import Dropdown from '@/components/dropdown';
import { Accommodation } from '@/models/AccomModation';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import Tabs, { TabItem } from '@/components/tabs'; // Import del componente Tabs
import ContextMenu from '@/components/context-menu';

export default function AccommodationFormPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId as string;
    const accommodationId = params.accommodationId as string;
    const isNew = accommodationId === 'new';
    const [isReadOnly, setIsReadOnly] = useState(!isNew);

    const [trip, setTrip] = useState<Trip | null>(null);
    const [cloneTrip, setCloneTrip] = useState<Trip | null>(null);

    const [name, setName] = useState('');
    const [link, setLink] = useState('');
    const [cost, setCost] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [accommodationDestination, setAccommodationDestination] = useState<{ id: string; name: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const handleAccommodationEdit = (accommodationToEdit: Accommodation) => {
            setName(accommodationToEdit.name);
            setLink(accommodationToEdit.link || '');
            setLocation(accommodationToEdit.location);
            setCost(accommodationToEdit.cost ? accommodationToEdit.cost.toString() : '');
            setDateRange({
                from: (accommodationToEdit.startDate as Timestamp).toDate(),
                to: (accommodationToEdit.endDate as Timestamp).toDate(),
            });
            if (accommodationToEdit.destination) {
                setAccommodationDestination({ id: accommodationToEdit.destination, name: accommodationToEdit.destination });
            }
        };

        const handleTripData = (tripData: Trip) => {
            setTrip(tripData);
            if (!isNew) {
                const accommodationToEdit = tripData.accommodations?.find(acc => acc.id === accommodationId);
                if (accommodationToEdit) {
                    handleAccommodationEdit(accommodationToEdit);
                } else {
                    setError("Alloggio non trovato.");
                }
            }
        };

        const fetchData = async () => {
            if (!user || !tripId) {
                setIsLoadingData(false);
                return;
            }
            try {
                const tripDocRef = doc(db, 'trips', tripId);
                const tripDoc = await getDoc(tripDocRef);

                if (!tripDoc.exists()) {
                    setError("Viaggio non trovato.");
                    return;
                }

                const tripData = tripDoc.data() as Trip;
                handleTripData(tripData);
            } catch (error) {
                console.error("Errore nel recupero dei dati:", error);
                setError("Si è verificato un errore nel caricamento dei dati.");
            } finally {
                setIsLoadingData(false);
            }
        };

        if (user && tripId) {
            fetchData();
        }
    }, [user, tripId, isNew, accommodationId]);


    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !trip || !name || !dateRange?.from || !dateRange.to || !location || !accommodationDestination) {
            setError("Tutti i campi obbligatori devono essere compilati.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const tripDocRef = doc(db, 'trips', tripId);

        const accommodationData = {
            name,
            location,
            link,
            cost: cost ? Number.parseFloat(cost) : 0,
            startDate: Timestamp.fromDate(dateRange.from!),
            endDate: Timestamp.fromDate(dateRange.to!),
            destination: accommodationDestination.name
        };

        try {
            if (isNew) {
                const newAccommodation: Accommodation = {
                    id: uuidv4(),
                    ...accommodationData
                };
                await updateDoc(tripDocRef, { accommodations: arrayUnion(newAccommodation) });
            } else {
                const updatedAccommodations = trip.accommodations?.map(item =>
                    item.id === accommodationId
                        ? { ...item, ...accommodationData }
                        : item
                ) || [];
                await updateDoc(tripDocRef, { accommodations: updatedAccommodations });
            }
        } catch (err) {
            console.error("Errore nel salvataggio dell'alloggio:", err);
            setError("Impossibile salvare l'alloggio. Riprova.");
        } finally {
            setIsSubmitting(false);
            setIsReadOnly(true);
        }
    };

    const breadcrumbPaths: PathItem[] = [
        { label: 'Dashboard', href: appRoutes.home },
        { label: trip?.name || 'Viaggio', href: appRoutes.tripDetails(tripId) },
        { label: isNew ? 'Aggiungi Alloggio' : name, href: '#' }
    ];

    if (loading || isLoadingData) {
        return <Loader />;
    }

    const destinationOptions = trip?.destinations?.map(d => ({ id: d, name: d })) || [];

    let submitButtonLabel = '';
    if (isSubmitting) {
        submitButtonLabel = 'Salvataggio...';
    } else if (isNew) {
        submitButtonLabel = 'Aggiungi Alloggio';
    } else {
        submitButtonLabel = 'Salva Modifiche';
    }

    // Definizione dei Tabs
    const tabs: TabItem[] = [
        {
            label: 'Dettaglio Alloggio',
            content: (
                <>
                    <PageTitle
                        title={isNew ? 'Aggiungi un Alloggio' : name}
                        subtitle={isNew ? "Inserisci i dettagli del luogo in cui pernotterai." : "Visualizza o modifica i dettagli del tuo soggiorno."}
                    >
                        {
                            !isNew && (
                                <ContextMenu items={[
                                    {
                                        label: isReadOnly ? 'Modifica' : 'Annulla',
                                        icon: isReadOnly ? <FaPen /> : <FaUndo />,
                                        onClick: () => setIsReadOnly(!isReadOnly)
                                    },
                                    {
                                        label: 'Indicazioni',
                                        icon: <FaMap />,
                                        onClick: () => { window.open(mapNavigationUrl(location?.address || ''), '_blank'); }
                                    }
                                ]} />
                            )
                        }


                    </PageTitle>
                    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                        <div>
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
                                    // Nota: Se SearchLocation non ha una prop 'readOnly', l'interazione è disabilitata tramite onSelect vuoto, 
                                    // ma idealmente dovrebbe supportare una prop visuale 'readOnly' se implementata.
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
                                    <label htmlFor='acc-date-range' className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Periodo del soggiorno
                                    </label>
                                    <DateRangePicker
                                        value={dateRange}
                                        onChange={setDateRange}
                                        readOnly={isReadOnly}
                                        className={isReadOnly ? "pointer-events-none opacity-80" : ""}
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
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        {!isReadOnly && (
                            <div className="flex justify-end gap-4 pt-4">
                                <Button
                                    className='w-auto'
                                    variant="secondary"
                                    type="button"
                                    onClick={() => {
                                        if (isNew) {
                                            router.back();
                                        } else {
                                            setIsReadOnly(true);
                                        }
                                    }}
                                >
                                    Annulla
                                </Button>
                                <Button className='w-auto' type="submit" disabled={isSubmitting}>
                                    {submitButtonLabel}
                                </Button>
                            </div>
                        )}
                    </form>
                </>
            )
        },
        {
            label: 'Informazioni AI',
            content: (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 mt-6">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full mb-4">
                        <FaRobot className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                        Funzionalità in Sviluppo
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                        Stiamo lavorando per integrare l&apos;intelligenza artificiale che ti aiuterà a scoprire dettagli e consigli su questo alloggio.
                    </p>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar backPath={appRoutes.tripDetails(tripId)} breadcrumb={breadcrumbPaths} />
            <PageContainer>


                <Tabs tabs={tabs} />

            </PageContainer>
        </div>
    );
}