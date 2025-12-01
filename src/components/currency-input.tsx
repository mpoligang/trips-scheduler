'use client';

import { Input } from '@headlessui/react';
import { InputHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface CurrencyInputProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    label: string;
    symbol?: string; // Il simbolo da mostrare (es. "€", "$")
    readOnly?: boolean; // Nuova prop per la modalità sola lettura
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ className, id, label, symbol = '€', type = 'number', readOnly, ...props }, ref) => {

        // Modalità ReadOnly
        if (readOnly) {
            return (
                <div className={twMerge("w-full", className)}>
                    <label htmlFor={id} className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        {label}
                    </label>
                    <p className="w-full py-2 text-gray-800 dark:text-gray-200 font-semibold">
                        {props.value ? `${props.value} ${symbol}` : '-'}
                    </p>
                </div>
            );
        }

        // Modalità Edit
        return (
            <div className="w-full">
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                </label>
                {/* Wrapper con effetto gradiente */}
                <div className="relative rounded-lg p-[1.5px] transition-colors duration-300 bg-transparent focus-within:bg-gradient-to-br focus-within:from-purple-600 focus-within:to-indigo-700">
                    <div className="flex items-center w-full bg-gray-50 dark:bg-gray-700 rounded-md overflow-hidden">

                        {/* Input Numerico */}
                        {/* Le classi aggiunte nascondono gli spinner nativi del browser */}
                        <Input
                            ref={ref}
                            id={id}
                            type={type}
                            className={twMerge(
                                "w-full bg-transparent border-none py-2 pl-4 pr-1 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-0 placeholder-gray-500 dark:placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                className
                            )}
                            {...props}
                        />

                        {/* Simbolo Valuta - A Destra senza sfondo */}
                        <div className="flex items-center justify-center pr-4 pl-2 h-full ">
                            <span className="text-gray-400 ">
                                {symbol}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;