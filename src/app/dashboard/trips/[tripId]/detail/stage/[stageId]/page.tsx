'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { Trip } from '@/models/Trip';
import { PathItem } from '@/models/PathItem';
import Navbar from '@/components/navigations/navbar';
import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
import Loader from '@/components/generics/loader';
import PageContainer from '@/components/containers/page-container';
import { User } from 'firebase/auth';
import Tabs, { TabItem } from '@/components/navigations/tabs';
import ComingSoonFeature from '@/components/cards/coming-soon-features';
import StageForm from '@/components/forms/stage-form';


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


export default function StageFormPage() {
    const { user, loading } = useAuth();
    const params = useParams();
    const tripId = params.tripId as string;
    const stageId = params.stageId as string;

    const isNew = stageId === 'new';

    const {
        trip,
        stageName,
        isLoadingData,
    } = useTripStageData(tripId, stageId, isNew, user);



    const breadcrumbPaths = getBreadcrumbPaths(trip, tripId, isNew, stageName);

    if (loading || isLoadingData) {
        return <Loader />;
    }
    // Definizione dei Tabs
    const tabs: TabItem[] = [
        {
            label: 'Dettaglio Tappa',
            content: (


                <StageForm
                    trip={trip as Trip}
                    tripId={tripId}
                    stageId={stageId}
                    isNew={isNew}
                />


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