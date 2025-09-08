'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import L, { LeafletEventHandlerFn } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import { GeoSearch } from '@/models/GeoSearch';
import { GeoLocation } from '@/models/GeoLocation';

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

// Componente per la ricerca sulla mappa
function SearchField({ onLocationSelect }: { onLocationSelect: (loc: any) => void }) {
    const map = useMap();
    useEffect(() => {
        const provider = new OpenStreetMapProvider();
        const searchControl = new (GeoSearchControl as any)({
            provider,
            style: 'bar',
            showMarker: false, // Disabilitiamo il marcatore per gestirlo esternamente
            showPopup: false,
            autoClose: true,
            searchLabel: 'Cerca ristoranti, musei...'
        });

        map.addControl(searchControl);
        map.on('geosearch/showlocation', (result: any) => {
            onLocationSelect({
                lat: result.location.y,
                lng: result.location.x,
                address: result.location.label,
            });
        });

        // Rimuove il controllo quando il componente viene smontato
        return () => { map.removeControl(searchControl) };
    }, [map, onLocationSelect]);

    return null;
}

// Props del componente principale
interface MapPickerProps {
    onLocationSelect: (location: { lat: number; lng: number; address: string; } | null) => void;
    value: { lat: number; lng: number; address: string; } | null; // Riceve la location dal genitore
    initialPosition?: [number, number];
}

export default function MapPicker({ onLocationSelect, value, initialPosition = [45.4642, 9.1900] }: MapPickerProps) {
    // La posizione del marcatore è derivata dalla prop 'value'
    const markerPosition: [number, number] | null = value ? [value.lat, value.lng] : null;

    return (
        <MapContainer center={initialPosition} zoom={13} style={{ height: '400px', width: '100%' }} className="rounded-lg">
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {/* Mostra il marcatore solo se 'value' non è null */}
            {markerPosition && <Marker position={markerPosition} />}
            <SearchField onLocationSelect={onLocationSelect} />
            <MapUpdater position={markerPosition} />
        </MapContainer>
    );
}

