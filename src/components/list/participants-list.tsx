'use client';

import { useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { createClient } from '@/lib/client'; // ✅ Client Supabase
import Button from '../actions/button';
import DialogComponent from '../modals/confirm-modal';
import UserSearch from '../inputs/user-search';
import EmptyData from '../cards/empty-data';
import { useTrip } from '@/context/tripContext';
import { useAuth } from '@/context/authProvider';
import PageTitle from '../generics/page-title';
import { EntityKeys } from '@/utils/entityKeys';
import { UserData } from '@/models/UserData';

export default function ParticipantsList() {
    const supabase = createClient();
    const { trip, participants = [], isOwner, refreshData } = useTrip();
    const { user: authUser } = useAuth();

    // In Supabase l'ID utente è .id, non .uid
    const currentUserId = authUser?.id || '';

    const [isAdding, setIsAdding] = useState(false);
    const [deleteParticipant, setDeleteParticipant] = useState<any | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    /**
     * ✅ LOGICA AGGIUNTA PARTECIPANTE
     * Inseriamo una riga nella tabella di giunzione 'trip_participants'
     */
    const handleAddParticipant = async (userToAdd: Partial<UserData>) => {

        if (!userToAdd || isProcessing) { return; }

        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from(EntityKeys.participantsKey)
                .insert([
                    {
                        trip_id: trip?.id,
                        user_id: userToAdd.id
                    }
                ]);

            if (error) { throw error; }

            await refreshData(true); // Ricarica i dati del viaggio tramite Context
            setIsAdding(false);
        } catch (error) {
            console.error("Errore nell'aggiunta del partecipante:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    /**
     * ✅ LOGICA RIMOZIONE PARTECIPANTE
     * Eliminiamo la riga dalla tabella di giunzione
     */
    const handleConfirmDelete = async () => {
        if (!deleteParticipant || !trip) return;

        setIsProcessing(true);
        try {
            const { error } = await supabase
                .from(EntityKeys.participantsKey)
                .delete()
                .eq('trip_id', trip.id)
                .eq('user_id', deleteParticipant.id);

            if (error) throw error;

            await refreshData(true);
        } catch (error) {
            console.error("Errore nella rimozione del partecipante:", error);
        } finally {
            setIsProcessing(false);
            setDeleteParticipant(null);
        }
    };

    return (
        <div className="space-y-6">
            <DialogComponent
                isOpen={!!deleteParticipant}
                onClose={() => setDeleteParticipant(null)}
                onConfirm={handleConfirmDelete}
                isLoading={isProcessing}
                title="Rimuovi partecipante"
                confirmText="Rimuovi"
            >
                <p>
                    Vuoi rimuovere <strong>{deleteParticipant?.first_name} {deleteParticipant?.last_name}</strong> dal viaggio?
                    Non potrà più visualizzare o modificare questo itinerario.
                </p>
            </DialogComponent>

            <PageTitle title="Membri del Viaggio" subtitle='Visualizza e gestisci i membri del viaggio' >
                {isOwner && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsAdding(true)}
                    >
                        <FaPlus className="mr-2" />
                        Invita
                    </Button>
                )}
            </PageTitle>

            {isAdding && (
                <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-700 animate-fade-in mb-6">
                    <UserSearch
                        onSelect={handleAddParticipant}
                        placeholder="Inserisci l'email dell'utente..."
                        // Escludiamo l'utente corrente e i partecipanti già presenti
                        excludeIds={[currentUserId, ...participants.map(p => p.id as string)]}
                    />
                    <div className="flex justify-end">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsAdding(false)}
                            className="mt-4"
                        >
                            Annulla
                        </Button>
                    </div>
                </div>
            )}

            {participants && participants.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {participants.map((participant) => {
                        const displayName = `${participant.first_name} ${participant.last_name}`;

                        return (
                            <li key={participant.username} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg shadow-sm border border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                        {participant?.first_name?.charAt(0).toUpperCase()}
                                        {participant?.last_name?.charAt(0).toUpperCase()}

                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-sm">
                                            {displayName}
                                        </p>
                                    </div>
                                </div>

                                {isOwner && participant.id !== currentUserId && (
                                    <button
                                        onClick={() => setDeleteParticipant(participant)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-900/20 rounded-full transition-colors"
                                        title="Rimuovi dal viaggio"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                )}

                                {participant.id === currentUserId && (
                                    <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded-full font-medium">
                                        Tu
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <EmptyData
                    title="Viaggio in solitaria?"
                    subtitle="Non hai ancora invitato nessuno a questo viaggio."
                />
            )}
        </div>
    );
}