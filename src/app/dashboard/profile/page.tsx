'use client';


import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/button";
import Input from "@/components/input";
import Navbar from "@/components/navbar";
import { useAuth } from "@/context/authProvider";
import { db, auth } from "@/firebase/config";
import { PathItem } from "@/models/PathItem";
import { signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { FaSignOutAlt } from "react-icons/fa";
import PageTitle from "@/components/page-title";
import Loader from "@/components/loader";



export default function ProfilePage() {
    // Ottiene TUTTO dal contesto: stato di caricamento, utente e dati del profilo
    const router = useRouter();
    const { user, userData, loading } = useAuth();

    // Stati locali solo per il form
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const breadcrumbPaths: PathItem[] = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Profilo', href: '/profile' }
    ];

    // Effetto per proteggere la rotta: attende la fine del caricamento
    useEffect(() => {
        // Agisce solo quando il caricamento iniziale è terminato
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading]);

    // Effetto per popolare i campi del form quando i dati dal contesto sono pronti
    useEffect(() => {
        if (userData) {
            setFirstName(userData.firstName);
            setLastName(userData.lastName);
        }
    }, [userData]);


    const handleUpdateProfile = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || isUpdating) return;

        setError(null);
        setSuccessMessage(null);
        setIsUpdating(true);

        try {
            const userDocRef = doc(db, "users", user.uid);
            await updateDoc(userDocRef, {
                firstName: firstName,
                lastName: lastName,
            });
            setSuccessMessage("Profilo aggiornato con successo!");
            location.reload();
        } catch (err) {
            console.error("Errore di aggiornamento:", err);
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

    // Schermata di caricamento mostrata finché il contesto non ha finito
    if (loading) {
        return <Loader />;
    }

    // Non renderizzare nulla se l'utente non è autenticato (per evitare flash di contenuto)
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar
                backPath="/dashboard"
                breadcrumb={breadcrumbPaths}
            />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
                    <PageTitle title="Il Tuo Profilo" subtitle="Gestisci le tue informazioni personali." />


                    <form className="space-y-6" onSubmit={handleUpdateProfile}>
                        <Input
                            id="email"
                            label="Indirizzo Email"
                            type="email"
                            value={userData?.email || ''}
                            disabled
                        />
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="w-full sm:w-1/2">
                                <Input
                                    id="firstName"
                                    label="Nome"
                                    type="text"
                                    value={firstName}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="w-full sm:w-1/2">
                                <Input
                                    id="lastName"
                                    label="Cognome"
                                    type="text"
                                    value={lastName}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}

                        <div className="flex justify-end gap-4 md:flex-row flex-col">
                            <Button
                                className='md:w-auto w-full'
                                type="submit"
                                disabled={isUpdating}
                            >
                                {isUpdating ? 'Salvataggio...' : 'Salva Modifiche'}
                            </Button>
                            <Button
                                className='md:w-auto w-full'
                                variant="secondary"
                                onClick={handleLogout}
                            >
                                <FaSignOutAlt />
                                <span className="ml-2">Logout</span>
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

