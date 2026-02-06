'use client';

import { ReactNode, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly position?: 'left' | 'right';
    readonly title?: string;
    readonly subtitle?: string;
    readonly headerActions?: ReactNode; // Per bottoni extra nell'header (es. "Salva", "Indicazioni")
    readonly children: ReactNode;
    readonly className?: string; // Classi extra per il contenitore principale
}

export default function Sidebar(props: Readonly<SidebarProps>) {
    const {
        isOpen,
        onClose,
        position = 'right',
        title,
        subtitle,
        headerActions,
        children,
        className
    } = props;

    // Chiude la sidebar se si preme ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) { globalThis.addEventListener('keydown', handleEsc); }
        return () => { globalThis.removeEventListener('keydown', handleEsc); }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const positionClasses = position === 'right' ? 'justify-end' : 'justify-start';
    const animationClasses = position === 'right' ? 'animate-in slide-in-from-right' : 'animate-in slide-in-from-left';

    return (
        <div className={`fixed inset-0 z-[10000] flex ${positionClasses}`}>
            {/* Backdrop (Sfondo scuro) */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer (Pannello Laterale) */}
            <dialog
                className={twMerge(
                    `relative w-full max-w-lg h-full bg-gray-900 shadow-2xl flex flex-col duration-300 ${animationClasses}`,
                    className
                )}
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900 z-10 flex-shrink-0">
                    <div className="flex-1 min-w-0 pr-4">
                        {title && <h3 className="text-lg font-bold text-white truncate">{title}</h3>}
                        {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {headerActions}
                        <button
                            onClick={onClose}
                            className="p-2   text-gray-400 hover:text-gray-200 rounded-full hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                            aria-label="Chiudi sidebar"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 relative w-full h-full overflow-y-auto ">
                    {children}
                </div>
            </dialog>
        </div>
    );
}