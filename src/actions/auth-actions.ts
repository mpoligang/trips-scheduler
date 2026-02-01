'use server'

import { createClient } from "@/lib/server";
import { appRoutes } from "@/utils/appRoutes";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';
import { cookies, headers } from "next/headers"; // 1. Importa headers
import { createServerClient } from "@supabase/ssr";

export async function signUpAction(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const origin = (await headers()).get('origin');

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
            },
            emailRedirectTo: `${origin}/api/auth-callback`,
        },
    });

    if (error) return { error: error.message };

    return {
        success: true,
        confirmEmail: data.session === null
    };
}

export async function signInAction(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    // ✅ Pulisce la cache e forza il redirect lato server
    revalidatePath('/', 'layout');
    redirect(appRoutes.home);
}



export async function updatePasswordAction(formData: FormData) {
    const password = formData.get('password') as string
    const accessToken = formData.get('accessToken') as string
    const refreshToken = formData.get('refreshToken') as string



    if (!password || !accessToken || !refreshToken) {
        return { error: 'Dati mancanti. Riprova dal link email.' }
    }

    const cookieStore = await cookies()

    // Creiamo un client server-side
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    // Opzionale: proviamo a settare i cookie per loggare l'utente dopo
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
                    } catch { }
                },
            },
        }
    )

    // 1. FORZIAMO LA SESSIONE CON I TOKEN RICEVUTI DAL FORM
    const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
    })

    if (sessionError) {
        return { error: 'Link scaduto o non valido.' }
    }

    // 2. AGGIORNIAMO LA PASSWORD
    const { error: updateError } = await supabase.auth.updateUser({
        password: password
    })

    if (updateError) {
        return { error: updateError.message }
    }

    return { success: true }
}


export async function signInWithGoogleAction() {
    const supabase = await createClient();
    const origin = (await headers()).get('origin');

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            // URL a cui Google rimanderà l'utente dopo il login
            redirectTo: `${origin}api/google-auth-callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'select_account',
            },
        },
    });

    if (error) {
        console.error("Errore Google Auth:", error.message);
        throw new Error("Impossibile avviare l'autenticazione con Google");
    }

    // Reindirizziamo l'utente alla pagina di login di Google
    if (data.url) {
        redirect(data.url);
    }
}