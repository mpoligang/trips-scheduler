'use server';

import { createClient } from "@/lib/server";
import { GenerateAIStagesInput, ReferenceEntity } from "@/models/AIStageSuggestion";
import { Stage } from "@/models/Stage";
import { AI_ERRORS } from "@/utils/ai-utils";
import { EntityKeys } from "@/utils/entityKeys";
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";

// Inizializzazione Google AI




const INTEREST_MAP: Record<string, string> = {
    // ... (La tua mappa rimane invariata)
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

function getTargetStageCount(range: string): number {
    switch (range) {
        case '1-5': return 4;
        case '5-10': return 8;
        case '10-15': return 12;
        default: return 5;
    }
}

export async function generateAIStages(
    ai_api_key: string,
    ai_model: string,
    data: GenerateAIStagesInput,
    reference: ReferenceEntity
) {

    const genAI = new GoogleGenerativeAI(ai_api_key);

    // 1. SCHEMA: Rilassiamo leggermente le coordinate (che sono il punto debole)
    // ma manteniamo la struttura rigida.
    const stageSchema: Schema = {
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

    // 2. CONFIGURAZIONE DEL MODELLO
    // CAMBIO CRITICO: Usiamo 'gemini-1.5-pro' (più intelligente) e attiviamo i TOOLS.
    const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",

        generationConfig: {
            temperature: 0.1, // Creatività al minimo assoluto
            topP: 0.95,
            topK: 40,
            responseMimeType: "application/json",
            responseSchema: stageSchema,
        },
    });

    // 3. Prompt "Chain-of-Verification"
    // Obblighiamo l'IA a fare una ricerca prima di rispondere.
    const targetCount = getTargetStageCount(data.stageRange);
    const interestsDescription = data.selectedInterests
        .map(key => INTEREST_MAP[key] || key.replaceAll(/_/g, ' '))
        .join(", ");

    const userPrompt = `
        TASK: Agisci come un ricercatore turistico che deve verificare ogni dato.
        
        INPUT:
        - Destinazione: ${reference.destination}
        - Punto centrale: ${reference.address} (Lat: ${reference.lat}, Lng: ${reference.lng})
        - Raggio: ${data.distance} metri
        - Interessi: ${interestsDescription}
        - Quantità richiesta: ${targetCount} luoghi
        
        ISTRUZIONI OPERATIVE CRITICHE:
        1. USA IL TOOL "GOOGLE SEARCH" per ogni singolo luogo candidato.
        2. CERCA "indirizzo esatto [Nome Luogo]" per ottenere l'indirizzo reale.
        3. CERCA "sito ufficiale [Nome Luogo]" per il sito web.
        4. Se un luogo risulta "chiuso definitivamente" o le coordinate sono incerte, SCARTALO e cercane un altro.
        5. NON stimare le coordinate matematicamente. Estrapolale dalla ricerca o usa quelle note del landmark principale.
        
        OUTPUT:
        Restituisci solo luoghi esistenti al 100%. Se trovi meno luoghi di ${targetCount} ma sicuri, restituisci solo quelli. Meglio pochi ma veri, che tanti inventati.
    `;

    try {
        const result = await model.generateContent(userPrompt);
        const response = result.response;
        const text = response.text();

        // Parsing di sicurezza
        let parsedData;
        try {
            parsedData = JSON.parse(text);
        } catch (e) {
            console.error("JSON Parsing Error:", text, "Exception:", e);
            return [];
        }

        const rawStages = parsedData.stages || [];

        // 5. Costruzione Oggetto Finale
        const validatedStages = rawStages.map((item: any) => {
            const htmlNotes = `
                <b>Cos'è:</b> ${item.content.description}<br>
                <b>Info:</b> ${item.content.practical_info}<br>
                ${item.content.web_site ? `<b>Sito Web:</b> <a href="${item.content.web_site}" target="_blank">${item.content.web_site}</a>` : ''}
            `.trim();

            return {
                id: uuidv4(),
                name: item.name,
                address: item.address,
                lat: item.lat, // Ora dovrebbero essere molto più precise grazie al Pro model
                lng: item.lng,
                notes: htmlNotes,
            };
        });

        return validatedStages;

    } catch (error: unknown) {
        const errorMessage = (error as Error)?.message?.toLowerCase() || "";
        const statusCode = (error as any)?.status || 0;

        if (statusCode === 403 || statusCode === 401 || errorMessage.includes("api key not valid")) {
            throw new Error(AI_ERRORS.INVALID_API_KEY);
        }

        if (statusCode === 429 || errorMessage.includes("429") || errorMessage.includes("quota")) {
            throw new Error(AI_ERRORS.API_RATE_LIMIT);
        }

        console.error("Gemini AI Unhandled Error:", error);
        throw new Error(AI_ERRORS.GENERIC_ERROR);
    }
}

export async function generateAndSaveAIStages(
    ai_api_key: string,
    ai_model: string,
    data: GenerateAIStagesInput,
    reference: ReferenceEntity,
    tripId: string
) {
    try {
        const supabase = await createClient();

        const generatedStages = await generateAIStages(ai_api_key, ai_model, data, reference);

        if (!generatedStages || generatedStages.length === 0) {
            return { success: false, error: AI_ERRORS.NO_RESULTS };
        }

        const referenceIds = {
            stage_id: reference.type === EntityKeys.stagesKey ? reference.id : null,
            accommodation_id: reference.type === EntityKeys.accommodationsKey ? reference.id : null,
            transport_id: reference.type === EntityKeys.transportsKey ? reference.id : null,
        };

        const { data: requestData, error: requestError } = await supabase
            .from(EntityKeys.aiSearchRequestsKey)
            .insert({
                trip_id: tripId,
                ...referenceIds,
                search_params: data
            })
            .select()
            .single();

        if (requestError || !requestData) {
            console.error("Errore creazione Request:", requestError);
            return { success: false, error: "Errore salvataggio richiesta" };
        }

        const newRequestId = requestData.id;

        const suggestionsToInsert = generatedStages.map((stage: Partial<Stage>) => ({
            request_id: newRequestId,
            trip_id: tripId,
            name: stage.name,
            address: stage.address,
            lat: stage.lat,
            lng: stage.lng,
            notes: stage.notes,
            category_tags: data.selectedInterests
        }));

        const { data: savedSuggestions, error: suggestionsError } = await supabase
            .from(EntityKeys.aiSuggestionsKey)
            .insert(suggestionsToInsert)
            .select();

        if (suggestionsError) {
            console.error("Errore salvataggio suggerimenti:", suggestionsError);
            return { success: false, error: "Errore salvataggio dettagli" };
        }

        return { success: true, data: savedSuggestions, request_id: newRequestId };
    }
    catch (error: unknown) {
        const message = (error as Error).message;

        // Se è uno dei nostri errori noti, lo passiamo alla UI
        if (Object.values(AI_ERRORS).includes(message as AI_ERRORS)) {
            return { success: false, error: message };
        }

        return { success: false, error: AI_ERRORS.GENERIC_ERROR };
    }
}


export async function deleteAISuggestions(requestId: string) {
    const supabase = await createClient();

    const { error: requestError } = await supabase
        .from(EntityKeys.aiSearchRequestsKey)
        .delete()
        .eq('id', requestId);

    if (requestError) {
        console.error("Errore eliminazione richiesta:", requestError);
        return { success: false, error: "Errore eliminazione richiesta" };
    }

    return { success: true };
}