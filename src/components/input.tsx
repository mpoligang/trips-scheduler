'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

// Definiamo le props del componente, estendendo quelle native dell'input
// Aggiungiamo 'label' e rendiamo 'id' obbligatorio per l'accessibilità
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
}

/**
 * Un componente Input riutilizzabile con label e un effetto di focus gradiente.
 * Utilizza forwardRef per permettere l'uso di ref sull'input interno.
 */
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
                        // Lo sfondo è trasparente di default e diventa un gradiente quando l'input all'interno è in focus
                        'bg-transparent focus-within:bg-gradient-to-br focus-within:from-purple-600 focus-within:to-indigo-700'
                    )}
                >
                    <input
                        type={type}
                        id={id}
                        ref={ref}
                        // Uniamo le classi base con quelle passate tramite props
                        className={twMerge(
                            'w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border-0 rounded-[7px] text-gray-800 dark:text-gray-200 focus:outline-none',
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
