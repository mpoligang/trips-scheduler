'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';


import PageContainer from '@/components/containers/page-container';
import Tabs, { TabItem } from '@/components/navigations/tabs';
import ComingSoonFeature from '@/components/cards/coming-soon-features';

import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
import { PathItem } from '@/models/PathItem';
import { Trip } from '@/models/Trip';
import { Accommodation } from '@/models/AccomModation';
import { appRoutes } from '@/utils/appRoutes';
import Navbar from '@/components/navigations/navbar';
import AccommodationForm from '@/components/forms/accomodation-form';
import Loader from '@/components/generics/loader';
import { EntityKeys } from '@/utils/entityKeys';

export default function AccommodationFormPage() {
    const { user, loading } = useAuth();
    const params = useParams();
    const tripId = params.tripId as string;
    const accommodationId = params.accommodationId as string;
    const isNew = accommodationId === 'new';

    const [trip, setTrip] = useState<Trip | null>(null);
    const [currentAccommodation, setCurrentAccommodation] = useState<Accommodation | undefined>(undefined);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !tripId) {
                setIsLoadingData(false);
                return;
            }
            try {
                const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
                const tripDoc = await getDoc(tripDocRef);

                if (!tripDoc.exists()) {
                    setError("Viaggio non trovato.");
                    return;
                }

                const tripData = tripDoc.data() as Trip;
                setTrip(tripData);

                if (!isNew) {
                    const accommodation = tripData.accommodations?.find(acc => acc.id === accommodationId);
                    if (accommodation) {
                        setCurrentAccommodation(accommodation);
                    } else {
                        setError("Alloggio non trovato.");
                    }
                }
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

    const breadcrumbPaths: PathItem[] = [
        {
            label: 'I miei viaggi', href: appRoutes.home
        },
        { label: trip?.name || 'Viaggio', href: appRoutes.tripDetails(tripId) },
        { label: isNew ? 'Aggiungi Alloggio' : (currentAccommodation?.name || 'Dettaglio'), href: '#' }
    ];

    if (loading || isLoadingData) {
        return <Loader />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
                <Navbar backPath={appRoutes.tripDetails(tripId)} breadcrumb={breadcrumbPaths} />
                <PageContainer>
                    <p className="text-red-500 text-center">{error}</p>
                </PageContainer>
            </div>
        );
    }

    // Definizione dei Tabs
    const tabs: TabItem[] = [
        {
            label: 'Dettaglio Alloggio',
            content: trip && (
                <AccommodationForm
                    trip={trip}
                    tripId={tripId}
                    accommodationId={accommodationId}
                    isNew={isNew}
                    isOwner={trip?.owner === user?.uid}

                />
            )
        },
        {
            label: 'Informazioni AI',
            content: (
                <ComingSoonFeature
                    title="Funzionalità in Sviluppo"
                    description="Stiamo lavorando per integrare l'intelligenza artificiale che ti aiuterà a scoprire dettagli e consigli su questo alloggio."
                />
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