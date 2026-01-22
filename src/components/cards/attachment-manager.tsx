'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { FaPaperclip, FaLink, FaFilePdf, FaImage, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

import { storage, db } from '@/firebase/config';
import { Attachment } from '@/models/Attachment';
import { EntityKeys } from '@/utils/entityKeys';
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import EmptyData from '@/components/cards/empty-data';
import DialogComponent from '@/components/modals/confirm-modal';
import PageTitle from '../generics/page-title';
import { useTrip } from '@/context/tripContext';
import { getActivePlan, mbToBytes } from '@/utils/planUtils';
import { useAuth } from '@/context/authProvider';
import { sendEmailToUpgrade } from '@/utils/openMailer';

// --- MODALE AGGIUNTA ALLEGATO ---
interface AddModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onConfirm: (data: { type: 'file' | 'link'; name: string; file?: File; url?: string }) => Promise<void>;
    readonly maxFileSizeMb: number;
    readonly isLoading: boolean; // Aggiunto per gestire lo stato di caricamento
}

function AddAttachmentModal({ isOpen, onClose, onConfirm, maxFileSizeMb, isLoading }: AddModalProps) {
    const [name, setName] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setLinkUrl('');
            setFile(null);
            setError(null);
        }
    }, [isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const limitInBytes = mbToBytes(maxFileSizeMb);
            if (selectedFile.size > limitInBytes) {
                setError(`Il file supera il limite del tuo piano (${maxFileSizeMb}MB).`);
                setFile(null);
                return;
            }
            setError(null);
            setFile(selectedFile);
            if (!name) setName(selectedFile.name);
        }
    };

    const handleSubmit = () => {
        if (!name) { return setError("Inserisci un nome."); }
        if (!file && !linkUrl) { return setError("Seleziona un file o un link."); }
        onConfirm({ type: file ? 'file' : 'link', name, file: file || undefined, url: linkUrl || undefined });
    };

    return (
        <DialogComponent
            title="Aggiungi Allegato"
            isOpen={isOpen}
            isLoading={isLoading}
            onClose={onClose}
            onConfirm={handleSubmit}
            confirmText="Aggiungi"
        >
            <div className={`space-y-4 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Input
                    label="Nome Allegato"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    id='attachment-name'
                    disabled={isLoading}
                />

                <div className={`${linkUrl ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        File (Max {maxFileSizeMb}MB)
                    </label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,application/pdf"
                        disabled={isLoading}
                    />
                    {!file ? (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                        >
                            <FaPaperclip className="mr-2" /> Scegli File
                        </Button>
                    ) : (
                        <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                            <span className="text-sm truncate pr-2">{file.name}</span>
                            <button onClick={() => setFile(null)} disabled={isLoading} className="text-gray-500 hover:text-red-500">
                                <FaTimes />
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                    <span className="mx-2 text-xs text-gray-400 font-bold uppercase">oppure</span>
                    <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                </div>

                <div className={`${file ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Input
                        id='attachment-link'
                        label="Link Esterno"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://..."
                        disabled={isLoading}
                    />
                </div>

                {error && <p className="text-red-500 text-xs mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}
            </div>
        </DialogComponent>
    );
}

// --- COMPONENTE PRINCIPALE ---
interface AttachmentsManagerProps {
    readonly pageTitle: string;
    readonly subtitle?: string;
    readonly attachments: Attachment[];
    readonly onAttachmentsChange: (attachments: Attachment[]) => void;
    readonly storagePath: string;
}

export default function AttachmentsManager({
    attachments, pageTitle, subtitle, onAttachmentsChange, storagePath,
}: AttachmentsManagerProps) {
    const { userData } = useAuth();
    const { isOwner } = useTrip();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [limitError, setLimitError] = useState<{ title: string; message: string } | null>(null);

    const planConfig = useMemo(() => getActivePlan(userData), [userData]);
    const isReadOnly = !isOwner;

    const updateUserStorage = async (bytes: number) => {
        if (!userData?.uid) return;
        const userRef = doc(db, EntityKeys.usersKey, userData.uid);
        await updateDoc(userRef, {
            totalStorageUsedInBytes: increment(bytes)
        });
    };

    const handleConfirmAdd = async (data: { type: 'file' | 'link'; name: string; file?: File; url?: string }) => {
        setIsProcessing(true);
        try {
            let finalUrl = data.url || '';
            let fileSize = 0;

            if (data.type === 'file' && data.file) {
                fileSize = data.file.size;
                const currentUsed = userData?.totalStorageUsedInBytes || 0;
                const limitBytes = mbToBytes(planConfig.totalStorageLimitMb);

                if (currentUsed + fileSize > limitBytes) {
                    setIsProcessing(false);
                    setIsModalOpen(false);
                    setLimitError({
                        title: "Limite di archiviazione raggiunto",
                        message: `Il tuo piano ${planConfig.name} permette massimo ${planConfig.totalStorageLimitMb}MB. Libera spazio o contatta il supporto per passare a un piano superiore.`
                    });
                    return;
                }

                const uniqueName = `${uuidv4()}_${data.file.name}`;
                const fileRef = ref(storage, `${storagePath}/${uniqueName}`);
                await uploadBytes(fileRef, data.file);
                finalUrl = await getDownloadURL(fileRef);

                await updateUserStorage(fileSize);
            } else if (data.type === 'link' && finalUrl) {
                if (!/^https?:\/\//i.test(finalUrl)) {
                    finalUrl = 'https://' + finalUrl;
                }
            }

            const newAttachment: Attachment = {
                id: uuidv4(),
                name: data.name,
                url: finalUrl,
                type: data.type,
                sizeInBytes: fileSize,
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
        const att = attachments.find(a => a.id === deleteId);
        if (!att) return;

        setIsProcessing(true);
        try {
            if (att.type === 'file') {
                const fileRef = ref(storage, att.url);
                await deleteObject(fileRef);
                if (att.sizeInBytes) {
                    await updateUserStorage(-att.sizeInBytes);
                }
            }
            onAttachmentsChange(attachments.filter(a => a.id !== deleteId));
        } catch (error) {
            console.error("Errore eliminazione:", error);
        } finally {
            setIsProcessing(false);
            setDeleteId(null);
        }
    };



    return (
        <div className="space-y-8">
            <PageTitle title={pageTitle} subtitle={subtitle}>
                {!isReadOnly && (
                    <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
                        <FaPlus className="mr-2" /> Aggiungi
                    </Button>
                )}
            </PageTitle>

            <DialogComponent
                isOpen={!!limitError}
                onClose={() => setLimitError(null)}
                onConfirm={() => sendEmailToUpgrade(`${userData?.firstName} ${userData?.lastName}`, `${userData?.email || ''}`)}
                title={limitError?.title || ''}
                isLoading={false}
                confirmText="Contattaci"
            >
                <p className="text-gray-600 dark:text-gray-400">{limitError?.message}</p>
            </DialogComponent>

            <AddAttachmentModal
                isOpen={isModalOpen}
                onClose={() => !isProcessing && setIsModalOpen(false)}
                onConfirm={handleConfirmAdd}
                maxFileSizeMb={planConfig.maxFileSizeInMb}
                isLoading={isProcessing}
            />

            {deleteId && (
                <DialogComponent
                    isOpen={!!deleteId}
                    onClose={() => setDeleteId(null)}
                    onConfirm={handleDelete}
                    isLoading={isProcessing}
                    title="Elimina allegato?"
                    confirmText="Elimina"
                    cancelText="Annulla"
                >
                    <p>L&apos;azione è irreversibile e lo spazio verrà liberato dal tuo account.</p>
                </DialogComponent>
            )}

            {attachments.length > 0 ? (
                <ul className="grid grid-cols-1 gap-3">
                    {attachments.map((att) => (
                        <li key={att.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 flex-grow overflow-hidden group">
                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    {att.type === 'file' ? (att.name.toLowerCase().endsWith('.pdf') ? <FaFilePdf className="text-red-500" /> : <FaImage className="text-blue-500" />) : <FaLink className="text-green-500" />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{att.name}</span>
                                    <span className="text-xs text-gray-500">
                                        {att.type === 'file' ? `Documento (${att.sizeInBytes ? (att.sizeInBytes / 1024 / 1024).toFixed(2) : '0'} MB)` : 'Link esterno'}
                                    </span>
                                </div>
                            </a>
                            {!isReadOnly && (
                                <button
                                    onClick={() => setDeleteId(att.id)}
                                    disabled={isProcessing}
                                    className="p-2 ml-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
                                    title="Elimina allegato"
                                >
                                    <FaTrash />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyData
                    title="Nessun allegato"
                    subtitle={isReadOnly ? "Non ci sono allegati." : "Carica file o link utili."}
                />
            )}
        </div>
    );
}