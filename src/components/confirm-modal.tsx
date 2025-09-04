import { ReactNode } from 'react';
import Button from '@/components/button';

// Definiamo le props per rendere il modale flessibile
interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    title: string;
    children: ReactNode;
    confirmText?: string;
    cancelText?: string;
    icon?: ReactNode;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    title,
    children,
    confirmText = 'Conferma',
    cancelText = 'Annulla',
    icon,
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md p-8 text-center">
                {/* L'icona viene mostrata solo se fornita */}
                {icon && (
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-900/50">
                        {icon}
                    </div>
                )}
                <h2 className="mt-4 text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
                <div className="mt-2 text-gray-600 dark:text-gray-400">
                    {children}
                </div>
                <div className="mt-8 flex justify-center gap-4">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        variant="secondary"
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
