import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'
import { appRoutes } from '@/utils/appRoutes'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)

    // 1. Cerchiamo il parametro 'code' (che è quello che Supabase manda di default)
    const code = searchParams.get('code')

    if (code) {
        const supabase = await createClient()

        // 2. Scambiamo il codice con una sessione reale
        // Questo logga l'utente automaticamente nel browser impostando i cookie
        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log("Sessione recuperata con successo via Code Exchange.")
            // 3. Reindirizziamo l'utente alla pagina di modifica password
            // Essendo ora loggato, potrà salvare la nuova password senza problemi
            const { access_token, refresh_token } = data.session
            return NextResponse.redirect(`${origin}${appRoutes.resetPassword}#access_token=${access_token}&refresh_token=${refresh_token}&type=recovery`)
        }

        console.error("Errore scambio codice sessione:", error.message)
    } else {
        console.error("Nessun codice trovato nell'URL.")
    }

    // Se qualcosa è andato storto (codice scaduto, mancante, o errore server)
    return NextResponse.redirect(`${origin}${appRoutes.processFailed}`)
}