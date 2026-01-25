// @/models/Attachment.ts

/**
 * Rappresenta un allegato (File o Link) nel database Supabase.
 * Questo modello è mappato 1:1 con la tabella 'attachments'.
 */
export interface Attachment {
    /** UUID - Identificatore univoco (Primary Key) */
    id: string;

    /** UUID - ID del viaggio di appartenenza (Foreign Key) */
    trip_id: string;

    /** * Riferimenti alle entità collegate (Foreign Keys).
     * Solo uno di questi tre sarà valorizzato per ogni record.
     */
    stage_id: string | null;
    accommodation_id: string | null;
    transport_id: string | null;

    /** Nome dell'allegato visualizzato dall'utente */
    name: string;

    /** URL pubblico per l'accesso al file o link esterno */
    url: string;

    /** * Path interno nel bucket dello Storage (es. "trip_uuid/file_uuid.pdf").
     * Necessario per l'eliminazione del file fisico dallo storage.
     * Sarà null se l'allegato è un link esterno.
     */
    storage_path: string | null;

    /** Dimensione del file in byte (0 per i link) */
    size_in_bytes: number;

    /** * Tipo di file o contenuto. 
     * Può contenere 'file', 'link' o il MIME type (es. 'application/pdf')
     */
    file_type: string;

    /** Timestamp di creazione generato dal DB */
    created_at?: string;
}

/**
 * Utility Type per la creazione di un nuovo allegato
 */
export type CreateAttachmentInput = Omit<Attachment, 'id' | 'created_at'>;