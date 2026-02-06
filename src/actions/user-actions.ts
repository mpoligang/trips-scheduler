'use server'

import { createClient } from '@supabase/supabase-js' // Client JS standard per la versione Admin
import { createClient as createServerClient } from '@/lib/server' // Il tuo client helper per la sessione utente
import { redirect } from 'next/navigation'
import { appRoutes } from '@/utils/appRoutes'
import { EntityKeys } from '@/utils/entityKeys'
import { revalidatePath } from 'next/cache'

export async function deleteAccountAction() {
    // 1. Verifichiamo chi sta facendo la richiesta (Sicurezza base)
    const supabaseUser = await createServerClient()
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()

    if (userError || !user) {
        return { error: "Utente non autenticato o sessione scaduta." }
    }

    // 2. Inizializziamo il client ADMIN
    // Questo client ha i superpoteri (Service Role Key) per cancellare da auth.users
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )

    try {
        // --- STEP A: Pulizia Storage ---
        // Recuperiamo tutti i file caricati dall'utente.
        // Adatta la query in base alla tua tabella (es. 'attachments' o 'documents')
        // Esempio basato sul tuo codice precedente:
        const { data: attachments } = await supabaseAdmin
            .from(EntityKeys.attachmentsKey)
            .select('storage_path')
            .eq('user_id', user.id) // ⚠️ Assicurati che la colonna sia corretta (user_id o trip_id collegato)

        if (attachments && attachments.length > 0) {
            const paths = attachments.map(a => a.storage_path).filter(Boolean) as string[]

            // Cancelliamo i file dal bucket EntityKeys.attachmentsKey
            const { error: storageError } = await supabaseAdmin
                .storage
                .from(EntityKeys.attachmentsKey)
                .remove(paths)

            if (storageError) {
                console.error("Errore pulizia storage:", storageError)
                // Non blocchiamo la cancellazione dell'account per un errore di storage,
                // ma lo logghiamo.
            }
        }

        // --- STEP B: Cancellazione Account (Irreversibile) ---
        // Questo comando elimina l'utente da auth.users.
        // Se hai impostato le Foreign Keys con "ON DELETE CASCADE", 
        // Postgres eliminerà automaticamente anche il profilo e i dati collegati.
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
            user.id
        )

        if (deleteError) throw deleteError

    } catch (error: any) {
        console.error("Errore critico durante l'eliminazione account:", error.message)
        return { error: "Impossibile completare l'eliminazione. Contatta il supporto." }
    }

    // 3. Logout finale e redirect
    // Disconnettiamo la sessione (i cookie) lato server
    await supabaseUser.auth.signOut()

    // Il redirect deve stare fuori dal try/catch in Next.js
    redirect(appRoutes.home)
}

export async function updateProfileAction(formData: FormData) {
    const supabase = await createServerClient();

    // 1. Ottieni l'utente autenticato (sicurezza: non fidarsi mai dell'ID inviato dal client)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Utente non autorizzato." };
    }

    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const aiApiKey = formData.get('aiApiKey') as string;
    const aiModel = formData.get('aiModel') as string;

    // 2. Aggiorna il profilo
    const { error } = await supabase
        .from('profiles')
        .update({
            first_name: firstName,
            last_name: lastName,
            ai_api_key: aiApiKey,
            ai_model: aiModel,
        })
        .eq('id', user.id);

    if (error) {
        console.error("Errore DB:", error);
        return { error: "Errore durante l'aggiornamento del profilo." };
    }

    revalidatePath(appRoutes.profile);

    return { success: true };
}