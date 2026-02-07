

export interface AISearchRequest {
    id: string;
    trip_id: string;
    stage_id?: string | null;
    accommodation_id?: string | null;
    transport_id?: string | null;
    search_params: { [key: string]: any };
    created_at: string;
    ai_suggestions: AIStageSuggestion[];
}

export interface AIStageSuggestion {
    id: string;
    request_id: string;
    trip_id: string;
    address: string;
    name: string;
    lat: number;
    lng: number;
    notes?: string;
    category_tags?: string[];
}

export interface ReferenceEntity {
    name?: string;
    id: string;
    type: string;
    destination: string;
    address: string;
    lat: number;
    lng: number;
}

export interface GenerateAIStagesInput {
    distance: string;
    stageRange: string;
    selectedInterests: string[];
}
