'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { FaChevronDown } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';

interface MultiSelectProps<T extends Record<string, any>> {
    label: string;
    items: T[];
    selected: T[]; // Ora è un array
    onSelect: (items: T[]) => void; // Restituisce l'array aggiornato
    optionValue: keyof T;
    optionLabel: keyof T;
    placeholder?: string;
    className?: string;
    readOnly?: boolean;
    required?: boolean;
}

export default function MultiSelect<T extends Record<string, any>>({
    label,
    items,
    selected,
    onSelect,
    optionValue,
    optionLabel,
    placeholder = 'Seleziona opzioni...',
    className,
    readOnly,
    required
}: Readonly<MultiSelectProps<T>>) {

    if (readOnly) {
        return (
            <div className={twMerge("w-full", className)}>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    {label}
                </label>
                <p className="w-full py-2 text-gray-200">
                    {selected.length > 0
                        ? selected.map(s => s[optionLabel]).join(', ')
                        : '-'}
                </p>
            </div>
        );
    }

    return (
        <Listbox
            as="div"
            value={selected}
            onChange={onSelect}
            multiple // Attiva la modalità multiselect
            by={optionValue as string}
            className={twMerge("w-full relative", className)}
        >
            {({ open }) => (
                <>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>

                    <div className={`relative rounded-lg p-[1.5px] transition-colors duration-300 ${open ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-transparent'}`}>
                        <ListboxButton className="relative w-full flex items-center justify-between px-4 py-2 bg-gray-700 rounded-md text-left font-normal focus:outline-none cursor-pointer">
                            <span className="block truncate text-gray-200">
                                {selected.length > 0
                                    ? `${selected.length} selezionati`
                                    : placeholder}
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
                                items.map((item) => {
                                    const isSelected = selected.some(s => s[optionValue] === item[optionValue]);

                                    return (
                                        <ListboxOption
                                            key={String(item[optionValue])}
                                            value={item}
                                            className="group flex cursor-pointer items-center gap-3 rounded-md py-2 px-3 data-[focus]:bg-gray-700/50"
                                        >
                                            {/* Checkbox integrata con lo stile che mi hai fornito */}
                                            <div className="relative flex items-center">
                                                <div className={twMerge(
                                                    "h-5 w-5 rounded border border-gray-600 bg-gray-700 transition-all flex items-center justify-center",
                                                    isSelected && "border-purple-600 bg-purple-600"
                                                )}>
                                                    <svg
                                                        className={twMerge("h-3.5 w-3.5 text-white transition-opacity", isSelected ? "opacity-100" : "opacity-0")}
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </div>
                                            </div>

                                            <span className={twMerge(
                                                "text-sm transition-colors",
                                                isSelected ? "text-white font-medium" : "text-gray-300"
                                            )}>
                                                {String(item[optionLabel])}
                                            </span>
                                        </ListboxOption>
                                    );
                                })
                            )}
                        </div>
                    </ListboxOptions>
                </>
            )}
        </Listbox>
    );
}