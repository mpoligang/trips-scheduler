import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { appRoutes } from '@/utils/appRoutes'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const cookieStore = request.cookies
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                },
            }
        )

        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.session) {
            const { access_token, refresh_token } = data.session;
            // Passiamo i token nell'hash URL. È sicuro e funziona sempre.
            return NextResponse.redirect(`${origin}${appRoutes.resetPassword}#access_token=${access_token}&refresh_token=${refresh_token}`)
        }
    }

    return NextResponse.redirect(`${origin}${appRoutes.processFailed}`)
}