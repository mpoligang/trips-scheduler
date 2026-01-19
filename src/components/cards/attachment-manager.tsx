'use client';

import { useState, useRef, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { FaPaperclip, FaLink, FaFilePdf, FaImage, FaTimes, FaPlus, FaExternalLinkAlt, FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

import { storage } from '@/firebase/config';
import { Attachment } from '@/models/Attachment';
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import EmptyData from '@/components/cards/empty-data';
import DialogComponent from '@/components/modals/confirm-modal';
import PageTitle from '../generics/page-title';
import { useTrip } from '@/context/tripContext';

// --- COMPONENTE MODALE INTERNO PER AGGIUNTA ---
interface AddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { type: 'file' | 'link'; name: string; file?: File; url?: string }) => Promise<void>;
}

function AddAttachmentModal({ isOpen, onClose, onConfirm }: AddModalProps) {
    const [name, setName] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset stato quando si apre
    useEffect(() => {
        if (isOpen) {
            setName('');
            setLinkUrl('');
            setFile(null);
            setError(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Controllo dimensione (100KB = 100 * 1024 bytes)
            if (selectedFile.size > 100 * 1024) {
                setError("Il file supera il limite massimo di 100KB.");
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            setError(null);
            setFile(selectedFile);
            // Precompila il nome se vuoto
            if (!name) { setName(selectedFile.name); }
        }
    };

    const clearFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = () => {
        if (!name) {
            setError("Inserisci un nome per l'allegato.");
            return;
        }

        if (!file && !linkUrl) {
            setError("Seleziona un file o inserisci un link.");
            return;
        }

        const type = file ? 'file' : 'link';

        onConfirm({
            type,
            name,
            file: file || undefined,
            url: linkUrl || undefined
        });
    };

    if (!isOpen) return null;

    // Logica di esclusione
    const isFileSelected = !!file;
    const isLinkEntered = linkUrl.length > 0;

    return (

        <DialogComponent
            title="Aggiungi Allegato alla tappa"
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={() => handleSubmit()}
            confirmText="Aggiungi"
            cancelText="Annulla"
            isLoading={false}
        >

            <div className="space-y-6">
                {/* 1. Nome Allegato (Sempre attivo) */}
                <Input
                    id="attachment-name"
                    label="Nome Allegato"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Es. Biglietto Museo"
                />

                {/* 2. Sezione File */}
                <div className={`transition-opacity duration-200 ${isLinkEntered ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Carica File (Max 100KB)
                    </label>
                    {!file ? (
                        <div className="relative">
                            {/* Input nascosto */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*,application/pdf"
                                disabled={isLinkEntered}
                                className="hidden"
                            />
                            {/* Bottone di attivazione personalizzato */}
                            <Button
                                variant="secondary"
                                size={'sm'}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLinkEntered}
                                type="button"
                            >
                                <FaPaperclip className="mr-2" />
                                Scegli File
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-md border border-purple-100 dark:border-purple-800">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FaPaperclip className="" />
                                <span className="text-sm  truncate max-w-[200px]">{file.name}</span>
                            </div>
                            <button
                                onClick={clearFile}
                                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
                                title="Rimuovi file"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    )}
                    {file && <p className="text-xs text-green-600 mt-1">Dimensioni: {(file.size / 1024).toFixed(1)} KB</p>}
                </div>


                {/* Divisore "OPPURE" */}
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-medium">oppure</span>
                    <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                </div>

                {/* 3. Sezione Link */}
                <div className={`transition-opacity duration-200 ${isFileSelected ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <Input
                        id="attachment-link"
                        label="Link Esterno"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://..."
                        type="url"
                        disabled={isFileSelected} // Disabilita se c'è un file
                    />
                </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-4 bg-red-50 dark:bg-red-900/20 p-2 rounded text-center">{error}</p>}

        </DialogComponent>

    );
}


interface AttachmentsManagerProps {
    readonly pageTitle: string;
    readonly subtitle?: string;
    readonly attachments: Attachment[];
    readonly onAttachmentsChange: (attachments: Attachment[]) => void;
    readonly storagePath: string;
}

export default function AttachmentsManager({
    attachments,
    pageTitle,
    subtitle,
    onAttachmentsChange,
    storagePath,
}: AttachmentsManagerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { isOwner } = useTrip();

    const isReadOnly = !isOwner;

    const handleConfirmAdd = async (data: { type: 'file' | 'link'; name: string; file?: File; url?: string }) => {
        setIsProcessing(true);
        try {
            let finalUrl = data.url || '';

            if (data.type === 'file' && data.file) {
                const uniqueName = `${uuidv4()}_${data.file.name}`;
                const fileRef = ref(storage, `${storagePath}/${uniqueName}`);
                await uploadBytes(fileRef, data.file);
                finalUrl = await getDownloadURL(fileRef);
            } else if (data.type === 'link') {
                if (!/^https?:\/\//i.test(finalUrl)) {
                    finalUrl = 'https://' + finalUrl;
                }
            }

            const newAttachment: Attachment = {
                id: uuidv4(),
                name: data.name,
                url: finalUrl,
                type: data.type,
                createdAt: new Date().toISOString()
            };

            onAttachmentsChange([...attachments, newAttachment]);
            setIsModalOpen(false);

        } catch (error) {
            console.error("Errore aggiunta allegato:", error);
            alert("Errore durante il caricamento. Riprova.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const attachmentToDelete = attachments.find(a => a.id === deleteId);
        if (!attachmentToDelete) return;

        setIsProcessing(true);
        try {
            if (attachmentToDelete.type === 'file') {
                try {
                    const fileRef = ref(storage, attachmentToDelete.url);
                    await deleteObject(fileRef);
                } catch (e) {
                    console.warn("File non trovato su storage o già eliminato:", e);
                }
            }

            const updatedList = attachments.filter(a => a.id !== deleteId);
            onAttachmentsChange(updatedList);

        } catch (error) {
            console.error("Errore eliminazione:", error);
            alert("Impossibile eliminare l'allegato.");
        } finally {
            setIsProcessing(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-8 ">
            <PageTitle title={pageTitle} subtitle={subtitle} >
                {!isReadOnly && (
                    <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
                        <FaPlus className="mr-2" /> Aggiungi
                    </Button>
                )}

            </PageTitle>


            <AddAttachmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmAdd}
            />

            {deleteId && (
                <DialogComponent
                    isOpen={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    onConfirm={handleDelete}
                    isLoading={isProcessing}
                    title="Confermi l'eliminazione dell'allegato?"
                    confirmText="Elimina"
                    cancelText="Annulla"
                >
                    <p>Stai per eliminare questo allegato. Questa azione è irreversibile.</p>
                </DialogComponent>
            )}



            {attachments.length > 0 ? (
                <ul className="grid grid-cols-1 gap-3">
                    {attachments.map((att) => {
                        const isFile = att.type === 'file';
                        const isPdf = att.name.toLowerCase().endsWith('.pdf');

                        return (
                            <li key={att.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 flex-grow overflow-hidden group"
                                >
                                    <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg  dark:bg-opacity-20`}>
                                        {isFile ? (isPdf ? <FaFilePdf /> : <FaImage />) : <FaLink />}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate transition-colors">
                                            {att.name}
                                        </span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            {isFile ? 'Documento' : 'Collegamento esterno'} <FaExternalLinkAlt size={10} />
                                        </span>
                                    </div>
                                </a>

                                {!isReadOnly && (
                                    <button
                                        type="button"
                                        onClick={() => setDeleteId(att.id)}
                                        disabled={isProcessing}
                                        className="p-2 ml-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                        title="Elimina allegato"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <EmptyData
                    title="Nessun allegato"
                    subtitle={isReadOnly ? "Non ci sono allegati per questo elemento." : "Carica biglietti, prenotazioni o link utili."}
                />
            )}
        </div>
    );
}