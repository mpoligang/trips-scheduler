import { appConfig } from "@/configs/app-config";

/**
 * Apre il client email predefinito dell'utente con campi precompilati.
 * @param subject - L'oggetto dell'email
 * @param body - Il corpo del messaggio
 */
export const openMailer = (subject: string, body: string) => {
    // 1. Codifichiamo i testi per renderli sicuri all'interno di un URL
    const encodedSubject = encodeURIComponent(subject);

    // 2. Per il body, sostituiamo i ritorni a capo standard con quelli URL-safe (%0D%0A)
    // e codifichiamo il resto dei caratteri
    const encodedBody = encodeURIComponent(body);

    // 3. Costruiamo il link mailto
    const mailtoLink = `mailto:${appConfig.supportEmail}?subject=${encodedSubject}&body=${encodedBody}`;

    // 4. Apriamo il client. window.open è preferibile a window.location 
    // perché evita di interferire con il ciclo di vita della Single Page App (Next.js)
    window.open(mailtoLink, '_blank');
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