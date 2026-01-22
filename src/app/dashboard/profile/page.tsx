'use client';


import { useState, useEffect, FormEvent, ChangeEvent, useCallback, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/actions/button";
import Input from "@/components/inputs/input";
import Navbar from "@/components/navigations/navbar";
import { useAuth } from "@/context/authProvider";
import { db, auth, storage } from "@/firebase/config";
import { PathItem } from "@/models/PathItem";
import { deleteUser, signOut } from "firebase/auth";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { FaSignOutAlt, FaTrash } from "react-icons/fa";
import PageTitle from "@/components/generics/page-title";
import Loader from "@/components/generics/loader";
import { appRoutes } from "@/utils/appRoutes";
import ActionStickyBar from "@/components/actions/action-sticky-bar";
import FormSection from "@/components/generics/form-section";
import { bytesToMb, getActivePlan } from "@/utils/planUtils";
import ProgressBar from "@/components/generics/progress-bar";
import { GrUpdate } from "react-icons/gr";
import { sendEmailToUpgrade } from "@/utils/openMailer";
import { EntityKeys } from "@/utils/entityKeys";
import { deleteObject, ref } from "firebase/storage";
import { Trip } from "@/models/Trip";
import DialogComponent from "@/components/modals/confirm-modal";
import { PlanDetails, PlanDetailsInstance, unlimited } from "@/configs/app-config";



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
    const [isReadOnly, setIsReadOnly] = useState<boolean>(true);
    const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
    const [openDeleteAccount, setOpenDeleteAccount] = useState<boolean>(false);
    const breadcrumbPaths: PathItem[] = [
        {
            label: 'I miei viaggi',
            href: appRoutes.home
        },
        {
            label: 'Profilo',
            href: appRoutes.profile
        }
    ];

    // Effetto per proteggere la rotta: attende la fine del caricamento
    useEffect(() => {
        // Agisce solo quando il caricamento iniziale è terminato
        if (!loading && !user) {
            router.push(appRoutes.login);
        }
    }, [user, loading, router]);

    // Effetto per popolare i campi del form quando i dati dal contesto sono pronti
    useEffect(() => {
        if (userData) {
            setFirstName(userData.firstName);
            setLastName(userData.lastName);
        }
    }, [userData]);


    const populateForm = useCallback(() => {
        setError(null);
        setFirstName(userData?.firstName || '');
        setLastName(userData?.lastName || '');
    }, [userData]);

    const handleCancel = () => {
        populateForm();
        setIsReadOnly(true);
    }

    const activePlan = useMemo(() => getActivePlan(userData), [userData]);


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


    async function deleteFullAccount(): Promise<{ success: boolean; error?: string }> {
        const user = auth.currentUser;

        if (!user) {
            return { success: false, error: "Utente non autenticato." };
        }

        const userId = user.uid;

        try {
            setIsDeletingAccount(true);
            // 1. RECUPERO TUTTI I VIAGGI DELL'UTENTE
            // Cerchiamo solo i viaggi dove l'utente è 'owner'
            const tripsRef = collection(db, EntityKeys.tripsKey);
            const q = query(tripsRef, where('owner', '==', userId));
            const tripsSnapshot = await getDocs(q);

            const deletePromises: Promise<unknown>[] = [];

            // 2. CICLO SUI VIAGGI PER ELIMINARE GLI ALLEGATI (STORAGE)
            for (const tripDoc of tripsSnapshot.docs) {
                const tripData = tripDoc.data() as Trip;

                // Analisi allegati nelle tappe
                tripData.stages?.forEach(stage => {
                    stage.attachments?.forEach(att => {
                        if (att.type === 'file' && att.url) {
                            const fileRef = ref(storage, att.url);
                            deletePromises.push(deleteObject(fileRef).catch(e => {
                                console.warn(`File non trovato o già rimosso: ${att.name}`, e);
                            }));
                        }
                    });
                });

                // Analisi allegati nei trasporti
                tripData.transports?.forEach(transport => {
                    transport.attachments?.forEach(att => {
                        if (att.type === 'file' && att.url) {
                            const fileRef = ref(storage, att.url);
                            deletePromises.push(deleteObject(fileRef).catch(e => {
                                console.warn(`File non trovato o già rimosso: ${att.name}`, e);
                            }));
                        }
                    });
                });

                // Aggiungiamo l'eliminazione del documento del viaggio stesso
                deletePromises.push(deleteDoc(doc(db, EntityKeys.tripsKey, tripDoc.id)));
            }

            // Attendiamo che tutti i file e i viaggi siano eliminati
            await Promise.all(deletePromises);

            // 3. ELIMINAZIONE DOCUMENTO USER (FIRESTORE)
            // Assumiamo che la collezione si chiami 'users' e il docId sia l'UID
            const userDocRef = doc(db, EntityKeys.usersKey, userId);
            await deleteDoc(userDocRef);

            // 4. ELIMINAZIONE PROFILO AUTH (FIREBASE AUTH)
            // Nota: questa operazione deve essere l'ultima.
            // Se fallisce per "requires-recent-login", l'utente deve rifare il login.
            await deleteUser(user);
            setIsDeletingAccount(false);
            return { success: true };

        } catch (error: { code: string } | unknown) {
            console.error("Errore durante l'eliminazione totale dell'account:", error);

            if ((error as { code: string }).code === 'auth/requires-recent-login') {
                return {
                    success: false,
                    error: "Per motivi di sicurezza, questa operazione richiede un accesso recente. Effettua il logout e rientra prima di eliminare l'account."
                };
            }

            return {
                success: false,
                error: (error as { message: string }).message || "Si è verificato un errore durante la cancellazione dei dati."
            };
        }
    }


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
                breadcrumb={breadcrumbPaths}
            />

            <DialogComponent
                isOpen={openDeleteAccount}
                onClose={() => setOpenDeleteAccount(false)}
                title="Conferma Eliminazione"
                isLoading={isDeletingAccount}
                confirmText="Elimina"
                cancelText="Annulla"
                onConfirm={deleteFullAccount}
            >
                <p>Sei sicuro di voler eliminare il tuo account?</p>
                <p>Elimineremo tutti i dati associati e non potrai recuperarli.</p>
            </DialogComponent>

            <main className="p-6">
                <PageTitle title="Il Tuo Profilo" subtitle="Gestisci le tue informazioni personali." />
                <form className="space-y-6" onSubmit={handleUpdateProfile}>
                    <FormSection title="Informazioni Personali"  >
                        <Input
                            className="mb-6"
                            id="email"
                            label="Indirizzo Email"
                            type="email"
                            value={userData?.email || ''}
                            readOnly
                        />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <Input
                                id="firstName"
                                label="Nome"
                                type="text"
                                value={firstName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                                required
                                readOnly={isReadOnly}
                            />
                            <Input
                                id="lastName"
                                label="Cognome"
                                type="text"
                                value={lastName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                                required
                                readOnly={isReadOnly}
                            />
                        </div>
                    </FormSection>

                    <FormSection title="Il mio piano">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <Input
                                id="activePlan"
                                label="Piano Attivo"
                                type="text"
                                value={activePlan.name.toUpperCase()}
                                required
                                readOnly={true}
                            />
                            <Input
                                id="maxFileSizeInMb"
                                label="Memoria Piano"
                                type="text"
                                value={activePlan.totalStorageLimitMb + " MB"}
                                required
                                readOnly={true}
                            />
                            <Input
                                id="maxFileSizeInMb"
                                label="Dimensione Massima Singolo File"
                                type="text"
                                value={activePlan.maxFileSizeInMb + " MB"}
                                required
                                readOnly={true}
                            />
                            <Input
                                id="maxTrips"
                                label="Creazione Viaggi Consentiti"
                                type="text"
                                value={`${activePlan.maxTrips === unlimited ? 'Illimitati' : activePlan.maxTrips}`}
                                required
                                readOnly={true}
                            />
                            <Input
                                id="maxTrips"
                                label="Scadenza Piano"
                                type="text"
                                value={userData?.expirationPlanDate ? new Date(userData.expirationPlanDate.seconds * 1000).toLocaleDateString() : ''}
                                required
                                readOnly={true}
                            />
                        </div>
                    </FormSection>

                    <FormSection title="Il mio utilizzo">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <Input
                                id="activePlan"
                                label="Viaggi Creati"
                                type="text"
                                value={`${(userData?.totalTripsCreated ?? 0)} `}
                                required
                                readOnly={true}
                            />
                            <Input
                                id="activePlan"
                                label="Viaggi Disponibili"
                                type="text"
                                value={`${activePlan.maxTrips === unlimited ? 'Illimitati' : activePlan.maxTrips - (userData?.totalTripsCreated ?? 0)} `}
                                required
                                readOnly={true}
                            />
                        </div>
                        <div className="w-full">
                            <ProgressBar
                                value={parseFloat(bytesToMb(userData?.totalStorageUsedInBytes ?? 0).toFixed(2))}
                                total={activePlan.totalStorageLimitMb}
                                label="Memoria Disponibile"
                                showValue={true}
                                unitMeasure="MB"
                            />
                        </div>
                    </FormSection>

                    <FormSection title="Azioni Account">

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Contattaci per aggiornare il tuo piano e ottenere più funzionalità.
                        </p>
                        <div className="w-full mb-6">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    sendEmailToUpgrade(`${userData?.firstName} ${userData?.lastName}`, userData?.email || '')
                                }}
                                className="mt-4 w-50">
                                <GrUpdate className="mr-2" />


                                Aggiorna il Piano
                            </Button>

                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Eliminando il tuo account, tutti i dati associati verranno rimossi in modo permanente.
                        </p>
                        <div className="w-full mb-6">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenDeleteAccount(true) }}
                                className="mt-4 w-50"
                            >
                                <FaTrash className="mr-2" /> Elimina Account
                            </Button>

                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Puoi effettuare il logout dal tuo account in modo sicuro.
                        </p>
                        <div className="w-full mb-6">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleLogout()
                                }} className="mt-4 w-50"
                            >
                                <FaSignOutAlt className="mr-2" /> Logout
                            </Button>

                        </div>


                    </FormSection>



                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}


                    {
                        !isReadOnly && (
                            <ActionStickyBar
                                handleCancel={handleCancel}
                                isSubmitting={isUpdating}
                                isNew={false}
                            />
                        )
                    }
                </form>

            </main>
        </div>
    );
}



