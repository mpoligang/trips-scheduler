import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface PageContainerProps {
    readonly children: ReactNode;
    readonly className?: string;
}

export default function PageContainer({ children, className }: PageContainerProps) {
    return (
        <main
            className={twMerge(
                "container mx-auto px-4 sm:px-6 lg:px-8 md:py-8 py-5",
                className
            )}
        >
            <div className='w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg md:p-8 p-4'>
                {children}
            </div>
        </main>
    );
}