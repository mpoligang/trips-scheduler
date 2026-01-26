'use client';

import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaLink, FaSpinner, FaExternalLinkAlt } from 'react-icons/fa';
import Input from '@/components/inputs/input';
import { twMerge } from 'tailwind-merge';

interface LinkPreviewData {
    title?: string;
    description?: string;
    image?: { url: string };
    url?: string;
    publisher?: string;
}

interface LinkPreviewProps {
    readonly label: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly placeholder?: string;
    readonly className?: string;
    readonly readOnly?: boolean; // Nuova prop per la modalità sola lettura
}

export default function LinkPreview({
    label,
    value,
    onChange,
    placeholder = "Incolla un link (es. https://booking.com...)",
    className,
    readOnly,
}: LinkPreviewProps) {
    const [data, setData] = useState<LinkPreviewData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Funzione per validare l'URL
    const isValidUrl = (urlString: string) => {
        try {
            return Boolean(new URL(urlString));
        } catch {
            return false;
        }
    };

    useEffect(() => {
        // Resetta lo stato se il valore è vuoto
        if (!value) {
            setData(null);
            setError(false);
            return;
        }

        // Se l'URL non è valido, non fare nulla
        if (!isValidUrl(value)) {
            return;
        }

        // Debounce per evitare troppe chiamate mentre si scrive
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        setIsLoading(true);
        setError(false);

        debounceTimer.current = setTimeout(async () => {
            try {
                // Utilizziamo l'API pubblica di microlink.io per l'anteprima
                const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(value)}`);
                const result = await response.json();

                if (result.status === 'success') {
                    setData(result.data);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Errore nel recupero dell'anteprima:", err);
                setError(true);
            } finally {
                setIsLoading(false);
            }
        }, 800); // 800ms di attesa

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [value]);

    return (
        <div className={twMerge("w-full space-y-3", className)}>

            {/* Modalità Modifica: Mostra Input */}
            {!readOnly && (
                <div className="relative">
                    <Input
                        id="link-preview-input"
                        label={label}
                        type="url"
                        value={value}
                        autoComplete="off"
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="pr-10" // Spazio per lo spinner/icona
                    />
                    <div className="absolute right-3 top-[42px] text-gray-400">
                        {isLoading ? (
                            <FaSpinner className="animate-spin h-4 w-4 text-purple-400" />
                        ) : (
                            <FaLink className="h-4 w-4" />
                        )}
                    </div>
                </div>
            )}

            {/* Modalità ReadOnly: Mostra Etichetta e Link testuale (fallback) */}
            {readOnly && (
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        {label}
                    </label>
                    {/* Se non c'è la card (o sta caricando), mostra il link come testo */}
                    {(!data || isLoading) && (
                        <div className="w-full py-2 text-gray-200  truncate">
                            {(() => {
                                if (isLoading) {
                                    return (
                                        <span className="flex items-center gap-2 text-gray-500 font-normal">
                                            <FaSpinner className="animate-spin h-3 w-3" /> Caricamento anteprima...
                                        </span>
                                    );
                                } else if (value) {
                                    return (
                                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                                            {value}
                                        </a>
                                    );
                                } else {
                                    return '-';
                                }
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* Card di Anteprima (mostrata sia in edit che in readonly se i dati ci sono) */}
            {!isLoading && data && !error && (
                <div className="relative group overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-300">

                    {/* Pulsante Rimuovi Link (Solo in modalità modifica) */}
                    {!readOnly && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute top-2 right-2 z-10 p-1.5 bg-gray-900/90 text-gray-500 hover:text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Rimuovi link"
                        >
                            <FaTimes className="h-3 w-3" />
                        </button>
                    )}

                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col sm:flex-row h-full"
                    >
                        {/* Immagine */}
                        {data.image?.url && (
                            <div className="relative w-full sm:w-32 h-32 sm:h-auto flex-shrink-0">
                                {/* Nota: Usare un normale img tag qui è spesso più robusto per URL esterni dinamici rispetto a next/image se non si conoscono i domini a priori */}
                                <img
                                    src={data.image.url}
                                    alt={data.title || 'Anteprima'}
                                    className="object-cover w-full h-full"
                                />
                            </div>
                        )}

                        {/* Contenuto Testuale */}
                        <div className="flex flex-col justify-center p-4 min-w-0">
                            <h4 className="font-bold text-sm text-gray-100 line-clamp-1 mb-1">
                                {data.title || value}
                            </h4>
                            <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                                {data.description || 'Nessuna descrizione disponibile.'}
                            </p>
                            <div className="flex items-center text-xs text-purple-400 font-medium">
                                <FaExternalLinkAlt className="mr-1.5 h-3 w-3" />
                                {data.publisher || new URL(value).hostname}
                            </div>
                        </div>
                    </a>
                </div>
            )}

            {/* Stato di Errore (solo in edit mode, in readOnly mostriamo il link testuale sopra) */}
            {!readOnly && !isLoading && error && value && (
                <div className="text-xs text-gray-400 italic px-1">
                    Nessuna anteprima disponibile per questo link.
                </div>
            )}
        </div>
    );
}