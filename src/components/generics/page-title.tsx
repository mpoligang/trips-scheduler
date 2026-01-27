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
        <div className={twMerge("flex flex-col mb-5  border-b border-gray-700 pb-5", className)}>
            <div className="w-full flex flex-row justify-between items-center">
                {title && <h1 className="text-xl font-bold text-white mb-0">{title}</h1>}
                {children}
            </div>
            {subtitle && <p className="text-gray-400 mt-4">{subtitle}</p>}
        </div>
    );
}