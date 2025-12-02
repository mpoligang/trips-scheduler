import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface PageTitleProps {
    readonly title: string;
    readonly subtitle?: string;
    readonly children?: ReactNode;
    readonly className?: string; // Nuova prop opzionale
}

export default function PageTitle({ title, subtitle, children, className }: PageTitleProps) {
    return (
        <div className={twMerge("flex flex-row justify-between items-start mb-8 gap-4", className)}>
            <div className="w-full">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
                {subtitle && <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}