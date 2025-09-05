'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { PathItem } from '@/models/PathItem';
import { DateRange } from 'react-day-picker';
import { Trip } from '@/models/Trip';
import DateRangePicker from '@/components/date-range-picker';
import Navbar from '@/components/navbar';
import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
import Button from '@/components/button';
import Input from '@/components/input';
import PageTitle from '@/components/page-title';
import Textarea from '@/components/textarea';
import Loader from '@/components/loader';


export default function TripFormPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId as string;

    const isEditMode = tripId !== 'new';

    const [name, setName] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(isEditMode); // Carica solo in modalità modifica

    // Breadcrumb dinamico
    const breadcrumbPaths: PathItem[] = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: isEditMode ? 'Modifica Viaggio' : 'Aggiungi Viaggio', href: `/dashboard/trip/${tripId}` }
    ];

    // Effetto per caricare i dati del viaggio in modalità modifica
    useEffect(() => {
        if (isEditMode && user) {
            getData();
        }
    }, [isEditMode, tripId, user]);

    const getData = async () => {
        const tripDocRef = doc(db, 'trips', tripId);
        const tripDoc = await getDoc(tripDocRef);
        if (tripDoc.exists()) {
            const data = tripDoc.data() as Trip;
            setName(data.name);
            setDateRange({
                from: (data.startDate as any).toDate(),
                to: (data.endDate as any).toDate(),
            });
        } else {
            setError("Viaggio non trovato.");
        }
        setIsLoadingData(false);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !dateRange?.from || !dateRange.to) {
            setError("Tutti i campi sono obbligatori.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const tripData: Trip = {
            name,
            startDate: Timestamp.fromDate(dateRange.from),
            endDate: Timestamp.fromDate(dateRange.to),
            owner: user.uid,
            notes,
        };

        try {
            handleEditCreate(tripData);
            router.push('/dashboard');
        } catch (err) {
            console.error("Errore nel salvataggio del viaggio:", err);
            setError("Impossibile salvare il viaggio. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditCreate = async (tripData: Partial<Trip>): Promise<void> => {
        try {
            if (isEditMode) {
                const tripDocRef = doc(db, 'trips', tripId);
                await updateDoc(tripDocRef, tripData);
            } else {
                const tripsCollectionRef = collection(db, 'trips');
                await addDoc(tripsCollectionRef, { ...tripData, createdAt: serverTimestamp() });
            }
            router.push('/dashboard');
        } catch (err) {

        }
    }

    if (loading || isLoadingData) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar backPath="/dashboard" breadcrumb={breadcrumbPaths} />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="w-full  bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">

                    <PageTitle title={isEditMode ? 'Modifica il tuo viaggio' : 'Crea un nuovo viaggio'}
                        subtitle={isEditMode ? 'Aggiorna i dettagli di questa avventura.' :
                            'Inserisci i dettagli della tua prossima avventura.'} />


                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input id="trip-name" label="Nome del Viaggio" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Periodo del viaggio
                            </label>
                            <DateRangePicker value={dateRange} onChange={setDateRange} />
                        </div>
                        <Textarea id="notes" label="Note" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <div className="flex justify-end gap-4 pt-4 ">
                            <Button className='w-auto' variant="secondary" type="button" onClick={() => router.push('/dashboard')}>Annulla</Button>
                            <Button className='w-auto' type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Salvataggio...' : 'Salva'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
