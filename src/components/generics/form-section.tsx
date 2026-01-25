import React, { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface FormSectionProps {
    readonly title?: string;
    readonly children: ReactNode;
    readonly className?: string;
}

/**
 * Componente per i titoli delle sezioni dei form.
 * Aggiunge un underline decorativo con il gradiente Purple-Indigo richiesto.
 */
export default function FormSection({ title, children, className }: FormSectionProps) {
    return (
        <div className={twMerge("border-b border-gray-50 dark:border-gray-700", className)}>
            <h4 className=" font-bold text-gray-800 dark:text-white tracking-tight">
                {title}
            </h4>

            <div className="mt-1.5 h-1 w-20 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full shadow-sm shadow-purple-500/20" />
            <div className="my-5">
                {children}
            </div>
        </div>
    );
}