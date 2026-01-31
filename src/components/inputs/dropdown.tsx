'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';

// Le props usano i generics per la massima flessibilità
interface DropdownProps<T extends Record<string, any>> {
    label: string;
    items: T[];
    selected: T | null;
    onSelect: (item: T | null) => void;
    optionValue: keyof T;
    optionLabel: keyof T;
    placeholder?: string;
    className?: string;
    readOnly?: boolean;
    required?: boolean;
}

export default function Dropdown<T extends Record<string, any>>({
    label,
    items,
    selected,
    onSelect,
    optionValue,
    optionLabel,
    placeholder = 'Seleziona un\'opzione...',
    className,
    readOnly,
    required
}: Readonly<DropdownProps<T>>) {

    // Se il componente è in modalità readOnly, mostra solo il testo
    if (readOnly) {
        return (
            <div className={twMerge("w-full", className)}>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    {label}
                </label>
                {/* Valore mostrato come testo semplice, senza padding orizzontale */}
                <p className="w-full py-2 text-gray-200 ">
                    {selected ? String(selected[optionLabel]) : '-'}
                </p>
            </div>
        );
    }

    // Altrimenti, mostra il dropdown normale
    return (
        <Listbox as="div" value={selected} onChange={onSelect} className={twMerge("w-full relative", className)}>
            {({ open }) => (
                <>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    {/* Wrapper per l'effetto gradiente del bordo */}
                    <div className={`relative rounded-lg p-[1.5px] transition-colors duration-300 ${open ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-transparent'}`}>
                        <ListboxButton className="relative w-full flex items-center justify-between px-4 py-2 bg-gray-700 rounded-md text-left font-normal focus:outline-none cursor-pointer">
                            <span className="block truncate text-gray-200">
                                {selected ? String(selected[optionLabel]) : placeholder}
                            </span>
                            <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                        </ListboxButton>
                    </div>
                    <ListboxOptions
                        anchor="bottom"
                        transition
                        className="w-[var(--button-width)] z-30 mt-2 origin-top rounded-lg bg-gray-800 shadow-lg transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] data-[closed]:scale-95 data-[closed]:opacity-0"
                    >
                        <div className="max-h-60 overflow-y-auto p-1">
                            {items.length === 0 ? (
                                <div className="px-4 py-2 text-sm text-gray-500">Nessuna opzione.</div>
                            ) : (
                                items.map((item) => (
                                    <ListboxOption
                                        key={String(item[optionValue])}
                                        value={item}
                                        className="group flex cursor-pointer items-center gap-2 rounded-md py-2 px-3 data-[focus]:bg-gradient-to-br from-purple-600 to-indigo-700"
                                    >
                                        <FaCheck className="invisible h-4 w-4 text-white group-data-[selected]:visible" />
                                        <span className="text-sm text-gray-200">{String(item[optionLabel])}</span>
                                    </ListboxOption>
                                ))
                            )}
                        </div>
                    </ListboxOptions>
                </>
            )}
        </Listbox>
    );
}

