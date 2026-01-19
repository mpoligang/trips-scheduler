'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Trip } from '@/models/Trip';
import { useAuth } from '@/context/authProvider';
import { EntityKeys } from '@/utils/entityKeys';
import { PathItem } from '@/models/PathItem';


interface TripContextType {
    trip: Trip | null;
    loading: boolean;
    error: string | null;
    isOwner: boolean;
    setBreadcrumb?: (items: PathItem[]) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);


export function TripProvider({ children, tripId }: { children: ReactNode; tripId: string }) {
    const { user } = useAuth();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !tripId) { return; }

        setLoading(true);
        setError(null);

        if (tripId === 'new') {
            setTrip(null);
            setLoading(false);
            return;
        }

        const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);

        const unsubscribe = onSnapshot(tripDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as Trip;
                const isOwner = data.owner === user.uid;
                const isParticipant = data.participantIds?.includes(user.uid);

                if (isOwner || isParticipant) {
                    setTrip(data);
                } else {
                    setError("Non hai i permessi per visualizzare questo viaggio.");
                }
            } else {
                setError("Viaggio non trovato.");
            }
            setLoading(false);
        }, (err) => {
            console.error("Errore TripContext:", err);
            setError("Si è verificato un errore nel caricamento dei dati.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [tripId, user]);

    const isOwner = trip?.owner === user?.uid;

    return (
        <TripContext.Provider value={{ trip, loading, error, isOwner }}>
            {children}
        </TripContext.Provider>
    );
}

export const useTrip = () => {
    const context = useContext(TripContext);
    if (context === undefined) {
        throw new Error('useTrip deve essere usato all\'interno di un TripProvider');
    }
    return context;
};



