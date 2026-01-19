'use client';

import { useState } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { TripParticipant } from '@/models/Trip';
import { EntityKeys } from '@/utils/entityKeys'; // Assumo tu abbia questo file di utilità, altrimenti usa stringa 'trips'
import Button from '../actions/button';
import DialogComponent from '../modals/confirm-modal';
import UserSearch from '../inputs/user-search';
import EmptyData from '../cards/empty-data';
import { useTrip } from '@/context/tripContext';
import { useAuth } from '@/context/authProvider';
import PageTitle from '../generics/page-title';


export default function ParticipantsList() {

    const { trip, isOwner } = useTrip();
    const { user } = useAuth();
    const currentUserId = user?.uid || '';

    const [isAdding, setIsAdding] = useState(false);
    const [deleteParticipant, setDeleteParticipant] = useState<TripParticipant | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Gestione Aggiunta Partecipante
    const handleAddParticipant = async (userToAdd: any) => {
        if (!userToAdd || isProcessing) return;

        // Evita duplicati
        if (trip?.participants?.some(p => p.uid === userToAdd.uid)) {
            alert("Questo utente è già partecipante del viaggio.");
            return;
        }

        setIsProcessing(true);
        try {
            const newParticipant: TripParticipant = {
                uid: userToAdd.uid,
                email: userToAdd.email,
                displayName: userToAdd.firstName ? `${userToAdd.firstName} ${userToAdd.lastName || ''}` :
                    userToAdd.email.split('@')[0]
            };

            const tripRef = doc(db, EntityKeys.tripsKey, trip?.id as string);

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
            const tripRef = doc(db, EntityKeys.tripsKey, trip?.id as string);

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
            <DialogComponent
                isOpen={!!deleteParticipant}
                onClose={() => setDeleteParticipant(null)}
                onConfirm={handleConfirmDelete}
                isLoading={isProcessing}
                title="Rimuovi partecipante"
                confirmText="Rimuovi"
            >
                <p>
                    Vuoi rimuovere <strong>{deleteParticipant?.displayName}</strong> dal viaggio?
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

            {/* Area di Ricerca (Visibile solo quando si clicca "Invita") */}
            {isAdding && (
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in mb-6">

                    <UserSearch
                        onSelect={handleAddParticipant}
                        placeholder="Inserisci l'email dell'utente..."
                        excludeIds={[currentUserId || '', ...(trip?.participants ? trip.participants.map(p => p.uid) : [])]}
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
            {trip?.participants && trip.participants.length > 0 ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {trip.participants.map((participant) => (
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