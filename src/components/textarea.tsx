import { forwardRef, TextareaHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

// Definiamo le props, estendendo quelle di una textarea standard
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, label, id, ...props }, ref) => {
    return (
        <div className="w-full">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {label}
            </label>
            {/* Wrapper per l'effetto gradiente del bordo al focus */}
            <div className="relative rounded-lg p-[1.5px] bg-transparent focus-within:bg-gradient-to-br from-purple-600 to-indigo-700 transition-colors duration-300">
                <textarea
                    id={id}
                    ref={ref}
                    className={twMerge(
                        "w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border-0 rounded-md text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-0",
                        "min-h-[120px]", // Altezza minima di default
                        className
                    )}
                    {...props}
                />
            </div>
        </div>
    );
});

Textarea.displayName = 'Textarea';

export default Textarea;
