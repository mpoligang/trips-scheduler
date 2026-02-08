'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapPin, Hotel, Plane, Train, Car, Ship, Bus } from 'lucide-react';
import { useTrip } from '@/context/tripContext';
import { Stage } from '@/models/Stage';
import { Accommodation } from '@/models/Accommodation';
import { Transport, TransportType } from '@/models/Transport';
import { Trip } from '@/models/Trip';
import FormSection from '../generics/form-section';
import Button from '../actions/button';
import {
    FaDirections, FaList
} from 'react-icons/fa';
import { appRoutes } from '@/utils/appRoutes';
import { useRouter } from 'next/navigation';
import { openLatLngLink } from '@/utils/open-link.utils';

// --- CONFIGURAZIONE ICONE PERSONALIZZATE ---
const createCustomIcon = (IconComponent: React.JSXElementConstructor<any>, color: string) => {
    const iconMarkup = renderToStaticMarkup(
        <div style={{ color: color, backgroundColor: 'white', padding: '5px', borderRadius: '50%', border: `2px solid ${color}`, display: 'flex', width: '30px', height: '30px', alignItems: 'center', justifyContent: 'center' }}>
            <IconComponent size={20} />
        </div>
    );
    return L.divIcon({
        html: iconMarkup,
        className: 'custom-leaflet-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
    });
};

const icons = {
    stage: createCustomIcon(MapPin, '#3b82f6'), // Blu
    accommodation: createCustomIcon(Hotel, '#10b981'), // Verde
    flight: createCustomIcon(Plane, '#8b5cf6'), // Viola
    train: createCustomIcon(Train, '#f59e0b'), // Arancio
    car: createCustomIcon(Car, '#ef4444'), // Rosso
    boat: createCustomIcon(Ship, '#0ea5e9'), // Azzurro,
    bus: createCustomIcon(Bus, '#f97316'), // Arancione Scuro
};

function MapBounds({ stages, accommodations, transports }: Partial<Trip>) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const coords: [number, number][] = [];
        stages?.forEach((s: Stage) => s.lat && s.lng && coords.push([s.lat, s.lng]));
        accommodations?.forEach((a: Accommodation) => a.lat && a.lng && coords.push([a.lat, a.lng]));
        transports?.forEach((t: Transport) => {
            if (t.dep_lat && t.dep_lng) coords.push([t.dep_lat, t.dep_lng]);
        });

        if (coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [stages, accommodations, transports, map]);

    return null;
}

export default function TripMap() {

    const { trip } = useTrip();
    const router = useRouter();
    const stages = useMemo(() => trip?.stages || [], [trip?.stages]);
    const accommodations = trip?.accommodations || [];
    const transports = trip?.transports || [];

    // Calcoliamo la linea del percorso (unisce le tappe in ordine cronologico)
    const routePath = useMemo(() => {
        return stages
            .toSorted((a, b) => new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime())
            .filter(s => s.lat && s.lng)
            .map(s => [s.lat, s.lng] as [number, number]);
    }, [stages]);

    const allMapElementsExist = [...stages, ...accommodations, ...transports];


    if (allMapElementsExist.length === 0) {
        return (
            <div className="h-[400px] bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 border border-slate-700">
                Nessun dato geografico disponibile.
            </div>
        );
    }

    const getIconByTransportType = (type: TransportType) => {
        switch (type) {
            case TransportType.Flight:
                return icons.flight;
            case TransportType.Train:
                return icons.train;
            case TransportType.Bus:
                return icons.bus;
            case TransportType.Ferry:
                return icons.boat;
            default:
                return icons.car;
        }
    };

    return (
        <MapContainer
            center={routePath[0] || [0, 0]}
            zoom={13}
            style={{ height: '75dvh', width: '100%' }}
            className="rounded-2xl z-0 border border-slate-700 shadow-2xl"
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Versione Dark per il tuo tema
                attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            />



            {/* 2. MARKER TAPPE (STAGES) */}
            {stages.map((stage) => (
                <Marker
                    key={`stage-${stage.id}`}
                    position={[stage.lat as number, stage.lng as number]}
                    icon={icons.stage}
                >
                    <Popup className="custom-popup">
                        <PopupDetail title="Informazioni Tappa" name={stage.name} address={stage.address as string} lat={stage.lat as number} lng={stage.lng as number} navigateToDetail={() => {
                            router.push(appRoutes.stageDetails(trip?.id as string, stage.id));
                        }} />
                    </Popup>
                </Marker>
            ))}

            {/* 3. MARKER ALLOGGI (ACCOMMODATIONS) */}
            {accommodations.map((acc) => (
                <Marker
                    key={`acc-${acc.id}`}
                    position={[acc.lat as number, acc.lng as number]}
                    icon={icons.accommodation}
                >
                    <Popup>
                        <PopupDetail title="Informazioni Alloggio" name={acc.name} address={acc.address} lat={acc.lat as number} lng={acc.lng as number} navigateToDetail={() => {
                            router.push(appRoutes.accommodationDetails(trip?.id as string, acc.id as string));
                        }} />
                    </Popup>
                </Marker>
            ))}



            {/* 4. TRASPORTI (Linee e icone partenza/arrivo) */}
            {transports.map((trans) => (
                <div key={`trans-group-${trans.id}`}>

                    {trans.dep_lat && (
                        <Marker position={[trans.dep_lat, trans.dep_lng as number]} icon={getIconByTransportType(trans.type as TransportType)}>
                            <Popup>
                                <PopupDetail
                                    title="Informazioni Trasporto"
                                    name={trans.title}
                                    address={trans.dep_address || ''}
                                    lat={trans.dep_lat}
                                    lng={trans.dep_lng as number}
                                    navigateToDetail={() => {
                                        router.push(appRoutes.transportDetails(trip?.id as string, trans.id));
                                    }} />
                            </Popup>
                        </Marker>
                    )}
                </div>
            ))}

            <MapBounds stages={stages} accommodations={accommodations} transports={transports} />
        </MapContainer>
    );
}

interface PopupDetailProps {
    title: string;
    name: string;
    lat: number;
    lng: number;
    address: string;
    navigateToDetail: () => void;
}

export const PopupDetail = ({ title, name, address, lat, lng, navigateToDetail }: PopupDetailProps) => {
    return (
        <FormSection title={title} >
            <div className="flex flex-col ">
                <label className="block text-sm  text-gray-300">
                    Titolo
                </label>
                <p className=" text-white mb-0 mt-1">{name}</p>
            </div>
            <div className="flex flex-col">
                <label className="block text-sm  text-gray-300">
                    Indirizzo
                </label>
                <p className=" text-white mb-0 mt-1">{address}</p>
            </div>
            <div className="flex justify-start mt-4">
                <Button size="sm" variant="secondary" onClick={() => {
                    openLatLngLink(lat, lng);
                }} >
                    <FaDirections size={10} className='mr-2' />
                    Indicazioni
                </Button>
                <Button size="sm" variant="secondary" className='ml-3' onClick={navigateToDetail}>
                    <FaList size={10} className='mr-2' />
                    Dettagli
                </Button>
            </div>

        </FormSection>
    )
}