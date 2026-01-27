'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import { appRoutes } from '@/utils/appRoutes';
import { updatePasswordAction } from '@/actions/auth-actions';
import Logo from '@/components/generics/logo';
import { ImSpinner8 } from 'react-icons/im';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stato solo per le stringhe dei token
    const [tokens, setTokens] = useState<{ access: string; refresh: string } | null>(null);

    useEffect(() => {
        // Logica PURA JS: Leggi l'URL e basta. Niente Supabase SDK.
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
            const params = new URLSearchParams(hash.substring(1));
            const access = params.get('access_token');
            const refresh = params.get('refresh_token');
            if (access && refresh) {
                setTokens({ access, refresh });
                window.history.replaceState(null, '', window.location.pathname);
            }
        }
    }, []);

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        setError(null);

        const result = await updatePasswordAction(formData);

        if (result?.error) {
            setError(result.error);
            setIsSubmitting(false);
        } else {
            router.push(appRoutes.passwordUpdatedSuccess);
        }
    };

    if (!tokens) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
                <div className="flex flex-col items-center gap-4">
                    <p>Verifica in corso...</p>
                    <p className="text-sm text-gray-400">Se non succede nulla, richiedi una nuova email di reset.</p>
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
                        <p className="text-lg opacity-90">Inserisci la tua nuova password e torna insieme a noi.</p>
                    </div>
                </div>

                <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                    <Logo className="mb-4 flex justify-center" />
                    <h2 className="text-3xl font-bold text-white text-center mb-4">Reset Password</h2>
                    <p className="text-center text-gray-300 mb-0">Inserisci una password nuova</p>


                    <div className="flex items-center my-10">
                        <hr className="flex-grow border-gray-600" />
                        <hr className="flex-grow border-gray-600" />
                    </div>

                    <form className="space-y-6" action={handleSubmit}>
                        <input type="hidden" name="accessToken" value={tokens.access} />
                        <input type="hidden" name="refreshToken" value={tokens.refresh} />
                        <Input
                            id="password"
                            name="password"
                            label="Nuova Password"
                            type="password"
                            placeholder="Minimo 6 caratteri"
                            required
                        />

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}


                        <Button type="submit" disabled={isSubmitting}>
                            <ImSpinner8 className={`animate-spin mr-2 ${isSubmitting ? 'inline-block' : 'hidden'}`} />
                            Salva Password
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}