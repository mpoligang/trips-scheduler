'use client';

import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Input from './input';
import { SearchResult } from 'leaflet-geosearch/dist/providers/provider.js';

// Corregge il problema delle icone di default
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Componente per aggiornare la vista della mappa quando cambia il marcatore
function MapUpdater({ position }: { position: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.setView(position, 13);
        }
    }, [position, map]);
    return null;
}

interface MapPickerProps {
    onLocationSelect: (location: { lat: number; lng: number; address: string; } | null) => void;
    value: { lat: number; lng: number; address: string; } | null;
    initialPosition?: [number, number];
}

// OTTIMIZZAZIONE: Il provider viene creato una sola volta
const provider = new OpenStreetMapProvider();

export default function MapPicker({ onLocationSelect, value, initialPosition = [45.4642, 9.1900] }: MapPickerProps) {
    const markerPosition: [number, number] | null = value ? [value.lat, value.lng] : null;

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Effetto per la ricerca con debounce
    useEffect(() => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
        if (query.trim() === '') {
            setResults([]);
            return;
        }

        setIsSearching(true);
        searchTimeout.current = setTimeout(async () => {
            const searchResults = await provider.search({ query });
            setResults(searchResults);
            setIsSearching(false);
        }, 500);

    }, [query]);

    const handleSelectResult = (result: SearchResult) => {
        onLocationSelect({
            lat: result.y,
            lng: result.x,
            address: result.label,
        });
        setQuery(''); // Pulisce l'input
        setResults([]); // Nasconde i risultati
    };

    return (
        <div className="w-full">
            {/* Input di ricerca esterno alla mappa */}
            <div className="relative mb-4">
                <Input
                    id="map-search"
                    label=""
                    type="text"
                    placeholder="Cerca un indirizzo, città o luogo..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                />
                {(results.length > 0 || isSearching) && (
                    // CORREZIONE: Aumentato lo z-index per sovrapporsi alla mappa
                    <div className="absolute z-[1000] w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {isSearching ? (
                            <div className="px-4 py-2 text-sm text-gray-500">Ricerca in corso...</div>
                        ) : (
                            <ul>
                                {results.map((result) => (
                                    <li
                                        key={result.raw.place_id}
                                        onClick={() => handleSelectResult(result)}
                                        className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer"
                                    >
                                        {result.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Contenitore della mappa */}
            <MapContainer center={initialPosition} zoom={13} style={{ height: '400px', width: '`100%' }} className="rounded-lg">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {markerPosition && <Marker position={markerPosition} />}
                <MapUpdater position={markerPosition} />
            </MapContainer>
        </div>
    );
}

