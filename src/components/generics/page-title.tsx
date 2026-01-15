import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface PageTitleProps {
    readonly title?: string;
    readonly subtitle?: string;
    readonly children?: ReactNode;
    readonly className?: string;
}

export default function PageTitle({ title, subtitle, children, className }: PageTitleProps) {
    return (
        <div className={twMerge("flex flex-row justify-between items-start mb-5 gap-4 border-b border-gray-200 dark:border-gray-700 pb-5", className)}>
            <div className="w-full">
                {title && <h1 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h1>}
                {subtitle && <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
            </div>
            {children}
        </div>
    );
}