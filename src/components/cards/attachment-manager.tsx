'use client';

import { useState, useRef, useEffect } from 'react';
import { FaPaperclip, FaLink, FaFilePdf, FaImage, FaTimes, FaPlus, FaTrash, FaDownload } from 'react-icons/fa';
import { createClient } from '@/lib/client';

import { Attachment } from '@/models/Attachment';
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import EmptyData from '@/components/cards/empty-data';
import DialogComponent from '@/components/modals/confirm-modal';
import PageTitle from '../generics/page-title';
import { useTrip } from '@/context/tripContext';
import { mbToBytes, bytesToMb } from '@/utils/fileSizeUtils';
import { useAuth } from '@/context/authProvider';
import { sendEmailToUpgrade } from '@/utils/openMailer';
import ContextMenu from '../actions/context-menu';
import { downloadAttachment, getFileUrl } from '@/actions/files-actions';
import Image from 'next/image';

// --- MODALE AGGIUNTA ALLEGATO ---
interface AddModalProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onConfirm: (data: { type: 'file' | 'link'; name: string; file?: File; url?: string }) => Promise<void>;
    readonly maxFileSizeMb: number;
    readonly isLoading: boolean;
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
            if (!name) { setName(selectedFile.name); }
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
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                        File (Immagini o PDF - Max {maxFileSizeMb}MB)
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
                        <div className="flex items-center justify-between p-2 bg-blue-900/20 rounded border border-blue-800">
                            <span className="text-sm truncate pr-2">{file.name}</span>
                            <button onClick={() => setFile(null)} disabled={isLoading} className="text-gray-500 hover:text-red-500">
                                <FaTimes />
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <span className="mx-2 text-xs text-gray-400 font-bold uppercase">oppure</span>
                    <div className="flex-grow border-t border-gray-700"></div>
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

                {error && <p className="text-red-500 text-xs mt-2 bg-red-900/20 p-2 rounded">{error}</p>}
            </div>
        </DialogComponent>
    );
}

// --- COMPONENTE PRINCIPALE ---
interface AttachmentsManagerProps {
    readonly pageTitle: string;
    readonly subtitle?: string;
    readonly attachments: Attachment[];
    readonly relatedId: string;
    readonly type: 'stage' | 'accommodation' | 'transport';
}

export default function AttachmentsManager({
    attachments, pageTitle, subtitle, relatedId, type
}: AttachmentsManagerProps) {
    const supabase = createClient();
    const { user, userData, refreshUserData } = useAuth();
    const { isOwner, refreshData, trip } = useTrip();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [limitError, setLimitError] = useState<{ title: string; message: string } | null>(null);

    const isReadOnly = !isOwner;

    const handleConfirmAdd = async (data: { type: 'file' | 'link'; name: string; file?: File; url?: string }) => {
        setIsProcessing(true);
        try {
            let finalUrl = data.url || '';
            let storagePath = null;
            let fileSize = 0;

            if (data.type === 'file' && data.file) {
                fileSize = data.file.size;

                const currentUsed = userData?.total_storage_used_in_bytes || 0;
                const limitBytes = userData?.plan?.storage_limit_bytes || 0;
                const planName = userData?.plan?.name || 'Free';
                const limitMb = bytesToMb(limitBytes);

                // 1. UX CHECK (Messaggio originale ripristinato)
                if (currentUsed + fileSize > limitBytes) {
                    setIsProcessing(false);
                    setIsModalOpen(false);
                    setLimitError({
                        title: "Limite di archiviazione raggiunto",
                        message: `Il tuo piano ${planName} permette massimo ${limitMb}MB. Libera spazio o contatta il supporto per passare a un piano superiore.`
                    });
                    return;
                }

                // Generazione Path sicuro
                const fileExt = data.file.name.split('.').pop();
                storagePath = `${trip?.id as string}/${crypto.randomUUID()}.${fileExt}`;

                // 2. UPLOAD SU STORAGE
                const { error: uploadError } = await supabase.storage.from('attachments').upload(storagePath, data.file);

                if (uploadError) {
                    if (uploadError.message.includes("violates row-level security policy")) {
                        setIsModalOpen(false);
                        setLimitError({
                            title: "Limite di archiviazione raggiunto",
                            message: `Il tuo piano ${planName} permette massimo ${limitMb}MB. Libera spazio o contatta il supporto per passare a un piano superiore.`
                        });
                        return;
                    }
                    throw uploadError;
                }

                const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(storagePath);
                finalUrl = urlData.publicUrl;
            } else if (data.type === 'link' && finalUrl) {
                if (!/^https?:\/\//i.test(finalUrl)) {
                    finalUrl = 'https://' + finalUrl;
                }
            }

            // 3. INSERIMENTO RECORD DB
            const { error: dbError } = await supabase.from('attachments').insert({
                trip_id: trip?.id as string,
                name: data.name,
                url: finalUrl,
                storage_path: storagePath,
                file_type: data.type,
                size_in_bytes: fileSize,
                stage_id: type === 'stage' ? relatedId : null,
                accommodation_id: type === 'accommodation' ? relatedId : null,
                transport_id: type === 'transport' ? relatedId : null,
            });

            if (dbError) throw dbError;

            await refreshData(true);
            await refreshUserData();
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
            if (att.storage_path) {
                await supabase.storage.from('attachments').remove([att.storage_path]);
            }
            await supabase.from('attachments').delete().eq('id', deleteId);
            await refreshData(true);
            await refreshUserData();
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
                {!isReadOnly && relatedId !== 'new' && (
                    <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
                        <FaPlus className="mr-2" /> Aggiungi
                    </Button>
                )}
            </PageTitle>

            {/* MODALE DI ERRORE ORIGINALE */}
            <DialogComponent
                isOpen={!!limitError}
                onClose={() => setLimitError(null)}
                onConfirm={() => sendEmailToUpgrade(`${userData?.first_name} ${userData?.last_name}`, `${user?.email || ''}`)}
                title={limitError?.title || ''}
                isLoading={false}
                confirmText="Contattaci"
            >
                <p className="text-gray-400">{limitError?.message}</p>
            </DialogComponent>

            <AddAttachmentModal
                isOpen={isModalOpen}
                onClose={() => !isProcessing && setIsModalOpen(false)}
                onConfirm={handleConfirmAdd}
                maxFileSizeMb={userData?.plan?.max_file_size_bytes ? bytesToMb(userData.plan.max_file_size_bytes) : 2}
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
                    <p>L&apos;azione è irreversibile. Lo spazio verrà liberato automaticamente dal tuo account.</p>
                </DialogComponent>
            )}

            <AttachmentList
                attachments={attachments}
                setDeleteId={setDeleteId}
                isReadOnly={isReadOnly}
                isProcessing={isProcessing}
            />


        </div>
    );
}


export const AttachmentList = ({ attachments, setDeleteId = () => { }, isReadOnly, isProcessing = false }: {
    attachments: Attachment[],
    setDeleteId?: (id: string | null) => void,
    isReadOnly: boolean,
    isProcessing?: boolean
}) => {

    const handleDownload = async (attachmentPath: string, fileName: string) => {
        const url = await downloadAttachment(attachmentPath, fileName);
        if (url) {
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
        }
    };

    const handleOpenImage = async (attachmentPath: string) => {
        const newWindow = window.open('', '_blank');

        const url = await getFileUrl(attachmentPath);
        if (url) {
            if (newWindow) {
                newWindow.location.href = url;
            }
        }


    };

    return (
        <>
            {attachments.length > 0 ? (
                <ul className="grid grid-cols-1 gap-3">
                    {attachments.map((att) => (
                        <li onClick={() => handleOpenImage(att.storage_path as string)} key={att.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <a className="flex items-center gap-3 flex-grow overflow-hidden group">
                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-gray-700/50">
                                    {att.file_type === 'file' ? (att.name.toLowerCase().endsWith('.pdf') ? <FaFilePdf className="text-red-500" /> : <FaImage className="text-blue-500" />) : <FaLink className="text-green-500" />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-gray-200 ">{att.name}</span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        {att.file_type === 'file' ? `Documento (${att.size_in_bytes ? bytesToMb(att.size_in_bytes).toFixed(2) : '0'} MB)` : 'Link esterno'}
                                    </span>
                                </div>
                            </a>
                            {!isReadOnly ? (
                                <ContextMenu
                                    items={[
                                        {
                                            label: 'Scarica',
                                            icon: <FaDownload />,
                                            onClick: async (e: MouseEvent | undefined) => {
                                                handleDownload(att.storage_path as string, att.name);
                                            }
                                        },
                                        {
                                            label: 'Elimina',
                                            icon: <FaTrash />,
                                            onClick: () => setDeleteId(att.id)
                                        },
                                    ]}
                                />
                            ) : (
                                <button
                                    onClick={() => handleDownload(att.storage_path as string, att.name)}
                                    className="p-2 cursor-pointer ml-2 text-gray-400 hover:text-white  hover:bg-gradient-to-br hover:from-purple-600 hover:to-indigo-700 rounded-full transition-all"
                                    title="Scarica allegato"
                                >
                                    <FaDownload />
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
        </>
    )
}