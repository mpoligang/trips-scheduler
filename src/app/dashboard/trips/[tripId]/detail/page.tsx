'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import Navbar from '@/components/navigations/navbar';
import { useAuth } from '@/context/authProvider';
import { db } from '@/firebase/config';
import { PathItem } from '@/models/PathItem';
import { Trip } from '@/models/Trip';
import Loader from '@/components/generics/loader';
import Tabs, { TabItem } from '@/components/navigations/tabs';
import PageContainer from '@/components/containers/page-container';
import ComingSoonFeature from '@/components/cards/coming-soon-features';
import AccommodationsList from '@/components/list/accomodations-list';
import StagesList from '@/components/list/stages-list';
import { appRoutes } from '@/utils/appRoutes';
import { EntityKeys } from '@/utils/entityKeys';
import ParticipantsList from '@/components/list/participants-list';
import TransportsList from '@/components/list/transport-list';

const StagesMap = dynamic(() => import('@/components/maps/map-bound'), {
    ssr: false,
    loading: () => <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
});

export default function TripDetailPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const tripId = params.tripId as string;

    const [trip, setTrip] = useState<Trip | null>(null);
    const [isLoadingTrip, setIsLoadingTrip] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const breadcrumbPaths: PathItem[] = [
        { label: 'Dashboard', href: appRoutes.home },
        { label: trip ? trip.name : 'Dettagli Viaggio', href: `#` }
    ];

    useEffect(() => {
        if (!loading && !user) {
            router.push(appRoutes.login);
            return;
        }
        if (user && tripId) {
            const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
            const unsubscribe = onSnapshot(tripDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setTrip({ id: docSnap.id, ...docSnap.data() } as Trip);
                } else {
                    setError("Viaggio non trovato.");
                }
                setIsLoadingTrip(false);
            });
            return () => unsubscribe();
        }
    }, [user, loading, tripId, router]);


    if (loading || isLoadingTrip) {
        return <Loader />;
    }

    if (error) {
        // ... (codice di gestione errore invariato)
    }



    const tabs: TabItem[] = [
        {
            label: 'Tappe del Viaggio',
            content: (
                <StagesList
                    tripId={tripId}
                    stages={trip?.stages}
                    isOwner={trip?.owner === user?.uid}
                />
            )
        },
        {
            label: 'Alloggi',
            content: (
                <AccommodationsList
                    tripId={tripId}
                    isOwner={trip?.owner === user?.uid}
                    accommodations={trip?.accommodations}
                />
            )
        },
        {
            label: 'Trasporti',
            content: (
                <TransportsList
                    tripId={tripId}
                    transports={trip?.transports}
                    isOwner={trip?.owner === user?.uid}
                />
            )
        },
        {
            label: 'Membri',
            content: (
                <div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow ">
                        <ParticipantsList
                            tripId={tripId}
                            participants={trip?.participants}
                            currentUserId={user?.uid}
                            isOwner={trip?.owner === user?.uid}
                        />
                    </div>
                </div>
            )
        },
        {
            label: 'Mappa del Viaggio',
            content: (
                <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Mappa del Viaggio</h3>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-2">
                        <StagesMap stages={trip?.stages || []} />
                    </div>
                </div>
            )
        },
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar backPath="/dashboard" breadcrumb={breadcrumbPaths} />
            <PageContainer>
                <div className="flex flex-col gap-8">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <Tabs tabs={tabs} />
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}

