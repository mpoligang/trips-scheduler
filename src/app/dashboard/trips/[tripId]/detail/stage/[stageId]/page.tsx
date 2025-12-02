'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { Trip } from '@/models/Trip';
import { PathItem } from '@/models/PathItem';
import Navbar from '@/components/navigations/navbar';
import Input from '@/components/inputs/input';
import Button from '@/components/actions/button';
import SingleDatePicker from '@/components/inputs/date-picker';
import { useAuth } from '@/context/authProvider';
import { app, db } from '@/firebase/config';
import { FaPen, FaMap, FaUndo, FaRobot } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import Loader from '@/components/generics/loader';
import { Stage } from '@/models/Stage';
import Dropdown from '@/components/inputs/dropdown';
import SearchLocation from '@/components/inputs/search-location';
import PageContainer from '@/components/containers/page-container';
import PageTitle from '@/components/generics/page-title';
import ContextMenu from '@/components/actions/context-menu';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import { User } from 'firebase/auth';
import Tabs, { TabItem } from '@/components/navigations/tabs';
import ComingSoonFeature from '@/components/cards/coming-soon-features';

const formatDateForLabel = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
};


function useTripStageData(tripId: string, stageId: string, isNew: boolean, user: User | null) {
    const [trip, setTrip] = useState<Trip | null>(null);
    const [stageName, setStageName] = useState('');
    const [stageDate, setStageDate] = useState<Date | undefined>();
    const [stageLocation, setStageLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [stageDestination, setStageDestination] = useState<{ id: string; name: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const getData = async (): Promise<void> => {
            try {
                const tripDocRef = doc(db, 'trips', tripId);
                const docSnap = await getDoc(tripDocRef);
                if (docSnap?.exists()) {
                    const tripData = docSnap.data() as Trip;
                    setTrip(tripData);
                    if (!isNew) {
                        const stageToEdit = tripData.stages?.find(s => s.id === stageId);
                        if (stageToEdit) {
                            setStageName(stageToEdit.name);
                            setStageDate(new Date(stageToEdit.date));
                            setStageLocation(stageToEdit.location);
                            if (stageToEdit.destination) {
                                setStageDestination({ id: stageToEdit.destination, name: stageToEdit.destination });
                            }
                        } else {
                            setError("Tappa non trovata.");
                        }
                    }
                } else {
                    setError("Viaggio non trovato.");
                }
            } catch (err) {
                console.error("Errore caricamento dati:", err);
                setError("Errore nel caricamento dei dati.");
            } finally {
                setIsLoadingData(false);
            }
        };

        if (user && tripId) {
            getData();
        }
    }, [user, tripId, isNew, stageId]);

    return {
        trip,
        stageName,
        setStageName,
        stageDate,
        setStageDate,
        stageLocation,
        setStageLocation,
        stageDestination,
        setStageDestination,
        error,
        setError,
        isLoadingData,
    };
}

function getBreadcrumbPaths(trip: Trip | null, tripId: string, isNew: boolean, stageName: string): PathItem[] {
    return [
        { label: 'Dashboard', href: '/dashboard' },
        { label: trip?.name || 'Viaggio', href: `/dashboard/trips/${tripId}/detail` },
        { label: isNew ? 'Aggiungi Tappa' : stageName, href: '#' }
    ];
}

function getDestinationOptions(trip: Trip | null) {
    return trip?.destinations?.map(d => ({ id: d, name: d })) || [];
}

export default function StageFormPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId as string;
    const stageId = params.stageId as string;

    const isNew = stageId === 'new';
    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        trip,
        stageName,
        setStageName,
        stageDate,
        setStageDate,
        stageLocation,
        setStageLocation,
        stageDestination,
        setStageDestination,
        error,
        setError,
        isLoadingData,
    } = useTripStageData(tripId, stageId, isNew, user);

    const datePickerPlaceholder = (trip: Trip | null) => `Seleziona una data da ${formatDateForLabel((trip?.startDate as Timestamp)?.toDate())} a ${formatDateForLabel((trip?.endDate as Timestamp)?.toDate())}`;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || !trip || !stageName || !stageDate || !stageLocation || !stageDestination) {
            setError("Tutti i campi sono obbligatori.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const tripDocRef = doc(db, 'trips', tripId);

        try {
            if (isNew) {
                const newStage: Stage = {
                    id: uuidv4(),
                    name: stageName,
                    date: stageDate.toISOString().split('T')[0],
                    location: stageLocation,
                    destination: stageDestination.name,
                };
                await updateDoc(tripDocRef, { stages: arrayUnion(newStage) });
            } else {
                const updatedStages = trip.stages?.map(stage =>
                    stage.id === stageId
                        ? { ...stage, name: stageName, date: stageDate.toISOString().split('T')[0], location: stageLocation, destination: stageDestination.name }
                        : stage
                ) || [];
                await updateDoc(tripDocRef, { stages: updatedStages });
            }
            router.push(appRoutes.tripDetails(tripId));
        } catch (err) {
            console.error("Errore nel salvataggio della tappa:", err);
            setError("Impossibile salvare la tappa. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const breadcrumbPaths = getBreadcrumbPaths(trip, tripId, isNew, stageName);

    if (loading || isLoadingData) {
        return <Loader />;
    }

    const destinationOptions = getDestinationOptions(trip);
    const submitButtonLabel = isSubmitting ? 'Salvataggio...' : (isNew ? 'Aggiungi' : 'Salva Modifiche');

    // Definizione dei Tabs
    const tabs: TabItem[] = [
        {
            label: 'Dettaglio Tappa',
            content: (
                <>

                    <PageTitle
                        title={isNew ? 'Aggiungi Tappa' : stageName}
                        subtitle={isNew ? "Aggiungi una nuova tappa al tuo viaggio." : ""}
                    >
                        {!isNew && (
                            <ContextMenu items={[
                                {
                                    label: isReadOnly ? 'Modifica' : 'Annulla',
                                    icon: isReadOnly ? <FaPen /> : <FaUndo />,
                                    onClick: () => setIsReadOnly(!isReadOnly)
                                },
                                {
                                    label: 'Indicazioni',
                                    icon: <FaMap />,
                                    onClick: () => { window.open(mapNavigationUrl(stageLocation?.address || ''), '_blank'); }
                                }
                            ]} />
                        )}
                    </PageTitle>
                    <form onSubmit={handleSubmit} className="space-y-6 mt-6">

                        <Input
                            placeholder='es. Visita al Colosseo'
                            id="stage-name"
                            label="Nome della Tappa"
                            type="text"
                            value={stageName}
                            onChange={(e) => setStageName(e.target.value)}
                            required
                            readOnly={isReadOnly}
                        />

                        <Dropdown<{ id: string; name: string }>
                            label="Destinazione"
                            items={destinationOptions}
                            selected={stageDestination}
                            onSelect={setStageDestination}
                            optionValue="id"
                            optionLabel="name"
                            placeholder="Seleziona una destinazione"
                            readOnly={isReadOnly}
                        />
                        <SearchLocation
                            label="Indirizzo della Tappa"
                            value={stageLocation}
                            readOnly={isReadOnly}
                            onSelect={isReadOnly ? () => { } : setStageLocation}
                            placeholder="Digita per cercare..."
                            className={isReadOnly ? "pointer-events-none opacity-80" : ""}
                        />

                        <div>

                            <SingleDatePicker
                                label={datePickerPlaceholder(trip)}
                                selected={stageDate}
                                onSelect={setStageDate}
                                disabledDays={trip ? {
                                    before: (trip.startDate as Timestamp).toDate(),
                                    after: (trip.endDate as Timestamp).toDate()
                                } : { before: new Date() }}
                                readOnly={isReadOnly}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        {!isReadOnly && (
                            <div className="flex justify-end gap-4 pt-4">
                                <Button
                                    className="w-auto"
                                    variant="secondary"
                                    type="button"
                                    onClick={() => {
                                        if (isNew) router.back();
                                        else setIsReadOnly(true);
                                    }}
                                >
                                    Annulla
                                </Button>
                                <Button className="w-auto" type="submit" disabled={isSubmitting}>
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
                <ComingSoonFeature
                    description="Stiamo lavorando per integrare l'intelligenza artificiale che ti aiuterà a scoprire dettagli e consigli su questa tappa."
                />
            )
        },

    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar backPath={`/dashboard/trips/${tripId}/detail`} breadcrumb={breadcrumbPaths} />
            <PageContainer>
                <Tabs tabs={tabs} />
            </PageContainer>
        </div>
    );
}