// @/app/reset-password/page.tsx
'use client';

import { useState, ChangeEvent, useEffect, useRef } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import { appRoutes } from '@/utils/appRoutes';
import { useAuth } from '@/context/authProvider';

export default function ResetPasswordPage() {
    const supabase = createClient();
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stato locale di caricamento
    const [isVerifying, setIsVerifying] = useState(true);

    const { user: contextUser, refreshUserData } = useAuth();
    const processedRef = useRef(false);

    // --- QUESTO USE EFFECT ORA È PERFETTO, NON TOCCARLO ---
    useEffect(() => {
        const init = async () => {
            if (contextUser) {
                console.log("✅ Utente rilevato dal Context Globale!");
                setIsVerifying(false);
                if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
                return;
            }

            if (processedRef.current) return;
            processedRef.current = true;

            const hash = window.location.hash;
            if (hash && hash.includes('access_token')) {
                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken && refreshToken) {
                    try {
                        const { error } = await supabase.auth.setSession({
                            access_token: accessToken,
                            refresh_token: refreshToken,
                        });
                        if (error) throw error;
                    } catch (err: any) {
                        if (err.name !== 'AbortError') console.error("❌ Errore reale:", err);
                    }
                    try { await refreshUserData(); } catch (e) { }
                    window.history.replaceState(null, '', window.location.pathname);
                }
            }

            setTimeout(async () => {
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                    console.log("🔓 Sblocco interfaccia (Check Finale OK)");
                    setIsVerifying(false);
                } else {
                    // Se fallisce qui, non diamo errore fatale, lasciamo provare l'utente
                    setIsVerifying(false);
                }
            }, 500);
        };
        init();
    }, [contextUser, supabase, refreshUserData]);


    // --- 🔥 LA NUOVA FUNZIONE BLINDATA ---
    const handleSetNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(null);

        // 1. Rimuoviamo il check `getSession` qui. 
        // Se siamo arrivati a cliccare il bottone, siamo fiduciosi che la sessione ci sia.
        // Fare getSession qui aumentava il rischio di AbortError.

        let attempts = 0;
        const maxAttempts = 3;
        let success = false;

        // CICLO DI RIPROVA (RETRY LOOP)
        while (attempts < maxAttempts && !success) {
            try {
                console.log(`Tentativo aggiornamento password ${attempts + 1}/${maxAttempts}...`);

                const { error } = await supabase.auth.updateUser({ password });

                if (error) throw error; // Se è un errore API reale, va nel catch

                // Se arriviamo qui, ha funzionato!
                success = true;
                console.log("Password aggiornata!");
                router.push(appRoutes.passwordUpdatedSuccess);

            } catch (err: any) {
                // Se è l'errore di LOCK (AbortError), aspettiamo e riproviamo
                if (err.name === 'AbortError' || err.message?.includes('aborted')) {
                    console.warn(`⚠️ Conflitto Lock rilevato (Tentativo ${attempts + 1}). Attendo...`);
                    attempts++;
                    // Aspettiamo 800ms prima di riprovare per far "raffreddare" Supabase
                    await new Promise(resolve => setTimeout(resolve, 800));
                } else {
                    // Se è un errore vero (es. password troppo corta), usciamo subito
                    console.error("Errore update:", err);
                    setError("Errore: " + err.message);
                    setIsSubmitting(false);
                    return; // Stop
                }
            }
        }

        if (!success && attempts >= maxAttempts) {
            setError("Il sistema è momentaneamente occupato. Riprova tra pochi secondi.");
            setIsSubmitting(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                    <p>Accesso sicuro in corso...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900">
            <div className="w-full max-w-4xl flex min-h-[550px] bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <div className="hidden md:flex w-1/2 items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 p-12 text-white">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Manca davvero poco!</h1>
                        <p className="text-lg opacity-90">
                            Inserisci la tua nuova password per completare il reset.
                        </p>
                    </div>
                </div>

                <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Resetta la Password
                        </h2>
                        <p className="text-gray-300 mb-8">
                            Inserisci la tua nuova password e torna con noi.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSetNewPassword}>
                        <Input
                            id="password"
                            label="Nuova Password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Inserisci la tua nuova password"
                            value={password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            required
                        />

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full"
                        >
                            {isSubmitting ? 'Invio in corso...' : 'Invia Nuova Password'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}