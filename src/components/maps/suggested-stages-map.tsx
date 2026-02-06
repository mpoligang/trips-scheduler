'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { Target, Sparkles } from 'lucide-react'; // Icone specifiche per Reference e AI
import Button from '../actions/button';
import { FaDirections } from 'react-icons/fa';
import { AIStageSuggestion, ReferenceEntity } from '@/models/AIStageSuggestion'; // Il tuo model
import FormSection from '../generics/form-section';
import Input from '../inputs/input';
import RichTextEditor from '../inputs/rich-text-editor';
import { openDirectionLink } from '@/utils/open-link.utils';

// --- 1. CONFIGURAZIONE ICONE ---
const createCustomIcon = (IconComponent: React.ElementType, color: string, glow: boolean = false) => {
    const iconMarkup = renderToStaticMarkup(
        <div style={{
            color: color,
            backgroundColor: 'white',
            padding: '5px',
            borderRadius: '50%',
            border: `2px solid ${color}`,
            display: 'flex',
            width: '32px',
            height: '32px',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: glow ? `0 0 10px ${color}` : 'none' // Effetto glow per l'AI
        }}>
            <IconComponent size={20} />
        </div>
    );
    return L.divIcon({
        html: iconMarkup,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const icons = {
    reference: createCustomIcon(Target, '#ef4444'), // Rosso (Punto di partenza)
    suggestion: createCustomIcon(Sparkles, '#8b5cf6', true), // Viola con Glow (AI)
};

// --- 2. COMPONENTE PER AUTO-ZOOM ---
interface MapBoundsProps {
    reference: { lat: number; lng: number };
    suggestions: AIStageSuggestion[];
}

function MapBounds({ reference, suggestions }: MapBoundsProps) {
    const map = useMap();

    useEffect(() => {
        if (!map || !reference) return;

        const coords: [number, number][] = [];

        // Aggiungi Reference
        coords.push([reference.lat, reference.lng]);

        // Aggiungi Suggerimenti
        suggestions.forEach(s => {
            if (s.lat && s.lng) coords.push([s.lat, s.lng]);
        });

        if (coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [reference, suggestions, map]);

    return null;
}

// --- 3. POPUP SPECIFICO PER AI (Renderizza HTML) ---
const SuggestionPopup = ({ name, address, notes, isReference = false }: { name: string, address: string, notes?: string, isReference?: boolean }) => {
    return (
        <>
            <FormSection title={isReference ? "Punto di Partenza" : "Suggerimento AI"} className="p-0 mb-0" >
                <Input
                    label="Nome"
                    id="name"
                    value={name}
                    readOnly
                />
                <Input
                    label="Indirizzo"
                    id="address"
                    value={address}
                    readOnly
                />
                {
                    notes && (
                        <RichTextEditor
                            label="Note"
                            value={notes}
                            readOnly
                        />
                    )
                }

            </FormSection>

            {/* Azioni */}
            <div className="mt-3 flex justify-between items-center">
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openDirectionLink(address)}
                >
                    <FaDirections className="mr-1" /> Vai
                </Button>

                {/* Qui potresti mettere un bottone "Aggiungi al Viaggio" se vuoi */}
            </div>
        </>
    );
};


// --- 4. COMPONENTE PRINCIPALE ---
interface AISuggestionsMapProps {
    referencePoint: ReferenceEntity
    suggestions: AIStageSuggestion[];
}

export default function AISuggestionsMap({ referencePoint, suggestions }: Readonly<AISuggestionsMapProps>) {

    // Se non abbiamo coordinate, mostriamo placeholder
    if (!referencePoint.lat || !referencePoint.lng) {
        return <div className="h-[400px] bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500">Dati mappa mancanti</div>;
    }

    return (
        <MapContainer
            center={[referencePoint.lat, referencePoint.lng]}
            zoom={13}
            style={{ height: '500px', width: '100%' }} // Altezza fissa per modali o 100%
            className="rounded-2xl z-0 border border-slate-700 shadow-2xl"
        >
            {/* Dark Mode Tile Layer */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            />

            {/* 1. MARKER REFERENCE (Punto di partenza) */}
            <Marker
                position={[referencePoint.lat, referencePoint.lng]}
                icon={icons.reference}
                zIndexOffset={1000} // Sempre sopra gli altri
            >
                <Popup className="custom-popup">
                    <SuggestionPopup name={referencePoint.name as string} address={referencePoint.address} isReference={true} />
                </Popup>
            </Marker>

            {/* 2. MARKER SUGGERIMENTI AI */}
            {suggestions.map((s) => (
                <Marker
                    key={s.id}
                    position={[s.lat, s.lng]}
                    icon={icons.suggestion}
                >
                    <Popup className="custom-popup">
                        <SuggestionPopup name={s.name} address={s.address} notes={s.notes} />
                    </Popup>
                </Marker>
            ))}

            {/* Auto-Zoom per includere tutto */}
            <MapBounds reference={referencePoint} suggestions={suggestions} />
        </MapContainer>
    );
}