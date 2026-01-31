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
import { Expense } from '@/models/Expenses';

interface TripContextType {
    trip: Trip | null;
    stages: Stage[];
    accommodations: Accommodation[];
    transports: Transport[];
    participants: Partial<UserData>[];
    expenses: Expense[];
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

    // Estendo localmente il tipo Trip per includere il join delle spese
    const [trip, setTrip] = useState<(Trip) | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const lastLoadedId = useRef<string | null>(null);

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
            const { data, error: supabaseError } = await supabase
                .from(EntityKeys.tripsKey)
                .select(`
                    *,
                    stages(*, attachments(*)),
                    accommodations(*, attachments(*)),
                    transports(*, attachments(*)),
                    expenses(
                        *,
                        profiles:paid_by (id, first_name, last_name, username),
                        expense_splits (
                            *,
                            profiles:user_id (id, first_name, last_name, username)
                        )
                    ),
                    trip_participants (profiles (id, username, first_name, last_name))
                `)
                .eq('id', tripId)
                .order('position', { referencedTable: EntityKeys.stagesKey, ascending: true })
                .single();

            if (supabaseError) throw supabaseError;

            if (data) {
                setTrip(data as any);
                lastLoadedId.current = tripId;
                setError(null);
            }
        } catch (err: any) {
            console.error("❌ Errore TripContext:", err.message);
            setError("Impossibile caricare il viaggio.");
        } finally {
            setLoading(false);
        }
    }, [tripId, user, supabase]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    useEffect(() => {
        const isRootPage = pathname === `/dashboard/trips/${tripId}`;
        if (isRootPage && lastLoadedId.current === tripId) {
            fetchAllData(true);
        }
    }, [pathname, tripId, fetchAllData]);

    useEffect(() => {
        if (!tripId || tripId === 'new') return;

        const channel = supabase.channel(`realtime_trip_${tripId}`)
            .on('postgres_changes', { event: '*', schema: 'public', filter: `trip_id=eq.${tripId}` }, () => fetchAllData(true))
            // Ascolta cambiamenti specifici sulla tabella spese legati a questo viaggio
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${tripId}` }, () => fetchAllData(true))
            // AGGIUNGI QUESTO:
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_splits' }, () => {
                // Poiché expense_splits non ha trip_id diretto, controlliamo se lo split 
                // appartiene a una delle spese che abbiamo già in memoria o ricarichiamo per sicurezza
                fetchAllData(true);
            }).on('postgres_changes', { event: '*', schema: 'public', table: EntityKeys.tripsKey, filter: `id=eq.${tripId}` }, () => fetchAllData(true))
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [tripId, supabase, fetchAllData]);

    console.log(trip);


    const value = useMemo(() => ({
        trip,
        stages: trip?.stages || [],
        accommodations: trip?.accommodations || [],
        transports: trip?.transports || [],
        expenses: (trip?.expenses || []),
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