'use client';

import { useState, useEffect, useRef } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { FaMapMarkerAlt, FaSpinner, FaTimes, FaMap } from 'react-icons/fa';
import { useAuth } from '@/context/authProvider';
import { twMerge } from 'tailwind-merge';
import dynamic from 'next/dynamic';

// Carica la mappa dinamicamente
const MapPicker = dynamic(() => import('@/components/map'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse mt-2"></div>
});

interface LocationResult {
    place_id: string;
    lat: string;
    lon: string;
    display_name: string;
}

interface SearchLocationProps {
    readonly onSelect: (location: { lat: number; lng: number; address: string } | null) => void;
    readonly label?: string;
    readonly placeholder?: string;
    readonly className?: string;
    readonly value?: { lat: number; lng: number; address: string } | null;
    readonly readOnly?: boolean;
}

export default function SearchLocation({
    onSelect,
    label = "Cerca un luogo",
    placeholder = "Digita per cercare...",
    className,
    value,
    readOnly = false,
}: SearchLocationProps) {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LocationResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Sincronizza la query con il valore esterno
    useEffect(() => {
        if (value) {
            setQuery(value.address);
        } else if (!query) {
            // Resetta solo se la query è vuota per evitare loop se l'utente sta scrivendo
            setQuery('');
        }
    }, [value]); // Aggiunto 'query' alle dipendenze per rispettare le regole di React Hooks

    // Logica di ricerca con Debounce
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (!query || query.trim() === '' || query === value?.address) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        searchTimeout.current = setTimeout(async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const token = await user.getIdToken();
                const response = await fetch(
                    `https://searchlocation-ocrhz7kzoq-ew.a.run.app?q=${encodeURIComponent(query)}`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setResults(data);
                } else {
                    setResults([]);
                }
            } catch (error) {
                console.error("Errore di ricerca:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 800);

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [query, user, value]); // value è necessario per evitare di cercare se la query corrisponde già all'indirizzo selezionato

    const handleSelect = (result: LocationResult) => {
        if (!result) return;
        const newLocation = {
            lat: Number.parseFloat(result.lat),
            lng: Number.parseFloat(result.lon),
            address: result.display_name
        };
        onSelect(newLocation);
        setQuery(result.display_name);
    };

    // Modalità ReadOnly
    if (readOnly) {
        return (
            <div className={className}>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {label}
                </label>
                <p className="w-full py-2 text-gray-800 dark:text-gray-200 font-semibold ">
                    {value ? value.address : '-'}
                </p>
            </div>
        );
    }

    return (
        <div className={twMerge("w-full relative", className)}>
            <Combobox
                as="div"
                value={value ?? null}
                onChange={(val: any) => handleSelect(val)}
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
                                    // Usiamo un input normale per evitare conflitti di stile
                                    className="w-full pl-4 pr-20 py-2 bg-transparent border-none rounded-md text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-0 placeholder-gray-500 dark:placeholder-gray-400"
                                    displayValue={(item: any) => item?.address || query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder={placeholder}
                                    autoComplete="off"
                                />

                                <div className="absolute right-3 flex items-center gap-2 z-10">
                                    {/* Spinner */}
                                    {isLoading && (
                                        <FaSpinner className="animate-spin h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    )}

                                    {/* Tasto Reset (X) */}
                                    {!isLoading && (query || value) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setQuery('');
                                                onSelect(null);
                                            }}
                                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 transition-colors"
                                            aria-label="Pulisci ricerca"
                                            type="button"
                                        >
                                            <FaTimes className="h-3 w-3" />
                                        </button>
                                    )}

                                    {/* Tasto Toggle Mappa */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setShowMap(!showMap);
                                        }}
                                        className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${showMap ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}
                                        aria-label={showMap ? "Nascondi mappa" : "Mostra mappa"}
                                        type="button"
                                    >
                                        <FaMap className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Lista Risultati */}
                        {results.length > 0 && (
                            <ComboboxOptions
                                anchor="bottom"
                                transition
                                className="w-[var(--input-width)] z-[9999] mt-2 origin-top rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 transition duration-100 ease-out [--anchor-gap:var(--spacing-1)] data-[closed]:scale-95 data-[closed]:opacity-0 focus:outline-none"
                            >
                                <div className="max-h-60 overflow-y-auto p-1">
                                    {results.map((item) => (
                                        <ComboboxOption
                                            key={item.place_id}
                                            value={item}
                                            className="group flex cursor-pointer items-center gap-3 rounded-md py-2 px-3 data-[focus]:bg-purple-100 dark:data-[focus]:bg-purple-900/50"
                                        >
                                            <FaMapMarkerAlt className="flex-shrink-0 h-4 w-4 text-gray-400 group-data-[focus]:text-purple-600 dark:text-gray-500 dark:group-data-[focus]:text-purple-400" />
                                            <span className="text-sm text-gray-800 dark:text-gray-200 truncate">
                                                {item.display_name}
                                            </span>
                                        </ComboboxOption>
                                    ))}
                                </div>
                            </ComboboxOptions>
                        )}
                    </>
                )}
            </Combobox>

            {/* Mappa Espandibile */}
            {showMap && (
                <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm">
                    <MapPicker
                        value={value ?? null}
                    />
                </div>
            )}
        </div>
    );
}