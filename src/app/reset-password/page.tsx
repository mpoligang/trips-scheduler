// @/app/reset-password/page.tsx
'use client';

import { useState, ChangeEvent } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import { appRoutes } from '@/utils/appRoutes';

export default function ResetPasswordPage() {
    const supabase = createClient();
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);


    const handleSetNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError("Errore aggiornamento: " + error.message);
            setIsSubmitting(false);
        } else {
            setSuccess("Password aggiornata correttamente! Verrai reindirizzato al login...");
            router.push(appRoutes.login);
        }
    };





    return (<div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="w-full max-w-4xl flex min-h-[550px] bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
            {/* --- Sezione Sinistra: Immagine/Gradiente (UI ORIGINALE) --- */}
            <div className="hidden md:flex w-1/2 items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 p-12 text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Manca davvero poco!</h1>
                    <p className="text-lg opacity-90">
                        Inserisci la tua nuova password per completare il reset.
                    </p>
                </div>
            </div>

            {/* --- Sezione Destra: Form di Reset (UI ORIGINALE) --- */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        Resetta la Password
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
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
                    {success && <p className="text-green-500 text-sm text-center">{success}</p>}


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