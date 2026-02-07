'use server';

import { createClient } from "@/lib/server";
import { GenerateAIStagesInput, ReferenceEntity } from "@/models/AIStageSuggestion";
import { Stage } from "@/models/Stage";
import { AI_ERRORS, generateSuggestionsPrompt, generateSuggestionsSchema, INTEREST_MAP } from "@/utils/ai.utils";
import { EntityKeys } from "@/utils/entityKeys";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";


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

    const model = genAI.getGenerativeModel({
        model: ai_model,
        generationConfig: {
            temperature: 0.1, // Creatività al minimo assoluto
            topP: 0.95,
            topK: 40,
            responseMimeType: "application/json",
            responseSchema: generateSuggestionsSchema(),
        },
    });


    const targetCount = getTargetStageCount(data.stageRange);
    const interestsDescription = data.selectedInterests
        .map(key => INTEREST_MAP[key] || key.replaceAll('_', ' '))
        .join(", ");

    const userPrompt = generateSuggestionsPrompt(reference, interestsDescription, data.distance, targetCount);

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
                lat: item.lat,
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