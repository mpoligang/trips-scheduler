'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Corregge il problema delle icone di default di Leaflet in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Componente per aggiornare la vista della mappa quando cambia il marcatore dall'esterno
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
    readonly value: { lat: number; lng: number; address: string; } | null;
    readonly initialPosition?: [number, number];
}

export default function MapPicker({ value, initialPosition = [45.4642, 9.19] }: MapPickerProps) {
    const markerPosition: [number, number] | null = value ? [value.lat, value.lng] : null;

    return (
        <MapContainer center={initialPosition} zoom={13} style={{ height: '400px', width: '100%' }} className="rounded-lg z-0">


            <TileLayer
                url="https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.jpg?key=tsbYUs7fzxQTOnUAVi0Z&language=en"
                attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

                tileSize={512}
                zoomOffset={-1}
                minZoom={1}
                maxZoom={20}
                detectRetina={true}
            />

            {/* Mostra il marcatore se c'è una posizione selezionata */}
            {markerPosition && <Marker position={markerPosition} />}

            {/* Aggiorna la vista quando cambia la posizione */}
            <MapUpdater position={markerPosition} />

        </MapContainer>
    );
}