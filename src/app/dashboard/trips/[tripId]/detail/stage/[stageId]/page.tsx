'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
    doc, getDoc
} from 'firebase/firestore';
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
import { appRoutes } from '@/utils/appRoutes';
import AttachmentsManager from '@/components/cards/attachment-manager';
import { Attachment } from '@/models/Stage';



function useTripStageData(tripId: string, stageId: string, isNew: boolean, user: User | null) {
    const [trip, setTrip] = useState<Trip | null>(null);
    const [stageName, setStageName] = useState('');
    const [stageDate, setStageDate] = useState<Date | undefined>();
    const [stageLocation, setStageLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [stageDestination, setStageDestination] = useState<{ id: string; name: string } | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const refreshData = useCallback(async (tripId: string, showLoader: boolean = true): Promise<void> => {
        if (!user || !tripId) return;

        // Se showLoader è true, attiviamo il caricamento (schermo intero)
        // Se è false, l'utente continuerà a vedere la pagina mentre i dati si aggiornano sotto
        if (showLoader) {
            setIsLoadingData(true);
        }

        try {
            const tripDocRef = doc(db, 'trips', tripId);
            const docSnap = await getDoc(tripDocRef);
            if (docSnap?.exists()) {
                const tripData = docSnap.data() as Trip;
                setTrip(tripData);
                // ... logica di assegnazione stageName, etc. (rimane uguale)
                if (!isNew) {
                    const stageToEdit = tripData.stages?.find(s => s.id === stageId);
                    if (stageToEdit) {
                        setStageName(stageToEdit.name);
                        // ... eccetera
                    }
                }
            } else {
                setError("Viaggio non trovato.");
            }
        } catch (err) {
            console.error("Errore caricamento dati:", err);
            setError("Errore nel caricamento dei dati.");
        } finally {
            // Spegniamo il loader in ogni caso alla fine
            if (showLoader) {
                setIsLoadingData(false);
            }
        }
    }, [user, isNew, stageId]);

    const updateLocalAttachments = useCallback((newAttachments: Attachment[]) => {
        setTrip((prevTrip) => {
            if (!prevTrip) return null;

            // Creiamo una copia profonda o aggiorniamo solo lo stage interessato
            const updatedStages = prevTrip.stages?.map((s) => {
                if (s.id === stageId) {
                    return { ...s, attachments: newAttachments };
                }
                return s;
            });

            return { ...prevTrip, stages: updatedStages };
        });
    }, [stageId]);

    // Effetto iniziale per caricare i dati
    useEffect(() => {
        refreshData(tripId);
    }, [refreshData, tripId]);

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
        refreshData,
        updateLocalAttachments
    };
}

function getBreadcrumbPaths(trip: Trip | null, tripId: string, isNew: boolean, stageName: string): PathItem[] {
    return [
        { label: 'Dashboard', href: appRoutes.home },
        { label: trip?.name || 'Viaggio', href: appRoutes.tripDetails(tripId) },
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
        refreshData,
        updateLocalAttachments
    } = useTripStageData(tripId, stageId, isNew, user);

    const breadcrumbPaths = getBreadcrumbPaths(trip, tripId, isNew, stageName);

    if (loading || isLoadingData) {
        return <Loader />;
    }

    const tabs: TabItem[] = [
        {
            label: 'Dettaglio Tappa',
            content: (
                <StageForm
                    trip={trip as Trip}
                    tripId={tripId}
                    stageId={stageId}
                    isNew={isNew}
                    isOwner={trip?.owner === user?.uid}
                    onSuccess={() => refreshData(tripId, false)} />
            )
        },


    ];

    const addedTabOnlyIfExistStage = [
        {
            label: 'Allegati',
            content: (
                <AttachmentsManager
                    tripId={tripId}
                    stageId={stageId}
                    attachments={trip?.stages?.find(s => s.id === stageId)?.attachments || []}
                    setAttachments={updateLocalAttachments}
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

    if (!isNew) {
        tabs.push(...addedTabOnlyIfExistStage);
    }



    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar backPath={appRoutes.tripDetails(tripId)} breadcrumb={breadcrumbPaths} />
            <PageContainer>
                <Tabs tabs={tabs} />
            </PageContainer>
        </div>
    );
}