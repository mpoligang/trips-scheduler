export enum AIModels {
    GEMINI_FLASH = 'gemini-flash-latest',
    GEMINI_FLASH_LITE = 'gemini-flash-lite-latest',
}


export const AIModelsOptions: { label: string; value: AIModels }[] = [
    {
        label: 'Gemini 2.5 Flash',
        value: AIModels.GEMINI_FLASH
    },
    {
        label: 'Gemini 2.5 Flash Lite',
        value: AIModels.GEMINI_FLASH_LITE
    }
]


export enum AI_ERRORS {
    INVALID_API_KEY = 'INVALID_API_KEY',
    API_RATE_LIMIT = 'API_RATE_LIMIT',
    GENERIC_ERROR = 'AI_GENERIC_ERROR',
    NO_RESULTS = 'NO_RESULTS_FOUND'
};