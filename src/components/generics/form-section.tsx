import React, { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface FormSectionProps {
    readonly title?: string;
    readonly children: ReactNode;
    readonly className?: string;
}

export default function FormSection({ title, children, className }: FormSectionProps) {
    return (
        <div className={twMerge("border-b border-gray-700", className)}>
            {/* Contenitore con larghezza dinamica basata sul contenuto */}
            <div className="inline-block">
                <h4 className="font-bold text-white tracking-tight">
                    {title}
                </h4>
                {/* La linea ora ha w-full per riempire il contenitore inline-block */}
                <div className="mt-1.5 h-1 w-full bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full shadow-sm shadow-purple-500/20" />
            </div>

            <div className="my-5">
                {children}
            </div>
        </div>
    );
}