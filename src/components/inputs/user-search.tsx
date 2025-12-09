'use client';

import { useState, useEffect, useRef } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { FaUser, FaSpinner, FaTimes, FaUserPlus } from 'react-icons/fa';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { twMerge } from 'tailwind-merge';
import { EntityKeys } from '@/utils/entityKeys';

interface UserResult {
    uid: string;
    email: string;
    firstName?: string;
    lastName?: string;
}

interface UserSearchProps {
    readonly onSelect: (user: UserResult) => void;
    readonly label?: string;
    readonly placeholder?: string;
    readonly className?: string;
    readonly excludeIds?: string[]; // Per escludere utenti già aggiunti
}

export default function UserSearch({
    onSelect,
    label = "Cerca un amico",
    placeholder = "Inserisci l'email...",
    className,
    excludeIds = []
}: UserSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<UserResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (!searchTerm || searchTerm.trim().length < 3) { // Cerca solo dopo 3 caratteri
            setResults([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        searchTimeout.current = setTimeout(async () => {
            try {
                const usersRef = collection(db, EntityKeys.usersKey);
                // Cerca utenti la cui email inizia con il termine di ricerca
                const q = query(
                    usersRef,
                    where('email', '>=', searchTerm.toLowerCase()),
                    where('email', '<=', searchTerm.toLowerCase() + '\uf8ff'),
                    limit(5)
                );

                const querySnapshot = await getDocs(q);
                const foundUsers: UserResult[] = [];

                for (const doc of querySnapshot.docs) {
                    const userData = doc.data() as UserResult;
                    // Escludi utenti già presenti nella lista
                    if (!excludeIds.includes(userData.uid)) {
                        foundUsers.push(userData);
                    }
                }

                setResults(foundUsers);
            } catch (error) {
                console.error("Errore ricerca utenti:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 800); // Debounce di 800ms

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [searchTerm, excludeIds]);

    const handleSelect = (user: UserResult) => {
        if (!user) return;
        onSelect(user);
        setSearchTerm(''); // Resetta l'input dopo la selezione
        setResults([]);
    };

    return (
        <Combobox
            as="div"
            value={null} // Reset value to allow re-selecting
            onChange={(val: any) => handleSelect(val)}
            className={twMerge("w-full relative", className)}
        >
            {({ open }) => (
                <>
                    {label && (
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {label}
                        </label>
                    )}

                    {/* Wrapper Stile Gradiente */}
                    <div className={`relative rounded-lg p-[1.5px] transition-colors duration-300 ${open ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-transparent'}`}>
                        <div className="relative flex items-center bg-gray-50 dark:bg-gray-700 rounded-md">
                            <ComboboxInput
                                className="w-full bg-transparent border-none py-2 pl-4 pr-10 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-0 placeholder-gray-500 dark:placeholder-gray-400 rounded-md"
                                id="user-search-input"
                                placeholder={placeholder}
                                displayValue={() => searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                autoComplete="off"
                            />

                            <div className="absolute right-3 flex items-center">
                                {isLoading ? (
                                    <FaSpinner className="animate-spin h-4 w-4 text-purple-600 dark:text-purple-400" />
                                ) : searchTerm && (
                                    <button
                                        onClick={(e) => {
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
                            static // MODIFICA: Mantiene la lista aperta anche se si perde il focus
                            anchor="bottom"
                            className="w-[var(--input-width)] z-50 mt-2 origin-top rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 transition duration-100 ease-out p-1 focus:outline-none"
                        >
                            {results.map((user) => (
                                <ComboboxOption
                                    key={user.uid}
                                    value={user}
                                    className="group flex cursor-pointer items-center gap-3 rounded-md py-2 px-3 data-[focus]:bg-purple-50 dark:data-[focus]:bg-purple-900/20"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                                        <FaUser className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {user.firstName} {user.lastName}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {user.email}
                                        </span>
                                    </div>
                                    <FaUserPlus className="ml-auto h-4 w-4 text-gray-400 group-data-[focus]:text-purple-600" />
                                </ComboboxOption>
                            ))}
                        </ComboboxOptions>
                    )}

                    {searchTerm && !isLoading && results.length === 0 && (
                        <ComboboxOptions
                            static // MODIFICA: Mantiene il messaggio aperto
                            anchor="bottom"
                            className="w-[var(--input-width)] z-50 mt-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 focus:outline-none"
                        >
                            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                Nessun utente trovato.
                            </div>
                        </ComboboxOptions>
                    )}
                </>
            )}
        </Combobox>
    );
}