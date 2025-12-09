'use client';

import { useState } from 'react';
import { FaPlus, FaTrash, FaExclamationTriangle, FaUserFriends, FaTimes } from 'react-icons/fa';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { TripParticipant } from '@/models/Trip';
import { EntityKeys } from '@/utils/entityKeys'; // Assumo tu abbia questo file di utilità, altrimenti usa stringa 'trips'
import Button from '../actions/button';
import ConfirmationModal from '../modals/confirm-modal';
import UserSearch from '../inputs/user-search';
import EmptyData from '../cards/empty-data';


interface ParticipantsListProps {
    readonly tripId: string;
    readonly participants?: TripParticipant[];
    readonly currentUserId?: string;
    readonly isOwner: boolean;
}

export default function ParticipantsList({
    tripId,
    participants = [],
    currentUserId,
    isOwner
}: ParticipantsListProps) {
    const [isAdding, setIsAdding] = useState(false);
    const [deleteParticipant, setDeleteParticipant] = useState<TripParticipant | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Gestione Aggiunta Partecipante
    const handleAddParticipant = async (userToAdd: any) => {
        if (!userToAdd || isProcessing) return;

        // Evita duplicati
        if (participants.some(p => p.uid === userToAdd.uid)) {
            alert("Questo utente è già partecipante del viaggio.");
            return;
        }

        setIsProcessing(true);
        try {
            const newParticipant: TripParticipant = {
                uid: userToAdd.uid,
                email: userToAdd.email,
                displayName: userToAdd.firstName ? `${userToAdd.firstName} ${userToAdd.lastName || ''}` : userToAdd.email.split('@')[0]
            };

            const tripRef = doc(db, EntityKeys.tripsKey, tripId);

            // Aggiorna sia l'array completo per la UI sia l'array di ID per le Security Rules
            await updateDoc(tripRef, {
                participants: arrayUnion(newParticipant),
                participantIds: arrayUnion(newParticipant.uid)
            });

            setIsAdding(false);
        } catch (error) {
            console.error("Errore nell'aggiunta del partecipante:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    // Gestione Rimozione Partecipante
    const handleConfirmDelete = async () => {
        if (!deleteParticipant) return;

        setIsProcessing(true);
        try {
            const tripRef = doc(db, EntityKeys.tripsKey, tripId);

            // Rimuovi da entrambi gli array
            await updateDoc(tripRef, {
                participants: arrayRemove(deleteParticipant),
                participantIds: arrayRemove(deleteParticipant.uid)
            });
        } catch (error) {
            console.error("Errore nella rimozione del partecipante:", error);
        } finally {
            setIsProcessing(false);
            setDeleteParticipant(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Modale di Conferma Eliminazione */}
            <ConfirmationModal
                isOpen={!!deleteParticipant}
                onClose={() => setDeleteParticipant(null)}
                onConfirm={handleConfirmDelete}
                isLoading={isProcessing}
                title="Rimuovi partecipante"
                confirmText="Rimuovi"
                icon={<FaExclamationTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />}
            >
                <p>
                    Vuoi rimuovere <strong>{deleteParticipant?.displayName}</strong> dal viaggio?
                    Non potrà più visualizzare o modificare questo itinerario.
                </p>
            </ConfirmationModal>

            {/* Header Sezione */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    Membri
                </h3>
                {isOwner && !isAdding && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsAdding(true)}
                    >
                        <FaPlus className="mr-2" />
                        Invita
                    </Button>
                )}
            </div>

            {/* Area di Ricerca (Visibile solo quando si clicca "Invita") */}
            {isAdding && (
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in mb-6">

                    <UserSearch
                        onSelect={handleAddParticipant}
                        placeholder="Inserisci l'email dell'utente..."
                        excludeIds={[currentUserId || '', ...participants.map(p => p.uid)]}
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

            {/* Lista Partecipanti */}
            {participants.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {participants.map((participant) => (
                        <li key={participant.uid} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                {/* Avatar con Iniziali */}
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {participant.displayName
                                        ? participant.displayName.charAt(0).toUpperCase()
                                        : participant.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-white text-sm">
                                        {participant.displayName || 'Utente'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {participant.email}
                                    </p>
                                </div>
                            </div>

                            {/* Bottone Rimuovi (Solo per owner e non su se stesso) */}
                            {isOwner && participant.uid !== currentUserId && (
                                <button
                                    onClick={() => setDeleteParticipant(participant)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                    title="Rimuovi dal viaggio"
                                >
                                    <FaTrash size={14} />
                                </button>
                            )}

                            {/* Badge "Proprietario" se è l'utente corrente o l'owner */}
                            {participant.uid === currentUserId && (
                                <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full font-medium">
                                    Tu
                                </span>
                            )}
                        </li>
                    ))}
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