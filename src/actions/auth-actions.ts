'use server'

import { createClient } from "@/lib/server";
import { appRoutes } from "@/utils/appRoutes";
import { revalidatePath } from "next/cache";
import { redirect } from 'next/navigation';


export async function signUpAction(formData: FormData) {
    const supabase = await createClient();

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                firstName,
                lastName,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth-callback`,
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