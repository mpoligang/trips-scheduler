

export const bytesToMb = (bytes: number | null | undefined): number => {
    if (!bytes) return 0;
    return parseFloat((bytes / (1024 * 1024)).toFixed(2));
};

/**
 * Converte i Megabyte in Byte (intero).
 * Formula: $bytes = MB \times 1024^2$
 */
export const mbToBytes = (mb: number | null | undefined): number => {
    if (!mb) return 0;
    return Math.floor(mb * 1024 * 1024);
};

/**
 * Formatta la dimensione del file in modo leggibile (KB, MB, GB).
 */
export const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const hasRealContent = (htmlContent: string | null | undefined) => {
    if (!htmlContent) return false;

    // 1. Rimuove tutti i tag HTML (es. <p>, <div>, <br>)
    const textOnly = htmlContent.replace(/<[^>]*>/g, '');

    // 2. Rimuove gli spazi "non-breaking" (&nbsp;) che gli editor spesso inseriscono
    const cleanText = textOnly.replace(/&nbsp;/g, ' ');

    // 3. Controlla se, tolti gli spazi vuoti, è rimasto qualcosa
    return cleanText.trim().length > 0;
};