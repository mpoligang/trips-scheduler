'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/client'; // ✅ Client Supabase
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import { appRoutes } from '@/utils/appRoutes';

export default function ForgotPasswordPage() {
    const supabase = createClient();
    const [email, setEmail] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * ✅ REFACTOR LOGIC: Supabase Auth Reset
     */
    const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return;

        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            // Supabase invia un link magico. 
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/api/reset-password-callback`,
            });

            if (resetError) throw resetError;

            setSuccessMessage("Email inviata! Controlla la tua casella di posta per le istruzioni.");
        } catch (err: any) {
            console.error("Errore reset password:", err.message);
            // Supabase per motivi di sicurezza non dice sempre se l'email esiste o no (anti-enumeration)
            // Gestiamo un errore generico o specifico se disponibile
            if (err.message.includes("rate limit")) {
                setError("Troppe richieste. Riprova tra qualche minuto.");
            } else {
                setError("Si è verificato un errore durante l'invio. Riprova.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900">
            <div className="w-full max-w-4xl flex min-h-[550px] bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                {/* --- Sezione Sinistra: Immagine/Gradiente (UI ORIGINALE) --- */}
                <div className="hidden md:flex w-1/2 items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 p-12 text-white">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Password Dimenticata?</h1>
                        <p className="text-lg opacity-90">
                            Nessun problema. Inserisci la tua email e ti aiuteremo a recuperare il tuo account.
                        </p>
                    </div>
                </div>

                {/* --- Sezione Destra: Form di Reset (UI ORIGINALE) --- */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Resetta la Password
                        </h2>
                        <p className="text-gray-300 mb-8">
                            Inserisci la tua email per ricevere le istruzioni.
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleResetPassword}>
                        <Input
                            id="email"
                            label="Indirizzo Email"
                            type="email"
                            autoComplete="email"
                            placeholder="mario.rossi@email.com"
                            value={email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            required
                        />

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? 'Invio in corso...' : 'Invia Email di Reset'}
                        </Button>

                        <p className="text-center text-sm text-gray-400 mt-8">
                            Ricordi la password?{' '}
                            <Link href={appRoutes.login} className="font-medium hover:underline text-purple-400">
                                Torna al Login
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}