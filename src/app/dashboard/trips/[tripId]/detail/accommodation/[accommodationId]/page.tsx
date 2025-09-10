'use client';

import Button from '@/components/button';
import DateRangePicker from '@/components/date-range-picker';
import Dropdown from '@/components/dropdown';
import Input from '@/components/input';
import Loader from '@/components/loader';
import Navbar from '@/components/navbar';
import PageTitle from '@/components/page-title';
import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
import { Accommodation } from '@/models/AccomModation';
import { PathItem } from '@/models/PathItem';
import { Trip } from '@/models/Trip';
import { doc, getDoc, Timestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, FormEvent } from 'react';
import { DateRange } from 'react-day-picker';
import { FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';


const MapPicker = dynamic(() => import('@/components/map'), { ssr: false });

export default function AccommodationFormPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId as string;
    const accommodationId = params.accommodationId as string;
    const isEditMode = accommodationId !== 'new';

    const [trip, setTrip] = useState<Trip | null>(null);
    const [name, setName] = useState('');
    const [link, setLink] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [destination, setDestination] = useState<{ id: string; name: string } | null>(null); // Stato per la destinazione selezionata

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    useEffect(() => {
        if (user && tripId) {
            fetchData();
        }
    }, [user, tripId, isEditMode, accommodationId]);

    const fetchData = async () => {
        setIsLoadingData(true);
        try {
            const tripDocRef = doc(db, 'trips', tripId);
            const tripDoc = await getDoc(tripDocRef);

            if (tripDoc.exists()) {
                const tripData = tripDoc.data() as Trip;
                setTrip(tripData);

                if (isEditMode) {
                    const accommodationToEdit = tripData.accommodations?.find(acc => acc.id === accommodationId);
                    if (accommodationToEdit) {
                        setName(accommodationToEdit.name);
                        setLink(accommodationToEdit.link || '');
                        setLocation(accommodationToEdit.location);
                        console.log(accommodationToEdit.destination);

                        const destination = {
                            id: accommodationToEdit?.destination ?? '',
                            name: accommodationToEdit?.destination ?? ''
                        }
                        setDestination(destination);
                        setDateRange({
                            from: (accommodationToEdit.startDate as Timestamp).toDate(),
                            to: (accommodationToEdit.endDate as Timestamp).toDate(),
                        });
                    } else {
                        setError("Alloggio non trovato.");
                    }
                }
            } else {
                setError("Viaggio non trovato.");
            }
        } catch (error) {
            console.error("Errore nel recupero dei dati:", error);
            setError("Si è verificato un errore nel caricamento dei dati.");
        } finally {
            setIsLoadingData(false);
        }
    };


    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !trip || !name || !dateRange?.from || !dateRange.to || !location) {
            setError("Tutti i campi, inclusa la selezione dalla mappa, sono obbligatori.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const tripDocRef = doc(db, 'trips', tripId);

        try {
            if (isEditMode) {
                const updatedAccommodations = trip.accommodations?.map(acc =>
                    acc.id === accommodationId
                        ? {
                            ...acc,
                            name,
                            location,
                            link,
                            startDate: Timestamp.fromDate(dateRange.from!),
                            endDate: Timestamp.fromDate(dateRange.to!),
                            destination: destination?.name
                        }
                        : acc
                ) || [];
                await updateDoc(tripDocRef, { accommodations: updatedAccommodations });
            } else {
                const newAccommodation: Accommodation = {
                    id: uuidv4(),
                    name,
                    location,
                    destination: destination?.name ?? '',
                    link,
                    startDate: Timestamp.fromDate(dateRange.from),
                    endDate: Timestamp.fromDate(dateRange.to),
                };
                await updateDoc(tripDocRef, { accommodations: arrayUnion(newAccommodation) });
            }
            router.push(`/dashboard/trips/${tripId}/detail`);
        } catch (err) {
            console.error("Errore nel salvataggio dell'alloggio:", err);
            setError("Impossibile salvare l'alloggio. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const breadcrumbPaths: PathItem[] = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: trip?.name || 'Viaggio', href: `/dashboard/trips/${tripId}/detail` },
        { label: isEditMode ? 'Modifica Alloggio' : 'Aggiungi Alloggio', href: '#' }
    ];

    if (loading || isLoadingData) {
        return <Loader />;
    }

    const destinationOptions = trip?.destinations?.map(d => ({ id: d, name: d })) || [];


    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar backPath={`/dashboard/trips/${tripId}/detail`} breadcrumb={breadcrumbPaths} />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
                    <PageTitle
                        title={isEditMode ? 'Modifica Alloggio' : 'Aggiungi un Alloggio'}
                        subtitle="Inserisci i dettagli del luogo in cui pernotterai."
                    />
                    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">1. Dove si trova?</h3>
                            <MapPicker value={location} onLocationSelect={setLocation} />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">2. Dettagli</h3>
                            <div className="space-y-6">
                                <Input id="acc-name" label="Nome dell'alloggio (es. Hotel Bellavista)" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                                <Dropdown
                                    label="A quale destinazione appartiene questa tappa?"
                                    items={destinationOptions}
                                    selected={destination}
                                    onSelect={setDestination}
                                    optionValue="id"
                                    optionLabel="name"
                                    placeholder="Seleziona una destinazione"
                                />


                                <Input id="acc-link" label="Link di prenotazione (opzionale)" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Periodo del soggiorno
                                    </label>
                                    <DateRangePicker
                                        value={dateRange}
                                        onChange={setDateRange}
                                    // dis={trip ? {
                                    //     before: (trip.startDate as Timestamp).toDate(),
                                    //     after: (trip.endDate as Timestamp).toDate()
                                    // } : undefined}
                                    />
                                </div>

                                {location && (
                                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">Luogo Selezionato:</p>
                                            <p className="text-gray-600 dark:text-gray-400">{location.address}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setLocation(null)}
                                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                                            aria-label="Rimuovi luogo"
                                        >
                                            <FaTrash className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <div className="flex justify-end gap-4 pt-4">
                            <Button className='w-auto' variant="secondary" type="button" onClick={() => router.back()}>Annulla</Button>
                            <Button className='w-auto' type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvataggio...' : 'Salva'}</Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
