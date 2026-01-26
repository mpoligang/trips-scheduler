'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    readOnly?: boolean;
    required?: boolean;
    disabled?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, id, label, type = 'text', readOnly, required, ...props }, ref) => {
        // Se il componente è in modalità readOnly, mostra solo il testo
        if (readOnly) {
            return (
                <div className="w-full">
                    <label htmlFor={id} className="block text-sm font-medium text-gray-400 mb-1">
                        {label}
                    </label>
                    <p
                        id={id}
                        className={twMerge(
                            "w-full py-2 text-gray-200 ",
                            className
                        )}
                    >
                        {props.value || '-'} {/* Mostra un trattino se il valore è vuoto */}
                    </p>
                </div>
            );
        }

        // Altrimenti, mostra il campo di input normale
        return (
            <div className="w-full">
                <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                {/* Contenitore per creare l'effetto del bordo gradiente */}
                <div
                    className={twMerge(
                        'relative rounded-lg p-[1.5px] transition-all duration-300',
                        'bg-transparent focus-within:bg-gradient-to-br focus-within:from-purple-600 focus-within:to-indigo-700'
                    )}
                >
                    <input
                        maxLength={100}
                        type={type}
                        id={id}
                        ref={ref}
                        disabled={props.disabled}
                        className={twMerge(
                            'transition-all duration-150 ease-in-out w-full px-4 py-2 bg-gray-700 border-0 rounded-[7px]  text-gray-200 focus:outline-none',
                            className
                        )}
                        readOnly={readOnly}
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
