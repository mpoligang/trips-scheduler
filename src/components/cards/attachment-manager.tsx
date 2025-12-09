'use client';

import { useState, useRef } from 'react';
// 1. Aggiunto deleteObject agli import
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { FaPaperclip, FaLink, FaFilePdf, FaImage, FaTimes, FaSpinner } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

import { storage, db } from '@/firebase/config';
import { Attachment, Stage } from '@/models/Stage';
import { Trip } from '@/models/Trip';
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import EmptyData from '@/components/cards/empty-data';
import { EntityKeys } from '@/utils/entityKeys';

interface AttachmentsManagerProps {
    readonly tripId: string;
    readonly stageId?: string;
    readonly attachments: Attachment[];
    readonly setAttachments: (attachments: Attachment[]) => void;
}

export default function AttachmentsManager({
    tripId,
    stageId,
    attachments,
    setAttachments,
}: AttachmentsManagerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    // Stato per gestire il caricamento durante la cancellazione
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Funzione per aggiornare l'allegato nel DB
    const updateStageAttachmentsInDb = async (updatedAttachments: Attachment[]) => {
        if (!stageId) { return; }

        try {
            const tripRef = doc(db, EntityKeys.tripsKey, tripId);
            const tripSnap = await getDoc(tripRef);

            if (tripSnap.exists()) {
                const tripData = tripSnap.data() as Trip;

                const updatedStages = tripData.stages?.map((s: Stage) => {
                    if (s.id === stageId) {
                        return { ...s, attachments: updatedAttachments };
                    }
                    return s;
                }) || [];

                await updateDoc(tripRef, { stages: updatedStages });
            }
        } catch (err) {
            console.error("Errore aggiornamento DB:", err);
            setError("Errore nel salvataggio su database.");
            throw err; // Rilanciamo l'errore per gestirlo nelle funzioni chiamanti
        }
    };

    // Gestione Upload File
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setIsUploading(true);
        setError(null);

        try {
            // 1. Carica su Storage
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

            // 2. Aggiorna stato locale
            const newAttachmentsList = [...attachments, newAttachment];
            setAttachments(newAttachmentsList);

            // 3. Aggiorna Database
            await updateStageAttachmentsInDb(newAttachmentsList);

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

        const newAttachmentsList = [...attachments, newAttachment];
        setAttachments(newAttachmentsList);
        await updateStageAttachmentsInDb(newAttachmentsList);

        setNewLinkUrl('');
        setIsAddingLink(false);
    };

    // --- NUOVA GESTIONE RIMOZIONE (Storage + DB) ---
    const handleRemoveAttachment = async (id: string) => {
        const attachmentToDelete = attachments.find(a => a.id === id);
        if (!attachmentToDelete) return;

        setIsDeletingId(id);
        setError(null);

        try {
            // 1. Se è un file, cancellalo dallo Storage
            if (attachmentToDelete.type === 'file') {
                try {
                    // Creiamo il riferimento direttamente dall'URL
                    const fileRef = ref(storage, attachmentToDelete.url);
                    await deleteObject(fileRef);
                } catch (error_: unknown) {
                    console.error("Errore cancellazione file storage:", error_);
                    throw new Error("Impossibile cancellare il file fisico.");
                }
            }

            // 2. Aggiorna stato locale (rimuovi dall'array)
            const newAttachmentsList = attachments.filter(a => a.id !== id);
            setAttachments(newAttachmentsList);

            // 3. Aggiorna Database
            await updateStageAttachmentsInDb(newAttachmentsList);

        } catch (err) {
            console.error("Errore rimozione allegato:", err);
            setError("Errore durante la rimozione dell'allegato.");
        } finally {
            setIsDeletingId(null);
        }
    };

    return (
        <div className="pt-2">
            {/* Lista Allegati Esistenti */}
            {attachments.length > 0 ? (
                <ul className="space-y-3 mb-4">
                    {attachments.map((att) => {
                        let icon;
                        if (att.type === 'file') {
                            icon = att.name.endsWith('.pdf') ? <FaFilePdf /> : <FaImage />;
                        } else {
                            icon = <FaLink />;
                        }

                        const isDeletingThis = isDeletingId === att.id;

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
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(att.id)}
                                    disabled={isDeletingThis || isUploading}
                                    className={`p-2 transition-colors ${isDeletingThis
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-400 hover:text-red-500'
                                        }`}
                                    aria-label="Rimuovi allegato"
                                >
                                    {isDeletingThis ? (
                                        <FaSpinner className="animate-spin" />
                                    ) : (
                                        <FaTimes />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <EmptyData title="Nessun allegato." subtitle='Aggiungi file o link utili per questa tappa.' />
            )}

            {/* Bottoni Azione */}
            <div className="flex flex-col gap-3 mt-4">
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
                        disabled={isUploading || isDeletingId !== null}
                    >
                        {isUploading ? <FaSpinner className="animate-spin mr-2" /> : <FaPaperclip className="mr-2" />}
                        {isUploading ? 'Caricamento...' : 'Carica File'}
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsAddingLink(!isAddingLink)}
                        disabled={isUploading || isDeletingId !== null}
                    >
                        <FaLink className="mr-2" />
                        Aggiungi Link
                    </Button>
                </div>

                {/* Input per nuovo Link */}
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
        </div>
    );
}