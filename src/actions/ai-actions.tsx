'use server';

import { createClient } from "@/lib/server";
import { GenerateAIStagesInput, ReferenceEntity } from "@/models/AIStageSuggestion";
import { Stage } from "@/models/Stage";
import { AIModels } from "@/utils/aiModels";
import { EntityKeys } from "@/utils/entityKeys";
import Groq from "groq-sdk";
import { v4 as uuidv4 } from "uuid";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const INTEREST_MAP: Record<string, string> = {
    // Cultura
    museums: "Musei e Gallerie d'arte ufficiali",
    monuments: "Monumenti storici e landmarks",
    historical_squares: "Piazze principali",
    historical_streets: "Vie storiche pedonali",
    temples_and_churches: "Chiese, Cattedrali e Luoghi di culto visitabili",
    archaeological_sites: "Aree archeologiche",
    aquariums: "Acquari",
    // Cibo
    typical_restaurants: "Ristoranti storici o tipici (no fast food)",
    street_food: "Chioschi, Fast Food e street food rinomati",
    vegan_food: "Locali con opzioni vegane",
    local_markets: "Mercati rionali",
    supermarkets: "Gastronomie di alta qualità",
    aperitif_bars: "Locali per aperitivo",
    // Leisure
    parks: "Parchi pubblici",
    pools: "Piscine",
    spas: "Centri Termali",
    shopping_areas: "Vie dello shopping",
    // Natura
    viewpoints: "Punti panoramici (Belvedere)",
    hiking_trails: "Sentieri segnati",
    botanical_gardens: "Orti botanici",
    beaches: "Spiagge accessibili",
    mountains: "Rifugi o sentieri montani",
    lakes: "Punti di accesso al lago",
    rivers: "Lungofiume",
    // Nightlife
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
    data: GenerateAIStagesInput,
    reference: ReferenceEntity
) {
    const interestsDescription = data.selectedInterests
        .map(key => INTEREST_MAP[key] || key.replace('_', ' '))
        .join(", ");

    const targetCount = getTargetStageCount(data.stageRange);

    // SYSTEM PROMPT: Estremamente rigido sulla veridicità
    const systemPrompt = `
        Sei un sistema di geolocalizzazione turistica di precisione.
        
        REGOLE ANTI-ALLUCINAZIONE (CRITICHE):
        1. Devi fornire SOLO luoghi che esistono realmente su Google Maps.
        2. Le coordinate (lat, lng) devono essere ESATTE. Se non conosci le coordinate precise di un luogo, NON includerlo.
        3. Non inventare nomi di ristoranti o monumenti.
        4. Non suggerire il punto di partenza stesso come destinazione.
        
        FORMATO OUTPUT:
        Rispondi SOLO con un JSON valido: { "stages": [ ... ] }
        Ogni oggetto deve avere: "name", "address", "lat" (float), "lng" (float), "notes".
        
        FORMATO NOTE (HTML):
        Usa solo <b>, <i>, <br>, <ul>, <li>.
    `;

    const userPrompt = `
        Trovami ESATTAMENTE ${targetCount} luoghi reali a ${reference.destination} (${reference.address}).
        
        FILTRI RIGIDI:
        - Raggio massimo: ${data.distance} dal punto (${reference.lat}, ${reference.lng}).
        - Categorie: ${interestsDescription}.
        
        Se non trovi abbastanza luoghi *reali* e *verificabili* in queste categorie entro il raggio, suggerisci solo quelli di cui sei certo, anche se sono meno di ${targetCount}.
        
        NOTE PER OGNI TAPPA:
        Includi:
        - <b>Cos'è:</b> Breve descrizione veritiera.
        - <b>Info:</b> Orari/Prezzi stimati.
        - <b>Distanza:</b> Non scriverla nel testo, la calcolerò io.
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            model: AIModels.Llama33BVersatile,
            temperature: 0.1,
            max_tokens: 4096,
            stream: false,
            response_format: { type: "json_object" },
        });

        const content = chatCompletion.choices[0]?.message?.content;
        if (!content) { throw new Error("Risposta vuota da AI"); }
        let parsedData;
        try {
            parsedData = JSON.parse(content);
        } catch {
            console.error("JSON Error:", content);
            throw new Error("Errore parsing AI");
        }

        const rawStages = Array.isArray(parsedData)
            ? parsedData
            : (parsedData.stages || parsedData.items || []);

        const validatedStages = rawStages
            .map((item: Partial<Stage>) => {
                if (!item.lat || !item.lng) {
                    return null;
                }

                return {
                    id: uuidv4(),
                    name: item.name,
                    address: item.address,
                    lat: item.lat,
                    lng: item.lng,
                    notes: item.notes,
                };
            }).filter((item: Partial<Stage>) => item !== null)
        return validatedStages;

    } catch (error) {
        console.error("Errore generazione AI:", error);
        return [];
    }
}

export async function generateAndSaveAIStages(
    data: GenerateAIStagesInput,
    reference: ReferenceEntity,
    tripId: string
) {
    const supabase = await createClient();

    const generatedStages = await generateAIStages(data, reference);

    if (!generatedStages || generatedStages.length === 0) {
        return { success: false, error: "Nessuna tappa trovata dall'AI" };
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