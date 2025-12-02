'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FaPaperclip, FaLink, FaFilePdf, FaImage, FaTimes, FaSpinner } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

import { storage, db } from '@/firebase/config';
import { Attachment, Stage } from '@/models/Stage';
import { Trip } from '@/models/Trip';
import EmptyData from './empty-data';
import Button from '../actions/button';
import Input from '../inputs/input';


interface AttachmentsManagerProps {
    readonly tripId: string;
    readonly stageId?: string; // Necessario per salvare su DB
    readonly attachments: Attachment[];
    readonly setAttachments: (attachments: Attachment[]) => void;
    readonly readOnly: boolean;
}

export default function AttachmentsManager({
    tripId,
    stageId,
    attachments,
    setAttachments,
    readOnly
}: AttachmentsManagerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Funzione helper per salvare su Firestore
    const persistAttachmentToDb = async (newAttachment: Attachment) => {
        // Se siamo in creazione (stageId non esiste ancora), non possiamo salvare su DB ora.
        // Il salvataggio avverrà quando l'utente clicca su "Salva" nel form principale.
        if (!stageId) return;

        try {
            const tripRef = doc(db, 'trips', tripId);
            const tripSnap = await getDoc(tripRef);

            if (tripSnap.exists()) {
                const tripData = tripSnap.data() as Trip;
                // Trova la tappa corretta e aggiungi l'allegato
                const updatedStages = tripData.stages?.map((s: Stage) => {
                    if (s.id === stageId) {
                        const currentAttachments = s.attachments || [];
                        return { ...s, attachments: [...currentAttachments, newAttachment] };
                    }
                    return s;
                }) || [];

                await updateDoc(tripRef, { stages: updatedStages });
            }
        } catch (err) {
            console.error("Errore salvataggio allegato su DB:", err);
            // Non mostriamo errore all'utente qui per non interrompere il flusso, 
            // l'allegato è comunque nello stato locale.
        }
    };

    // Funzione helper per rimuovere da Firestore
    const removeAttachmentFromDb = async (attachmentId: string) => {
        if (!stageId) return;

        try {
            const tripRef = doc(db, 'trips', tripId);
            const tripSnap = await getDoc(tripRef);

            if (tripSnap.exists()) {
                const tripData = tripSnap.data() as Trip;
                const updatedStages = tripData.stages?.map((s: Stage) => {
                    if (s.id === stageId) {
                        return {
                            ...s,
                            attachments: s.attachments?.filter(a => a.id !== attachmentId) || []
                        };
                    }
                    return s;
                }) || [];

                await updateDoc(tripRef, { stages: updatedStages });
            }
        } catch (err) {
            console.error("Errore rimozione allegato da DB:", err);
        }
    };

    // Gestione Upload File
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setIsUploading(true);
        setError(null);

        try {
            const fileRef = ref(storage, `trips/${tripId}/attachments/${uuidv4()}_${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);

            const newAttachment: Attachment = {
                id: uuidv4(),
                name: file.name,
                url: url,
                type: 'file',
                createdAt: new Date().toISOString()
            };

            setAttachments([...attachments, newAttachment]);
            await persistAttachmentToDb(newAttachment); // Salva subito su DB

        } catch (err) {
            console.error("Errore upload:", err);
            setError("Errore durante il caricamento del file.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Gestione Aggiunta Link
    const handleAddLink = async () => {
        if (!newLinkUrl) return;

        let validUrl = newLinkUrl;
        if (!/^https?:\/\//i.test(validUrl)) {
            validUrl = 'https://' + validUrl;
        }

        const newAttachment: Attachment = {
            id: uuidv4(),
            name: newLinkUrl,
            url: validUrl,
            type: 'link',
            createdAt: new Date().toISOString()
        };

        setAttachments([...attachments, newAttachment]);
        await persistAttachmentToDb(newAttachment); // Salva subito su DB

        setNewLinkUrl('');
        setIsAddingLink(false);
    };

    // Rimozione Allegato
    const handleRemoveAttachment = async (id: string) => {
        setAttachments(attachments.filter(a => a.id !== id));
        await removeAttachmentFromDb(id); // Rimuove subito da DB
    };

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Allegati e Biglietti</h3>

            {attachments.length > 0 && (
                <ul className="space-y-3 mb-4">
                    {attachments.map((att) => {
                        let icon;
                        if (att.type === 'file') {
                            icon = att.name.endsWith('.pdf') ? <FaFilePdf /> : <FaImage />;
                        } else {
                            icon = <FaLink />;
                        }
                        return (
                            <li key={att.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 flex-grow overflow-hidden group">
                                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full">
                                        {icon}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-purple-600 transition-colors">
                                        {att.name}
                                    </span>
                                </a>
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAttachment(att.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        aria-label="Rimuovi allegato"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {attachments.length === 0 && readOnly && (
                <EmptyData title="Nessun allegato caricato." subtitle='Aggiungi un allegato per iniziare.' />
            )}

            {!readOnly && (
                <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileUpload}
                            accept="image/*,application/pdf"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? <FaSpinner className="animate-spin mr-2" /> : <FaPaperclip className="mr-2" />}
                            {isUploading ? 'Caricamento...' : 'Carica File'}
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsAddingLink(!isAddingLink)}
                        >
                            <FaLink className="mr-2" />
                            Aggiungi Link
                        </Button>
                    </div>

                    {isAddingLink && (
                        <div className="flex gap-2 items-end animate-fade-in">
                            <Input
                                id="new-link"
                                label=""
                                placeholder="https://..."
                                value={newLinkUrl}
                                onChange={(e) => setNewLinkUrl(e.target.value)}
                                className="flex-grow"
                            />
                            <Button type="button" variant="secondary" className='h-10' size="sm" onClick={handleAddLink} disabled={!newLinkUrl}>
                                OK
                            </Button>
                        </div>
                    )}

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
            )}
        </div>
    );
}