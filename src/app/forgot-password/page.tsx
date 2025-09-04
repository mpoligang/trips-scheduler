'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import Button from '@/components/button';
import Input from '@/components/input';
import { auth } from '@/firebase/config';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Gestore per l'invio della richiesta di reset password
    const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) { return };
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMessage("Email inviata! Controlla la tua casella di posta per le istruzioni.");
        } catch (err: any) {
            console.error("Errore reset password:", err.code);
            if (err.code === 'auth/user-not-found') {
                setError("Nessun utente trovato con questo indirizzo email.");
            } else {
                setError("Si è verificato un errore. Riprova più tardi.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-4xl flex min-h-[550px] bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                {/* --- Sezione Sinistra: Immagine/Gradiente --- */}
                <div className="hidden md:flex w-1/2 items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 p-12 text-white">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Password Dimenticata?</h1>
                        <p className="text-lg opacity-90">
                            Nessun problema. Inserisci la tua email e ti aiuteremo a recuperare il tuo account.
                        </p>
                    </div>
                </div>

                {/* --- Sezione Destra: Form di Reset --- */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                            Resetta la Password
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-8">
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

                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
                            Ricordi la password?{' '}
                            <Link href="/login" className="font-medium text-purple-600 hover:underline dark:text-purple-400">
                                Torna al Login
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}

