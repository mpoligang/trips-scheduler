'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Corregge il problema delle icone di default di Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Componente per centrare e zoomare la mappa per contenere tutte le tappe
function MapBounds({ stages }: { stages: any[] }) {
    const map = useMap();
    useEffect(() => {
        if (stages && stages.length > 0) {
            const bounds = L.latLngBounds(stages.map(stage => [stage.location.lat, stage.location.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [stages, map]);
    return null;
}

interface StagesMapProps {
    stages: any[];
}

export default function StagesMap({ stages }: StagesMapProps) {
    if (!stages || stages.length === 0) {
        return <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">Nessuna tappa da mostrare sulla mappa.</div>;
    }

    const positions = stages.map(stage => [stage.location.lat, stage.location.lng] as [number, number]);

    return (
        <MapContainer center={positions[0]} zoom={10} style={{ height: '400px', width: '100%' }} className="rounded-lg">
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {stages.map((stage) => (
                <Marker key={stage.id} position={[stage.location.lat, stage.location.lng]}>
                    <Popup>
                        <b>{stage.name}</b><br />{stage.date}
                    </Popup>
                </Marker>
            ))}
            <MapBounds stages={stages} />
        </MapContainer>
    );
}
