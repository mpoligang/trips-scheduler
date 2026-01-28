'use client';

import { ReactNode } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import Button from '@/components/actions/button';
import { ImSpinner8 } from 'react-icons/im';

interface DialogComponentProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onConfirm: () => void;
    readonly isLoading: boolean;
    readonly title: string;
    readonly children: ReactNode;
    readonly confirmText?: string;
    readonly cancelText?: string;
    readonly showCancelButton?: boolean;
    readonly fullScreen?: boolean; // ⭐️ Nuova prop
}

export default function DialogComponent({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    title,
    children,
    confirmText = 'Conferma',
    cancelText = 'Annulla',
    showCancelButton = true,
    fullScreen = false, // ⭐️ Default false
}: DialogComponentProps) {
    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 bg-[#000000c9] z-[9999] flex justify-center items-center ${fullScreen ? 'p-0' : 'p-6'}`}
        >

            <div className={`
                bg-gray-800 flex flex-col 
                ${fullScreen
                    ? 'w-full h-full rounded-none'
                    : 'w-full max-w-md max-h-[90vh] rounded-lg shadow-2xl'
                }
            `}>

                {/* Header: Titolo e Pulsante Chiudi */}
                <div className="flex justify-between items-start p-6 pb-2 mb-4 shrink-0">
                    <h2 className="text-2xl font-bold text-white pr-4">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-200 transition-colors p-1 cursor-pointer"
                        aria-label="Chiudi"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>


                <div className="px-6 py-2 text-gray-400 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>


                <div className="p-6 pt-4 mt-4 flex md:flex-row flex-col justify-end gap-4 border-t border-gray-700 mx-6 border-x-0 border-b-0 px-0 shrink-0">
                    {
                        showCancelButton && (
                            <Button size="md" variant="secondary" onClick={onClose} disabled={isLoading}>
                                {cancelText}
                            </Button>
                        )
                    }
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        size="md"
                    >
                        <ImSpinner8 className={`animate-spin mr-2 ${isLoading ? 'inline-block' : 'hidden'}`} />
                        <FaCheck size={12} className={`mr-2 ${!isLoading ? 'inline-block' : 'hidden'}`} />
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}