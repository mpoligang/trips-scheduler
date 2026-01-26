'use client';

import { useState, useEffect } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { FaUser, FaSpinner, FaTimes, FaUserPlus } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import { createClient } from '@/lib/client';
import { UserData } from '@/models/UserData';

interface UserSearchProps {
    readonly onSelect: (user: Partial<UserData>) => void;
    readonly label?: string;
    readonly placeholder?: string;
    readonly className?: string;
    readonly excludeIds?: string[];
}

export default function UserSearch({
    onSelect,
    label = "Cerca un utente",
    placeholder = "Cerca per @username o nome...",
    className,
    excludeIds = []
}: UserSearchProps) {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [results, setResults] = useState<Partial<UserData>[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        // Debounce: aspetta che l'utente scriva almeno 2 caratteri
        if (!searchTerm || searchTerm.trim().length < 2) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        const supabase = createClient();

        const searchUsers = async () => {
            const cleanQuery = searchTerm.trim().replace(/,/g, '');

            if (cleanQuery.length < 2) {
                setResults([]);
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, first_name, last_name')
                .or(`username.ilike.%${cleanQuery}%,first_name.ilike.%${cleanQuery}%,last_name.ilike.%${cleanQuery}%`)
                .limit(20);

            if (error) {
                console.error("Errore ricerca:", error);
                setResults([]);
            } else if (data) {
                const filtered = data.filter(u => !excludeIds.includes(u.id));
                const mappedResults: Partial<UserData>[] = filtered.map((u: any) => ({
                    id: u.id,
                    first_name: u.first_name,
                    last_name: u.last_name,
                    username: u.username,
                }));

                setResults(mappedResults);
            }
            setIsLoading(false);
        };

        const timer = setTimeout(searchUsers, 400); // 400ms debounce
        return () => clearTimeout(timer);
    }, [searchTerm, excludeIds]);

    const handleSelect = (user: Partial<UserData>) => {
        if (!user) { return; }

        // Passiamo l'oggetto al genitore
        onSelect(user);

        setSearchTerm('');
        setResults([]);
    };

    return (
        <Combobox
            as="div"
            value={null}
            onChange={(val: any) => handleSelect(val)}
            className={twMerge("w-full relative", className)}
        >
            {({ open }) => (
                <>
                    {label && (
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {label}
                        </label>
                    )}

                    <div className={`relative rounded-lg p-[1.5px] transition-colors duration-300 ${open ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-transparent'}`}>
                        <div className="relative flex items-center bg-gray-700 rounded-md border border-gray-600 focus-within:border-transparent">
                            <ComboboxInput
                                className="w-full bg-transparent border-none py-2 pl-4 pr-10 text-gray-200 focus:outline-none focus:ring-0 placeholder-gray-400 rounded-md"
                                id="user-search-input"
                                placeholder={placeholder}
                                displayValue={() => searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                autoComplete="off"
                            />

                            <div className="absolute right-3 flex items-center">
                                {isLoading && searchTerm.length !== 0 ? (
                                    <FaSpinner className="animate-spin h-4 w-4 text-purple-400" />
                                ) : searchTerm && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setSearchTerm('');
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                        type="button"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {results.length > 0 && (
                        <ComboboxOptions
                            static
                            anchor="bottom"
                            className="w-[var(--input-width)] z-50 mt-2 origin-top rounded-lg bg-gray-800 shadow-xl border border-gray-700 transition duration-100 ease-out p-1 focus:outline-none max-h-60 overflow-y-auto"
                        >
                            {results.map((user) => (
                                <ComboboxOption
                                    key={user.id}
                                    value={user}
                                    className="group flex cursor-pointer items-center gap-3 rounded-md py-2 px-3 data-[focus]:bg-purple-900/20 transition-colors"
                                >
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-900/50 text-indigo-300 font-bold text-sm">
                                        <FaUser className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-white truncate">
                                            {user.first_name} {user.last_name}
                                        </span>
                                        <span className="text-xs text-gray-400 truncate">
                                            @{user.username}
                                        </span>
                                    </div>
                                    <FaUserPlus className="ml-auto h-4 w-4 text-gray-300 group-data-[focus]:text-purple-400" />
                                </ComboboxOption>
                            ))}
                        </ComboboxOptions>
                    )}

                    {searchTerm && !isLoading && results.length === 0 && (
                        <ComboboxOptions
                            static
                            anchor="bottom"
                            className="w-[var(--input-width)] z-50 mt-2 p-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 focus:outline-none"
                        >
                            <div className="px-4 py-2 text-sm text-gray-400 text-center">
                                Nessun utente trovato con questo nome o username.
                            </div>
                        </ComboboxOptions>
                    )}
                </>
            )}
        </Combobox>
    );
}