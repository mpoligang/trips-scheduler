'use client';

import { useState, useEffect, useRef } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { FaMapMarkerAlt, FaSpinner, FaTimes, FaMap, FaDirections } from 'react-icons/fa';
import { useAuth } from '@/context/authProvider';
import { twMerge } from 'tailwind-merge';
import dynamic from 'next/dynamic';
import Button from '@/components/actions/button';
import Sidebar from '@/components/containers/sidebar';
import { Location } from '@/models/Location';
import { mapNavigationUrl } from '@/utils/appRoutes';

// Carica la mappa dinamicamente
const MapPicker = dynamic(() => import('@/components/maps/map'), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-gray-700 animate-pulse flex items-center justify-center text-gray-500">Caricamento mappa...</div>
});

interface LocationResult {
    place_id: string;
    lat: string;
    lon: string;
    display_name: string;
}

interface SearchLocationProps {
    readonly id?: string;
    readonly onSelect: (location: Location | null) => void;
    readonly label?: string;
    readonly placeholder?: string;
    readonly className?: string;
    readonly value?: Location | null;
    readonly readOnly?: boolean;
    readonly required?: boolean;
}

export default function SearchLocation({
    onSelect,
    label = "Cerca un luogo",
    placeholder = "Digita per cercare...",
    className,
    value,
    readOnly = false,
    required = false,
    id
}: SearchLocationProps) {
    const { user } = useAuth(); // User di Supabase dal tuo AuthProvider
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
            setQuery('');
        }
    }, [value]);

    // Logica di ricerca con Debounce verso il nuovo Route Handler di Next.js
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        // Evitiamo ricerche inutili se la query è vuota o uguale all'indirizzo già selezionato
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
                // Chiamata al tuo nuovo endpoint Next.js
                // Non serve l'Authorization Header manuale: i cookie di Supabase viaggiano da soli
                const response = await fetch(
                    `/api/search-location?q=${encodeURIComponent(query)}`
                );

                if (response.ok) {
                    const data = await response.json();
                    setResults(data);
                } else {
                    setResults([]);
                }
            } catch (error) {
                console.error("Errore di ricerca LocationIQ:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 800);

        return () => {
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
        };
    }, [query, user, value]);

    const handleSelect = (result: LocationResult) => {
        if (!result) return;
        const newLocation: Location = {
            lat: Number.parseFloat(result.lat),
            lng: Number.parseFloat(result.lon),
            address: result.display_name
        };
        onSelect(newLocation);
        setQuery(result.display_name);
    };

    const openDirections = () => {
        if (value?.address) {
            window.open(mapNavigationUrl(value.address), '_blank');
        }
    };

    return (
        <>
            {readOnly ? (
                <div className={className}>
                    <label htmlFor={id} className="block text-sm text-gray-400 mb-1">
                        {label}
                    </label>
                    <div className="flex items-start justify-between w-full py-2">
                        <p className="text-gray-200 pr-4 whitespace-normal break-words">
                            {!value?.address ? '-' : value?.address}
                        </p>
                        {value && (
                            <button
                                onClick={() => setShowMap(true)}
                                className="text-purple-400 hover:text-purple-300 mt-1 flex-shrink-0"
                                title="Visualizza sulla mappa"
                                type="button"
                            >
                                <FaMap />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className={twMerge("w-full relative", className)}>
                    <Combobox
                        as="div"
                        value={value ?? null}
                        onChange={(val: any) => handleSelect(val)}
                    >
                        {({ open }) => (
                            <>
                                {label && (
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {label} {required && <span className="text-red-500">*</span>}
                                    </label>
                                )}

                                <div className={`relative rounded-lg p-[1.5px] transition-colors duration-300 ${open ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-transparent'}`}>
                                    <div className="relative flex items-center bg-gray-700 rounded-md">
                                        <ComboboxInput
                                            className="w-full pl-4 pr-24 py-2 bg-transparent border-none rounded-md text-gray-200 focus:outline-none focus:ring-0 placeholder-gray-400"
                                            displayValue={(item: any) => item?.address || query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            placeholder={placeholder}
                                            autoComplete="off"
                                        />

                                        <div className="absolute right-3 flex items-center gap-2 z-10">
                                            {isLoading && (
                                                <FaSpinner className="animate-spin h-4 w-4 text-purple-400" />
                                            )}

                                            {!isLoading && (query || value) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setQuery('');
                                                        onSelect(null);
                                                    }}
                                                    className="p-1 rounded-full hover:bg-gray-600 text-gray-500 transition-colors"
                                                    type="button"
                                                >
                                                    <FaTimes className="h-3 w-3" />
                                                </button>
                                            )}

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setShowMap(true);
                                                }}
                                                className={`p-1.5 rounded-full hover:bg-gray-600 transition-colors ${showMap ? 'text-purple-400 bg-purple-900/30' : 'text-gray-500'}`}
                                                type="button"
                                            >
                                                <FaMap className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {results.length > 0 && (
                                    <ComboboxOptions
                                        static
                                        anchor="bottom"
                                        className="w-[var(--input-width)] z-[9999] mt-2 origin-top rounded-lg bg-gray-800 shadow-lg border border-gray-700 focus:outline-none"
                                    >
                                        <div className="max-h-60 overflow-y-auto p-1">
                                            {results.map((item) => (
                                                <ComboboxOption
                                                    key={item.place_id}
                                                    value={item}
                                                    className="group flex cursor-pointer items-start gap-3 rounded-md py-2 px-3 data-[focus]:data-[focus]:bg-purple-900/50"
                                                >
                                                    <FaMapMarkerAlt className="flex-shrink-0 h-4 w-4 mt-1 text-gray-400 group-data-[focus]:group-data-[focus]:text-purple-400" />
                                                    <span className="text-sm text-gray-200 whitespace-normal break-words leading-snug">
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
                </div>
            )}

            <Sidebar
                isOpen={showMap}
                onClose={() => setShowMap(false)}
                title={readOnly ? "Visualizza Posizione" : "Seleziona Posizione"}
                subtitle={readOnly ? value?.address : "Clicca sulla mappa per confermare"}
                position="right"
                headerActions={
                    value?.address && (
                        <Button
                            onClick={openDirections}
                            variant="secondary"
                            size="sm"
                            className="hidden sm:flex"
                        >
                            <FaDirections className="mr-2" /> Indicazioni
                        </Button>
                    )
                }
            >
                <div className="relative w-full h-full [&_.leaflet-container]:!h-full [&_.leaflet-container]:!w-full [&_.leaflet-container]:z-0">
                    <MapPicker value={value ?? null} />
                    {value?.address && (
                        <button
                            onClick={openDirections}
                            className="sm:hidden absolute bottom-6 right-4 z-[500] p-4 bg-purple-600 text-white rounded-full shadow-lg"
                        >
                            <FaDirections size={24} />
                        </button>
                    )}
                </div>
            </Sidebar>
        </>
    );
}