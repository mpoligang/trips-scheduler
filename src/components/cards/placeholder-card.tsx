
import { twMerge } from 'tailwind-merge';

interface PlaceholderCardProps {
    readonly description: string;
    readonly title?: string;
    readonly icon?: React.ElementType;
    readonly children?: React.ReactNode;
    readonly className?: string;
}

export default function PlaceholderCard({
    description,
    title = "Funzionalità in Sviluppo",
    icon: Icon,
    className,
    children
}: PlaceholderCardProps) {
    return (
        <div className={twMerge(
            "flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-800/50 rounded-lg border border-dashed border-gray-700 mt-6",
            className
        )}>
            {Icon && (
                <div className="mb-4">
                    <Icon className="w-12 h-12 mx-auto text-gray-500" />
                </div>
            )}

            <h3 className="text-lg font-semibold text-white mb-2">
                {title}
            </h3>

            <p className="text-gray-400 max-w-sm">
                {description}
            </p>
            {children}
        </div>
    );
}