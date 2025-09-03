'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { FaGoogle } from 'react-icons/fa';
import { auth, db } from '@/firebase/config';
import Button from '@/components/button';
import Input from '@/components/input';

export default function LoginPage() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const router = useRouter();

    // Gestore per il login con Email e Password
    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return;

        setError(null);
        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
        } catch (err: any) {
            console.error("Errore di login:", err.code);
            setError("Email o password non validi. Riprova.");
        } finally {
            setIsLoading(false);
        }
    };

    // Gestore per il login/registrazione con Google
    const handleGoogleLogin = async () => {
        if (isLoading) return;
        setError(null);
        setIsLoading(true);
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Controlla se l'utente esiste già in Firestore
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);

            // Se il documento non esiste, è il primo login: crealo.
            if (!userDoc.exists()) {
                const nameParts = user.displayName?.split(" ") || ["", ""];
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(" ");

                await setDoc(userDocRef, {
                    uid: user.uid,
                    firstName: firstName,
                    lastName: lastName,
                    email: user.email,
                });
            }

            router.push('/dashboard');

        } catch (error: any) {
            console.error("Errore con Google Sign-In:", error);
            setError("Impossibile accedere con Google. Riprova.");
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
                        <h1 className="text-4xl font-bold mb-4">Bentornato!</h1>
                        <p className="text-lg opacity-90">
                            Accedi per continuare a pianificare i tuoi viaggi e scoprire nuove avventure.
                        </p>
                    </div>
                </div>

                {/* --- Sezione Destra: Form di Login --- */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-4">
                        Accedi al tuo account
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
                        Usa la tua email o un social per continuare
                    </p>

                    {/* Pulsante Google */}
                    <Button
                        variant="secondary"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="flex items-center justify-center w-full py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaGoogle className="text-gray-700 dark:text-gray-200" />
                        <span className="ml-2 ">Accedi con Google</span>
                    </Button>

                    <div className="flex items-center my-6">
                        <hr className="flex-grow border-gray-300 dark:border-gray-600" />
                        <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">oppure</span>
                        <hr className="flex-grow border-gray-300 dark:border-gray-600" />
                    </div>

                    {/* Form Email/Password */}
                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <Input
                                label='  Indirizzo Email'
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-6">

                            <Input
                                label='Password'
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                required
                            />
                            <div className="flex justify-between items-center mt-2">
                                <a href="#" className="text-xs text-purple-600 hover:underline dark:text-purple-400">
                                    Password dimenticata?
                                </a>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Accesso in corso...' : 'Accedi'}
                        </Button>

                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
                            Non hai un account?{' '}
                            <a href="/register" className="font-medium text-purple-600 hover:underline dark:text-purple-400">
                                Registrati
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
