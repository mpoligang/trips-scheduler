'use server'

import { createClient } from "@/lib/server";
import { EntityKeys } from "@/utils/entityKeys";

export async function downloadAttachment(storagePath: string, fileName: string) {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
        .from(EntityKeys.attachmentsKey)
        .createSignedUrl(storagePath, 60, {
            download: fileName || true
        });

    if (error) {
        console.error("Errore:", error.message);
        return;
    }
    return data.signedUrl;
}

export const getFileUrl = async (path: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
        .storage
        .from(EntityKeys.attachmentsKey)
        .createSignedUrl(path, 60); // Scade dopo 60 secondi

    if (error) {
        console.error(error);
        return null;
    }

    return data.signedUrl; // Questo URL lo puoi mettere nel src di un'immagine
};