'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';

import Loader from '@/components/generics/loader';
import Navbar from '@/components/navigations/navbar';
import PageContainer from '@/components/containers/page-container';
import Tabs, { TabItem } from '@/components/navigations/tabs';
import ComingSoonFeature from '@/components/cards/coming-soon-features';

import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
import { PathItem } from '@/models/PathItem';
import { Trip } from '@/models/Trip';
import { appRoutes } from '@/utils/appRoutes';
import TransportForm from '@/components/forms/transport-form';

export default function TransportFormPage() {
    const { user, loading } = useAuth();
    const params = useParams();
    const tripId = params.tripId as string;
    const transportId = params.transportId as string;
    const isNew = transportId === 'new';

    const [trip, setTrip] = useState<Trip | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !tripId) {
                setIsLoadingData(false);
                return;
            }
            try {
                const tripDocRef = doc(db, 'trips', tripId);
                const docSnap = await getDoc(tripDocRef);
                if (docSnap?.exists()) {
                    setTrip(docSnap.data() as Trip);
                } else {
                    setError("Viaggio non trovato.");
                }
            } catch (err) {
                console.error(err);
                setError("Errore caricamento dati.");
            } finally {
                setIsLoadingData(false);
            }
        };

        if (user && tripId) fetchData();
    }, [user, tripId]);

    const breadcrumbPaths: PathItem[] = [
        { label: 'Dashboard', href: appRoutes.home },
        { label: trip?.name || 'Viaggio', href: appRoutes.tripDetails(tripId) },
        { label: isNew ? 'Aggiungi Trasporto' : 'Dettaglio Trasporto', href: '#' }
    ];

    if (loading || isLoadingData) return <Loader />;

    if (error) return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar backPath={appRoutes.tripDetails(tripId)} breadcrumb={breadcrumbPaths} />
            <PageContainer><p className="text-red-500 text-center">{error}</p></PageContainer>
        </div>
    );

    const tabs: TabItem[] = [
        {
            label: 'Dettaglio Trasporto',
            content: trip && (
                <TransportForm
                    trip={trip}
                    tripId={tripId}
                    transportId={transportId}
                    isNew={isNew}
                />
            )
        },
        {
            label: 'Informazioni AI',
            content: <ComingSoonFeature description="L'IA ti aiuterà a gestire ritardi e coincidenze." />
        }
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar backPath={appRoutes.tripDetails(tripId)} breadcrumb={breadcrumbPaths} />
            <PageContainer>
                <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
                    <Tabs tabs={tabs} />
                </div>
            </PageContainer>
        </div>
    );
}