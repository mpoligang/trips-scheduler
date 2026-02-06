// app/auth/callback/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server' // Usa il client SERVER
import { appRoutes } from '@/utils/appRoutes'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null


    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })

        console.log(error);


        if (!error) {
            console.log(`${origin}${appRoutes.resetPassword}`);
            return NextResponse.redirect(`${origin}${appRoutes.resetPassword}`);
        }
    }
    // Se qualcosa va storto, rimanda a una pagina di errore
    return NextResponse.redirect(`${origin}${appRoutes.processFailed}`);
}