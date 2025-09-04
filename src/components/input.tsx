'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, id, label, type = 'text', ...props }, ref) => {
        return (
            <div className="w-full">
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
                {/* Contenitore per creare l'effetto del bordo gradiente */}
                <div
                    className={twMerge(
                        'relative rounded-lg p-[1.5px] transition-all duration-300',
                        'bg-transparent focus-within:bg-gradient-to-br focus-within:from-purple-600 focus-within:to-indigo-700'
                    )}
                >
                    <input
                        type={type}
                        id={id}
                        ref={ref}
                        // Uniamo le classi base con quelle passate tramite props
                        className={twMerge(
                            'transition-all duration-150 ease-in-out w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border-0 rounded-[7px] text-gray-800 dark:text-gray-200 focus:outline-none',
                            className
                        )}
                        {...props}
                    />
                </div>
            </div>
        );
    }
);

// Assegnamo un nome al componente per il debugging
Input.displayName = 'Input';

export default Input;
