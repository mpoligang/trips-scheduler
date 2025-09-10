'use client';

import { useState } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';


export interface DropdownItem {
    id: string | number;
    name: string;
}

interface SearchableDropdownProps {
    label: string;
    items: any[];
    selected: any | null;
    onSelect: (item: any | null) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchableDropdown({
    label,
    items = ['1', '2', '3'],
    selected,
    onSelect,
    placeholder = 'Seleziona un\'opzione...',
    className,
}: SearchableDropdownProps) {
    const [query, setQuery] = useState('');

    // Filtra gli elementi in base alla query dell'utente
    let filteredItems = [];
    filteredItems = query === ''
        ? items
        : items.filter((item) => {
            return item.toLowerCase().includes(query.toLowerCase());
        });

    return (
        <Combobox as="div" value={selected} onChange={onSelect} className={twMerge("w-full", className)}>
            {({ open }) => (
                <>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                    </label>
                    {/* Wrapper per l'effetto gradiente del bordo */}
                    <div className={`relative rounded-lg p-[1.5px] transition-colors duration-300 ${open ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-transparent'}`}>
                        <div className="relative">
                            <ComboboxInput
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-800 dark:text-gray-200 focus:outline-none"
                                displayValue={(item: DropdownItem) => item?.name || ''}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={placeholder}
                            />
                            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
                                <FaChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </ComboboxButton>
                        </div>
                    </div>
                    <ComboboxOptions
                        anchor="bottom"
                        transition
                        className="w-[var(--input-width)] z-10 mt-2 origin-top rounded-lg bg-white dark:bg-gray-800 shadow-lg transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] data-[closed]:scale-95 data-[closed]:opacity-0"
                    >
                        <div className="max-h-60 overflow-y-auto p-1">
                            {filteredItems && filteredItems.length === 0 ? (
                                <div className="px-4 py-2 text-sm text-gray-500">Nessun risultato.</div>
                            ) : (
                                filteredItems && filteredItems.map((item) => (
                                    <ComboboxOption
                                        key={item.id}
                                        value={item}
                                        className="group flex cursor-pointer items-center gap-2 rounded-md py-2 px-3 data-[focus]:bg-purple-100 dark:data-[focus]:bg-purple-900/50"
                                    >
                                        <FaCheck className="invisible h-4 w-4 text-purple-600 dark:text-purple-400 group-data-[selected]:visible" />
                                        <span className="text-sm text-gray-800 dark:text-gray-200">{item}</span>
                                    </ComboboxOption>
                                ))
                            )}
                        </div>
                    </ComboboxOptions>
                </>
            )}
        </Combobox>
    );
}
