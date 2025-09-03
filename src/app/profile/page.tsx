'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/context/authProvider';
import { db, auth } from '@/firebase/config';
import { UserData } from '@/models/UserData';



export default function ProfilePage() {
    const { user } = useAuth();
    const router = useRouter();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (user === null) {
            router.push('/login');
            return;
        }
        if (user) {
            const fetchUserData = async () => {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const data = userDoc.data() as UserData;
                        setUserData(data);
                        setFirstName(data.firstName);
                        setLastName(data.lastName);
                    } else {
                        setError("Dati utente non trovati.");
                    }
                } catch (err) {
                    setError("Impossibile caricare i dati del profilo.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchUserData();
        }
    }, [user, router]);

    const handleUpdateProfile = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || isUpdating) return;

        setError(null);
        setSuccessMessage(null);
        setIsUpdating(true);

        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, { firstName, lastName });
            setSuccessMessage("Profilo aggiornato con successo!");
            setTimeout(() => setSuccessMessage(null), 3000); // Nasconde il messaggio dopo 3 secondi
        } catch (err) {
            setError("Impossibile aggiornare il profilo. Riprova.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error("Errore durante il logout:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                <p className="text-lg text-gray-700 dark:text-gray-200 animate-pulse">Caricamento...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* --- Barra di Navigazione --- */}
            <header className="w-full bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
                <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/dashboard" className="text-lg font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300">
                            ← Torna alla Dashboard
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            Logout
                        </button>
                    </div>
                </nav>
            </header>

            {/* --- Contenuto Principale --- */}
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 space-y-8">
                    <div>
                        <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                            Il Tuo Profilo
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                            Aggiorna le tue informazioni personali.
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleUpdateProfile}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="email" className="sr-only">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={userData?.email || ''}
                                    disabled
                                    className="appearance-none rounded-t-md relative block w-full px-3 py-3 border border-gray-300 bg-gray-200 text-gray-500 placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                                    placeholder="Indirizzo Email"
                                />
                            </div>
                            <div className="flex gap-px">
                                <div className="w-1/2">
                                    <label htmlFor="firstName" className="sr-only">Nome</label>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        value={firstName}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                                        required
                                        className="appearance-none rounded-bl-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                        placeholder="Nome"
                                    />
                                </div>
                                <div className="w-1/2">
                                    <label htmlFor="lastName" className="sr-only">Cognome</label>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        value={lastName}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                                        required
                                        className="appearance-none rounded-br-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                        placeholder="Cognome"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={isUpdating}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? 'Salvataggio...' : 'Salva Modifiche'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

