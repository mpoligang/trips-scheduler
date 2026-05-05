import { appConfig } from "@/configs/app-config";
import { RoutingMode } from "@/models/StageLeg";

const GOOGLE_TRAVEL_MODE: Record<RoutingMode, string> = {
    walking: 'walking',
    cycling: 'bicycling',
    driving: 'driving',
};

/**
 * Apre il client email predefinito dell'utente con campi precompilati.
 * @param subject - L'oggetto dell'email
 * @param body - Il corpo del messaggio
 */
export const openMailer = (subject: string, body: string) => {
    const newWindow = window.open('', '_blank');
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const mailtoLink = `mailto:${appConfig.supportEmail}?subject=${encodedSubject}&body=${encodedBody}`;
    if (newWindow) {
        newWindow.open(mailtoLink, '_blank');
    }
};


export const sendEmailToUpgrade = (displayName: string, email: string) => {
    const subject = `🚀 Richiesta Upgrade Premium - AItinerante.it`;

    const body = `Ciao Team di AItinerante! 👋

Sto usando l'app per pianificare le mie prossime avventure e la trovo fantastica! ✨ 

Ho appena raggiunto il limite del mio piano attuale e non vedo l'ora di sbloccare la versione Premium per organizzare ancora più viaggi senza limiti e avere tutto sotto controllo. 🌍✈️

Potreste darmi informazioni su come procedere con l'upgrade per il mio profilo?
📧 Account: ${email}

Attendo vostre news per rimettermi subito in viaggio! 🎒

A presto,
${displayName}`;

    openMailer(subject, body);
};

export const sendPlanInfoRequest = () => {
    const subject = '🌍 Info sui Piani Premium - AItinerante.it';

    const body = `Ciao Team di AItinerante! 👋

Sto esplorando l'app e la trovo un'idea fantastica! 🚀 

Mi piacerebbe ricevere maggiori informazioni sui piani Premium per capire come sbloccare tutte le potenzialità della piattaforma e organizzare i miei itinerari senza limiti. ✨🎒

Cosa include esattamente l'upgrade e come posso attivarlo? 💎

Attendo vostre notizie per mettermi subito in viaggio! ✈️`;

    openMailer(subject, body);
};


export const openDirectionLink = (address: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    const newWindow = window.open('', '_blank');
    if (newWindow) {
        newWindow.open(url, '_blank');
    }
};

export const openLatLngLink = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) {
        newWindow.open(url, '_blank');
    }
}

/**
 * Apre Google Maps in modalità "Indicazioni" tra due coordinate, con la modalità
 * di viaggio richiesta. Funziona sia da desktop sia da mobile (deep link nativo).
 */
export const openGoogleMapsDirections = (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
    mode: RoutingMode = 'walking'
) => {
    const travelmode = GOOGLE_TRAVEL_MODE[mode];
    const url = `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=${travelmode}`;
    window.open(url, '_blank', 'noopener,noreferrer');
};