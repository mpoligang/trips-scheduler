'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/client';
import { useAuth } from '@/context/authProvider';

// Modelli
import { Trip } from '@/models/Trip';
import { Stage } from '@/models/Stage';
import { Accommodation } from '@/models/Accommodation';
import { Transport } from '@/models/Transport';
import { UserData } from '@/models/UserData';
import { Expense } from '@/models/Expenses';
import { EntityKeys } from '@/utils/entityKeys';

// Server Action
import { getTripFullDataAction } from '@/actions/trip-actions';
import { AISearchRequest } from '@/models/AIStageSuggestion';
import { Recommended } from '@/models/Recommended';

interface TripContextType {
    trip: Trip | null;
    stages: Stage[];
    accommodations: Accommodation[];
    transports: Transport[];
    recommended: Recommended[];
    participants: Partial<UserData>[];
    expenses: Expense[];
    ai_search_requests: AISearchRequest[];
    loading: boolean;
    error: string | null;
    isOwner: boolean;
    refreshData: (force?: boolean) => Promise<void>;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
    const supabase = createClient();
    const { user } = useAuth();
    const params = useParams();
    const pathname = usePathname();
    const tripId = params.tripId as string;

    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const lastLoadedId = useRef<string | null>(null);

    /**
     * ✅ FETCH DATA
     */
    const fetchAllData = useCallback(async (force = false) => {
        if (!user || !tripId || tripId === 'new') {
            setLoading(false);
            return;
        }

        if (lastLoadedId.current === tripId && !force) {
            setLoading(false);
            return;
        }

        if (lastLoadedId.current !== tripId) setLoading(true);

        try {
            const result = await getTripFullDataAction(tripId);

            if (result.success && result.data) {
                setTrip(result.data);
                lastLoadedId.current = tripId;
                setError(null);
            } else {
                throw new Error(result.error);
            }
        } catch (err: unknown) {
            console.error("❌ Errore TripContext:", (err as Error).message);
            setError("Impossibile caricare il viaggio.");
        } finally {
            setLoading(false);
        }
    }, [tripId, user]);

    // Caricamento iniziale
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Refresh automatico su navigazione
    useEffect(() => {
        const isRootPage = pathname === `/dashboard/trips/${tripId}`;
        if (isRootPage && lastLoadedId.current === tripId) {
            fetchAllData(true);
        }
    }, [pathname, tripId, fetchAllData]);

    /**
     * ✅ REALTIME
     */
    useEffect(() => {
        if (!tripId || tripId === 'new') return;

        const channel = supabase.channel(`realtime_trip_${tripId}`)
            // Modifiche generiche al viaggio (incluso stages, accommodations, ecc)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                filter: `trip_id=eq.${tripId}` // Questo filtro "dovrebbe" prendere anche ai_stage_suggestions
            }, () => fetchAllData(true))

            // Listener ESPLICITO per i suggerimenti AI (per sicurezza e velocità)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'ai_stage_suggestions', // <--- Ascoltiamo la nuova tabella
                filter: `trip_id=eq.${tripId}`
            }, (payload) => {
                console.log("🤖 AI Suggestions aggiornati Realtime:", payload);
                fetchAllData(true);
            })

            // Modifiche spese
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'expenses',
                filter: `trip_id=eq.${tripId}`
            }, () => fetchAllData(true))

            // Modifiche split
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'expense_splits'
            }, () => fetchAllData(true))

            // Modifica record principale
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: EntityKeys.tripsKey,
                filter: `id=eq.${tripId}`
            }, () => fetchAllData(true))
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tripId, supabase, fetchAllData]);

    const value = useMemo(() => ({
        trip,
        stages: trip?.stages || [],
        accommodations: trip?.accommodations || [],
        transports: trip?.transports || [],
        expenses: trip?.expenses || [],

        // Estrazione e ordinamento dei suggerimenti AI (dal più recente)
        ai_search_requests: (trip?.ai_search_requests || []).sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ) as AISearchRequest[],

        participants: trip?.trip_participants?.map((p: any) => ({ ...p.profiles })) || [],
        recommended: trip?.recommended || [],
        loading,
        error,
        isOwner: trip?.owner_id === user?.id,
        refreshData: (force = true) => fetchAllData(force),
    }), [trip, loading, error, user, fetchAllData]);

    return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export const useTrip = () => {
    const context = useContext(TripContext);
    if (!context) throw new Error('useTrip deve essere usato in TripProvider');
    return context;
};