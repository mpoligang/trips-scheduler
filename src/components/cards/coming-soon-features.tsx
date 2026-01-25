
import { twMerge } from 'tailwind-merge';

interface ComingSoonFeatureProps {
    readonly description: string;
    readonly title?: string;
    readonly icon?: React.ElementType;
    readonly className?: string;
}

export default function ComingSoonFeature({
    description,
    title = "Funzionalità in Sviluppo",
    icon: Icon,
    className
}: ComingSoonFeatureProps) {
    return (
        <div className={twMerge(
            "flex flex-col items-center justify-center py-16 px-6 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 mt-6",
            className
        )}>
            {Icon && (
                <div className="mb-4">
                    <Icon className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500" />
                </div>
            )}

            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                {title}
            </h3>

            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                {description}
            </p>
        </div>
    );
}