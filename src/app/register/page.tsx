'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { FaGoogle } from 'react-icons/fa';
import { auth, db } from '@/firebase/config';
import Button from '@/components/button';
import Input from '@/components/input';
import { FirebaseError } from 'firebase/app';

export default function RegisterPage() {
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const router = useRouter();

    // Gestore per la registrazione con Email e Password
    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return;

        if (password !== confirmPassword) {
            setError("Le password non coincidono.");
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                firstName: firstName,
                lastName: lastName,
                email: user.email,
            });

            router.push('/dashboard');
        } catch (err: unknown) {
            const code = (err as FirebaseError).code
            console.error("Errore Firebase:", code);
            if (code === 'auth/email-already-in-use') {
                setError("Questo indirizzo email è già in uso.");
            } else if (code === 'auth/weak-password') {
                setError("La password deve essere di almeno 6 caratteri.");
            } else {
                setError("Si è verificato un errore durante la registrazione.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Gestore per la registrazione con Google
    const handleGoogleRegister = async () => {
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

            // Se il documento non esiste, crea un nuovo utente in Firestore
            if (!userDoc.exists()) {
                const nameParts = user.displayName?.split(" ") || ["", ""];
                const fName = nameParts[0];
                const lName = nameParts.slice(1).join(" ");

                await setDoc(userDocRef, {
                    uid: user.uid,
                    firstName: fName,
                    lastName: lName,
                    email: user.email,
                });
            }

            router.push('/dashboard');

        } catch (error: unknown) {
            console.error("Errore con Google Sign-In:", error);
            setError("Impossibile registrarsi con Google. Riprova.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-4xl flex h-auto min-h-[600px] bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                {/* --- Sezione Sinistra --- */}
                <div className="hidden md:flex w-1/2 items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 p-12 text-white">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Unisciti a Noi</h1>
                        <p className="text-lg opacity-90">
                            Crea un account per iniziare a salvare i tuoi viaggi preferiti.
                        </p>
                    </div>
                </div>

                {/* --- Sezione Destra --- */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-4">
                        Crea il tuo Account
                    </h2>
                    <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                        Inizia gratuitamente
                    </p>

                    <Button className="mb-6" variant="secondary" onClick={handleGoogleRegister}
                        disabled={isLoading}>
                        <FaGoogle className="text-gray-700 dark:text-gray-200" />
                        <span className="ml-2">Registrati con Google</span>
                    </Button>


                    <div className="flex items-center mb-6">
                        <hr className="flex-grow border-gray-300 dark:border-gray-600" />
                        <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">oppure</span>
                        <hr className="flex-grow border-gray-300 dark:border-gray-600" />
                    </div>

                    <form onSubmit={handleRegister}>
                        <div className="flex gap-4 mb-4">
                            <div className="w-1/2">

                                <Input
                                    label='Nome'
                                    type="text"
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="w-1/2">
                                <Input
                                    label='Cognome'
                                    type="text"
                                    id="lastName"
                                    value={lastName}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="mb-4">

                            <Input
                                label='Indirizzo Email'
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">

                            <Input
                                label='Password'
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <Input
                                label='Conferma Password'
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                        <Button disabled={isLoading} size="default">
                            {isLoading ? 'Creazione account...' : 'Registra Account'}
                        </Button>


                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
                            Hai già un account?{' '}
                            <a href="/login" className="font-medium text-purple-600 hover:underline dark:text-purple-400">
                                Accedi
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
