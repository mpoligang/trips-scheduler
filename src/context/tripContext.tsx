'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { createClient } from '@/lib/client';
import { Trip } from '@/models/Trip';
import { useAuth } from '@/context/authProvider';
import { Stage } from '@/models/Stage';
import { Accommodation } from '@/models/Accommodation';
import { Transport } from '@/models/Transport';
import { EntityKeys } from '@/utils/entityKeys';
import { UserData } from '@/models/UserData';

interface TripContextType {
    trip: Trip | null;
    stages: Stage[];
    accommodations: Accommodation[];
    transports: Transport[];
    participants: Partial<UserData>[];
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

    // 🚩 CACHE REF: Memorizza l'ultimo ID caricato per evitare fetch inutili
    const lastLoadedId = useRef<string | null>(null);

    const fetchAllData = useCallback(async (force = false) => {
        if (!user || !tripId || tripId === 'new') {
            setLoading(false);
            return;
        }

        // ✅ GUARDIA: Se l'ID è lo stesso e non forziamo, non chiamare il DB
        if (lastLoadedId.current === tripId && !force) {
            console.log("⚡ Cache hit: dati già presenti per questo ID.");
            setLoading(false);
            return;
        }

        // ✅ UX OPTIMIZATION: Mostriamo il loader solo se cambiamo viaggio, 
        // non se stiamo solo rinfrescando i dati dello stesso viaggio.
        if (lastLoadedId.current !== tripId) setLoading(true);

        console.log(`📡 Fetching ${force ? 'FORZATO' : 'INIZIALE'} per Trip:`, tripId);

        try {
            const { data, error: supabaseError } = await supabase
                .from(EntityKeys.tripsKey)
                .select(`
                    *,
                    stages(*, attachments(*)),
                    accommodations(*, attachments(*)),
                    transports(*, attachments(*)),
                    trip_participants (profiles (id, username, first_name, last_name))
                `)
                .eq('id', tripId)
                .order('position', { referencedTable: EntityKeys.stagesKey, ascending: true })
                .single();

            if (supabaseError) throw supabaseError;

            if (data) {
                setTrip(data as Trip);
                lastLoadedId.current = tripId;
                setError(null);
            }
        } catch (err: any) {
            console.error("❌ Errore TripContext:", err.message);
            setError("Impossibile caricare il viaggio.");
        } finally {
            setLoading(false);
        }
    }, [tripId, user, supabase, trip]);

    // 1. 🔄 Effetto Caricamento/Cambio Viaggio
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // 2. 🏠 Effetto Refresh all'atterraggio (Triggerato dal Pathname)
    useEffect(() => {
        const isRootPage = pathname === `/dashboard/trips/${tripId}`;
        if (isRootPage && lastLoadedId.current === tripId) {
            console.log("🏠 Bentornato nella root del viaggio. Rinfresco dati...");
            fetchAllData(true);
        }
    }, [pathname, tripId, fetchAllData]);

    // 3. 📡 Realtime Subscription (Ottimizzato)
    useEffect(() => {
        if (!tripId || tripId === 'new') return;

        const channel = supabase.channel(`realtime_trip_${tripId}`)
            .on('postgres_changes', { event: '*', schema: 'public', filter: `trip_id=eq.${tripId}` }, () => fetchAllData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: EntityKeys.tripsKey, filter: `id=eq.${tripId}` }, () => fetchAllData(true))
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [tripId, supabase, fetchAllData]);

    const value = useMemo(() => ({
        trip,
        stages: trip?.stages || [],
        accommodations: trip?.accommodations || [],
        transports: trip?.transports || [],
        participants: trip?.trip_participants?.map((p: { profiles: Partial<UserData> }) => ({ ...p.profiles })) || [],
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