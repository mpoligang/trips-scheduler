'use client';

import { useState, useEffect, useRef } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { FaMapMarkerAlt, FaSpinner, FaTimes, FaMap, FaDirections, FaPlusCircle } from 'react-icons/fa';
import { useAuth } from '@/context/authProvider';
import { twMerge } from 'tailwind-merge';
import dynamic from 'next/dynamic';
import Button from '@/components/actions/button';
import Sidebar from '@/components/containers/sidebar';
import Input from '@/components/inputs/input';
import { Location } from '@/models/Location';
import { openLatLngLink } from '@/utils/open-link.utils';
import DialogComponent from '../modals/confirm-modal';
import toast from 'react-hot-toast';

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
    isCustom?: boolean;
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
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<LocationResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Stato per la visibilità delle opzioni
    const [optionsOpen, setOptionsOpen] = useState(false);

    // Ref per rilevare click outside
    const containerRef = useRef<HTMLDivElement>(null);

    // Stato per il form manuale
    const [manualLocation, setManualLocation] = useState({
        address: '',
        lat: '',
        lng: ''
    });

    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Sincronizza la query con il valore esterno
    useEffect(() => {
        if (value) {
            setQuery(value.address);
        } else if (!query) {
            setQuery('');
        }
    }, [value]);

    // Gestione Click Outside per chiudere le opzioni
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOptionsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Logica di ricerca con Debounce
    useEffect(() => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!query || query.trim() === '' || query === value?.address) {
            setResults([]);
            setIsLoading(false);
            // Non chiudiamo qui optionsOpen forzatamente, lasciamo che sia l'utente o la selezione a farlo
            // ma se la query è vuota, le options non verranno renderizzate comunque dalla condizione nel JSX
            return;
        }

        setIsLoading(true);
        // Se l'utente sta digitando, assicuriamoci che sia aperto
        setOptionsOpen(true);

        searchTimeout.current = setTimeout(async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/search-location?q=${encodeURIComponent(query)}`);
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

    // Gestione selezione dalla tendina
    const handleSelect = (result: LocationResult) => {
        if (!result) return;

        // Chiudi sempre le opzioni alla selezione
        setOptionsOpen(false);

        if (result.isCustom) {
            setManualLocation({ address: query, lat: '', lng: '' });
            setQuery('');
            setIsModalOpen(true);
            return;
        }

        // SELEZIONE NORMALE DA API
        const newLocation: Location = {
            lat: Number.parseFloat(result.lat),
            lng: Number.parseFloat(result.lon),
            address: result.display_name
        };
        onSelect(newLocation);
        setQuery(result.display_name);
    };

    // Gestione conferma del modale (Salva Indirizzo)
    const handleManualConfirm = (e: React.FormEvent) => {
        e.preventDefault();

        const lat = Number.parseFloat(manualLocation.lat);
        const lng = Number.parseFloat(manualLocation.lng);

        // CONTROLLO VALIDAZIONE
        if (!manualLocation.address.trim()) {
            toast.error("L'indirizzo è obbligatorio.");
            return;
        }
        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            toast.error("Latitudine e Longitudine devono essere numeri validi.");
            return;
        }

        // Se tutto ok, crea l'oggetto Location
        const newLocation: Location = {
            lat,
            lng,
            address: manualLocation.address
        };

        // SALVA NEL FORM PRINCIPALE
        onSelect(newLocation);
        setQuery(newLocation.address);
        setIsModalOpen(false);
    };

    return (
        <>
            {readOnly ? (
                <div className={className}>
                    <label htmlFor={id} className="block text-sm text-gray-400 mb-1">{label}</label>
                    <div className="flex items-start justify-between w-full py-2">
                        <p className="text-gray-200 pr-4 whitespace-normal break-words">
                            {value?.address ? value.address : '-'}
                        </p>
                        {value?.address && (
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
                <div
                    ref={containerRef} // Ref per il click outside
                    className={twMerge("w-full relative", className)}
                >
                    <Combobox as="div" value={value ?? null} onChange={(val: any) => handleSelect(val)}>
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
                                            onChange={(event) => {
                                                setQuery(event.target.value);
                                                // Apre le opzioni quando si digita
                                                if (!optionsOpen) setOptionsOpen(true);
                                            }}
                                            onFocus={() => {
                                                // Apre le opzioni al focus se c'è testo
                                                if (query.length > 0) setOptionsOpen(true);
                                            }}
                                            placeholder={placeholder}
                                            autoComplete="off"
                                        />

                                        <div className="absolute right-3 flex items-center gap-2 z-10">
                                            {isLoading && <FaSpinner className="animate-spin h-4 w-4 text-purple-400" />}

                                            {!isLoading && (query || value) && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setQuery('');
                                                        onSelect(null);
                                                        setOptionsOpen(false); // Chiude le opzioni
                                                    }}
                                                    className="p-1 rounded-full hover:bg-gray-600 text-gray-500 transition-colors"
                                                    type="button"
                                                >
                                                    <FaTimes className="h-3 w-3" />
                                                </button>
                                            )}
                                            {value?.address && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setShowMap(true);
                                                        // Non chiudiamo optionsOpen qui per UX, o opzionale
                                                    }}
                                                    className={`p-1.5 rounded-full hover:bg-gray-600 transition-colors ${showMap ? 'text-purple-400 bg-purple-900/30' : 'text-gray-500'}`}
                                                    type="button"
                                                >
                                                    <FaMap className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Renderizza le opzioni SOLO se optionsOpen è true */}
                                {optionsOpen && query.length > 0 && (
                                    <ComboboxOptions
                                        static
                                        anchor="bottom"
                                        className="w-[var(--input-width)] z-[9999] mt-2 origin-top rounded-lg bg-gray-800 shadow-lg border border-gray-700 focus:outline-none"
                                    >
                                        <div className="max-h-60 overflow-y-auto p-1">
                                            <ComboboxOption value={{ isCustom: true, place_id: 'custom' }}
                                                className="group flex cursor-pointer items-center rounded-md py-2 px-3 hover:bg-gradient-to-br from-purple-600 to-indigo-700">
                                                <FaPlusCircle className="flex-shrink-0 h-4 w-4 mt-1 text-purple-400" />
                                                <div className="flex flex-col ml-4">
                                                    <span className="text-sm font-semibold text-white">Inserisci i dati manualmente</span>
                                                    <span className='text-xs text-gray-400'>Se pensi che le coordinate associate all&apos;indirizzo siano errate, puoi inserirle manualmente.</span>
                                                </div>
                                            </ComboboxOption>

                                            {results.map((item) => (
                                                <ComboboxOption key={item.place_id} value={item}
                                                    className="group flex cursor-pointer items-start gap-3 rounded-md py-2 px-3 data-[focus]:bg-gradient-to-br from-purple-600 to-indigo-700">
                                                    <FaMapMarkerAlt className="flex-shrink-0 h-4 w-4 mt-1 text-gray-400 group-data-[focus]:text-purple-400" />
                                                    <span className="text-sm text-gray-200 whitespace-normal break-words leading-snug">{item.display_name}</span>
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

            {/* Modale Manuale */}
            <DialogComponent
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={(e: React.FormEvent) => handleManualConfirm(e)}
                isLoading={false}
                title="Posizione Personalizzata"
                confirmText="Salva Indirizzo"
            >
                <div className="space-y-5 py-2">
                    <Input
                        id="manual-address"
                        label="Indirizzo Completo"
                        value={manualLocation.address}
                        onChange={(e) => setManualLocation({ ...manualLocation, address: e.target.value })}
                        placeholder="Es: Via Roma 1, Milano"
                        required
                    />
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input
                            id="manual-lat"
                            label="Latitudine"
                            type="number"
                            step="any"
                            value={manualLocation.lat}
                            onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
                            placeholder="Es: 45.4642"
                            required
                        />
                        <Input
                            id="manual-lng"
                            label="Longitudine"
                            type="number"
                            step="any"
                            value={manualLocation.lng}
                            onChange={(e) => setManualLocation({ ...manualLocation, lng: e.target.value })}
                            placeholder="Es: 9.1900"
                            required
                        />
                    </div>
                </div>
            </DialogComponent>

            {/* Sidebar con Mappa */}
            <Sidebar
                isOpen={showMap}
                onClose={() => setShowMap(false)}
                title="Visualizza Posizione sulla Mappa"
                subtitle={readOnly ? value?.address : "Controlla se la posizione selezionata è corretta"}
                position="right"
                headerActions={
                    value?.address && (
                        <Button onClick={() => openLatLngLink(value.lat, value.lng)} variant="secondary" size="sm" className="hidden sm:flex">
                            <FaDirections className="mr-2" /> Indicazioni
                        </Button>
                    )
                }
            >
                <div className="relative w-full h-full [&_.leaflet-container]:!h-full [&_.leaflet-container]:!w-full [&_.leaflet-container]:z-0">
                    <MapPicker value={value ?? null} />
                    {value?.address && (
                        <button
                            onClick={() => openLatLngLink(value.lat, value.lng)}
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