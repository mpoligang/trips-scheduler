import { OpenStreetMapProvider } from "leaflet-geosearch";

export interface GeoSearch {
    provider: OpenStreetMapProvider,
    style: string;
    showMarker: boolean;
    showPopup: boolean;
    autoClose: boolean;
    searchLabel: string;
}