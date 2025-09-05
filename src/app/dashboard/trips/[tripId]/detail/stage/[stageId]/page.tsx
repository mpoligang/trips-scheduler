'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { Trip } from '@/models/Trip';
import { PathItem } from '@/models/PathItem';
import Navbar from '@/components/navbar';
import Input from '@/components/input';
import Button from '@/components/button';
import SingleDatePicker from '@/components/date-picker';
import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
import { FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import Loader from '@/components/loader';
const MapPicker = dynamic(() => import('@/components/map'), { ssr: false });

const formatDateForLabel = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
};

export default function StageFormPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId as string;
    const stageId = params.stageId as string;
    const isEditMode = stageId !== 'new';

    const [trip, setTrip] = useState<Trip | null>(null);
    const [stageName, setStageName] = useState('');
    const [stageDate, setStageDate] = useState<Date | undefined>();
    const [stageLocation, setStageLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const datePickerPlaceholder = (trip: Trip | null) => `Seleziona una data da ${formatDateForLabel((trip?.startDate as Timestamp)?.toDate())} a ${formatDateForLabel((trip?.endDate as Timestamp)?.toDate())}`

    useEffect(() => {
        if (user && tripId) {
            getData();
        }
    }, [user, tripId, isEditMode, stageId]);


    const getData = async (): Promise<void> => {
        const tripDocRef = doc(db, 'trips', tripId);
        const docSnap = await getDoc(tripDocRef)
        if (docSnap && docSnap.exists()) {
            const tripData = docSnap.data() as Trip;
            setTrip(tripData);
            if (isEditMode) {
                const stageToEdit = tripData.stages?.find(s => s.id === stageId);
                if (stageToEdit) {
                    setStageName(stageToEdit.name);
                    setStageDate(new Date(stageToEdit.date));
                    setStageLocation(stageToEdit.location);
                } else {
                    setError("Tappa non trovata.");
                }
            }
        } else {
            setError("Viaggio non trovato.");
        }
        setIsLoadingData(false);
    }


    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !trip || !stageName || !stageDate || !stageLocation) {
            setError("Tutti i campi sono obbligatori.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const tripDocRef = doc(db, 'trips', tripId);

        try {
            if (isEditMode) {
                const updatedStages = trip.stages?.map(stage =>
                    stage.id === stageId
                        ? { ...stage, name: stageName, date: stageDate.toISOString().split('T')[0], location: stageLocation }
                        : stage
                ) || [];

                await updateDoc(tripDocRef, { stages: updatedStages });

            } else {
                const newStage = {
                    id: uuidv4(),
                    name: stageName,
                    date: stageDate.toISOString().split('T')[0],
                    location: stageLocation,
                };
                await updateDoc(tripDocRef, { stages: arrayUnion(newStage) });
            }

            router.push(`/dashboard/trips/${tripId}/detail`);

        } catch (err) {
            console.error("Errore nel salvataggio della tappa:", err);
            setError("Impossibile salvare la tappa. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const breadcrumbPaths: PathItem[] = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: trip?.name || 'Viaggio', href: `/dashboard/trips/${tripId}/detail` },
        { label: isEditMode ? 'Modifica Tappa' : 'Aggiungi Tappa', href: '#' }
    ];

    if (loading || isLoadingData) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar backPath={`/dashboard/trips/${tripId}/detail`} breadcrumb={breadcrumbPaths} />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="w-full  bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 flex flex-col gap-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Cerca un luogo sulla mappa</h2>
                        <MapPicker value={stageLocation} onLocationSelect={setStageLocation} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Inserisci i dettagli della tappa</h2>
                        <Input placeholder='es. Visita al Colosseo' id="stage-name" label="Nome della Tappa" type="text" value={stageName} onChange={(e) => setStageName(e.target.value)} required />
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Data della tappa
                                </label>

                            </div>
                            <SingleDatePicker
                                label={datePickerPlaceholder(trip)}
                                selected={stageDate}
                                onSelect={setStageDate}
                                disabledDays={trip ? {
                                    before: (trip.startDate as Timestamp).toDate(),
                                    after: (trip.endDate as Timestamp).toDate()
                                } : { before: new Date() }}
                            />
                        </div>

                        {stageLocation && (
                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">Luogo Selezionato:</p>
                                    <p className="text-gray-600 dark:text-gray-400">{stageLocation.address}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setStageLocation(null)}
                                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                                    aria-label="Rimuovi luogo"
                                >
                                    <FaTrash className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div className="flex justify-end gap-4 pt-4">
                            <Button className="w-auto" variant="secondary" type="button" onClick={() => router.back()}>Annulla</Button>
                            <Button className="w-auto" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvataggio...' : 'Salva'}</Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

