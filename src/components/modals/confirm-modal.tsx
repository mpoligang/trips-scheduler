'use client';

import { ReactNode } from 'react';
import { FaTimes } from 'react-icons/fa';
import Button from '@/components/actions/button';

interface DialogComponentProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onConfirm: () => void;
    readonly isLoading: boolean;
    readonly title: string;
    readonly children: ReactNode;
    readonly confirmText?: string;
    readonly cancelText?: string;
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
}: DialogComponentProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[#000000c9] z-[9999] flex justify-center items-center p-6">
            {/* Container principale con altezza massima e flex-col per gestire lo scroll */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

                {/* Header: Titolo e Pulsante Chiudi */}
                <div className="flex justify-between items-start p-6 pb-2">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white pr-4">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 cursor-pointer"
                        aria-label="Chiudi"
                    >
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Contenuto: Scrollabile se troppo lungo */}
                <div className="px-6 py-2 text-gray-600 dark:text-gray-400 overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Footer: Bottoni */}
                <div className="p-6 pt-4 mt-4 flex md:flex-row flex-col justify-end gap-4 border-t border-gray-100 dark:border-gray-700 mx-6 border-x-0 border-b-0 px-0">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Caricamento...' : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}