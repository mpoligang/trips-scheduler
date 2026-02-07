import { ReferenceEntity } from "@/models/AIStageSuggestion";
import { Schema, SchemaType } from "@google/generative-ai";

export enum AIModels {
    GEMINI_FLASH = 'gemini-flash-latest',
    GEMINI_FLASH_LITE = 'gemini-flash-lite-latest',
    GEMINI_3_FLASH = 'gemini-3-flash-preview'
}


export const AIModelsOptions: { label: string; value: AIModels }[] = [
    {
        label: 'Gemini 2.5 Flash',
        value: AIModels.GEMINI_FLASH
    },
    {
        label: 'Gemini 2.5 Flash Lite',
        value: AIModels.GEMINI_FLASH_LITE
    },
    {
        label: 'Gemini 3 Flash',
        value: AIModels.GEMINI_3_FLASH
    }
];


export enum AI_ERRORS {
    INVALID_API_KEY = 'INVALID_API_KEY',
    API_RATE_LIMIT = 'API_RATE_LIMIT',
    GENERIC_ERROR = 'AI_GENERIC_ERROR',
    NO_RESULTS = 'NO_RESULTS_FOUND'
};

export const generateSuggestionsPrompt = (reference: ReferenceEntity, interestsDescription: string, distance: string, targetCount: number) => {
    return `
      TASK: Agisci come un esperto local scout e ricercatore turistico. Il tuo obiettivo è fornire una lista di luoghi REALI e ATTIVI.
      CONTESTO DI RICERCA:
      - Punto di partenza: ${reference.address} (Lat: ${reference.lat}, Lng: ${reference.lng})
      - Area di ricerca: Entro un raggio di ${distance} dal punto di partenza.
      - Destinazione principale: ${reference.destination}
      - Interessi dell'utente: ${interestsDescription}
      - Numero richiesto: ${targetCount} luoghi.
      REGOLE DI VERIFICA DATI (ZERO TOLLERANZA PER ERRORI):
      1. COORDINATE: Estrapola le coordinate reali (Lat/Lng). Se non sei sicuro al 100%, scarta il luogo.
      2. STATO ATTIVITÀ: Verifica che il luogo non sia "chiuso definitivamente".
      3. SITO WEB: Cerca il sito ufficiale. Se non esiste, fornisci il link alla pagina ufficiale di Google Maps o TripAdvisor. Se non trovi nulla di affidabile, restituisci null.
      REQUISITI DI CONTENUTO (CAMPO additionalContent):
      - Spiega in 2-3 frasi PERCHÉ consigli questo posto in base agli interessi: "${interestsDescription}". 
      - Includi suggerimenti pratici (es. "Prova il piatto X", "Miglior vista al tramonto").
      LINGUA: Tutte le descrizioni devono essere in italiano professionale e coinvolgente.
      Restituisci solo luoghi esistenti al 100%. Se trovi meno luoghi di ${targetCount} ma sicuri, restituisci solo quelli. Meglio pochi ma veri, che tanti inventati.
    `;
}

export const generateSuggestionsSchema = (): Schema => {
    return {
        description: "Lista di POI turistici verificati tramite Google Search",
        type: SchemaType.OBJECT,
        properties: {
            stages: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING, description: "Nome esatto come appare su Google Maps" },
                        address: { type: SchemaType.STRING, description: "Indirizzo completo reale" },
                        // IMPORTANTE: Chiediamo stringhe per le coordinate se l'IA ha dubbi, ma qui forziamo numeri
                        // affidandoci al tool di ricerca.
                        lat: { type: SchemaType.NUMBER, description: "Latitudine verificata" },
                        lng: { type: SchemaType.NUMBER, description: "Longitudine verificata" },
                        content: {
                            type: SchemaType.OBJECT,
                            properties: {
                                description: { type: SchemaType.STRING, description: "Descrizione sintetica (max 20 parole)" },
                                practical_info: { type: SchemaType.STRING, description: "Orari e Prezzi reali verificati" },
                                web_site: { type: SchemaType.STRING, description: "URL verificato o vuoto se non esiste" }
                            },
                            required: ["description", "practical_info", "web_site"]
                        }
                    },
                    required: ["name", "address", "lat", "lng", "content"],
                },
            },
        },
        required: ["stages"],
    };
}

export const INTEREST_MAP: Record<string, string> = {
    museums: "Musei e Gallerie d'arte ufficiali",
    monuments: "Monumenti storici e landmarks",
    historical_squares: "Piazze principali",
    historical_streets: "Vie storiche pedonali",
    temples_and_churches: "Chiese, Cattedrali e Luoghi di culto visitabili",
    archaeological_sites: "Aree archeologiche",
    aquariums: "Acquari",
    typical_restaurants: "Ristoranti storici o tipici (no fast food)",
    street_food: "Chioschi, Fast Food e street food rinomati",
    vegan_food: "Locali con opzioni vegane",
    local_markets: "Mercati rionali",
    supermarkets: "Gastronomie di alta qualità",
    aperitif_bars: "Locali per aperitivo",
    parks: "Parchi pubblici",
    pools: "Piscine",
    spas: "Centri Termali",
    shopping_areas: "Vie dello shopping",
    viewpoints: "Punti panoramici (Belvedere)",
    hiking_trails: "Sentieri segnati",
    botanical_gardens: "Orti botanici",
    beaches: "Spiagge accessibili",
    mountains: "Rifugi o sentieri montani",
    lakes: "Punti di accesso al lago",
    rivers: "Lungofiume",
    night_clubs: "Discoteca",
    bars: "Cocktail bar",
    pubs: "Pub",
    discos: "Club notturni",
};