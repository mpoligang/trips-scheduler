'use client';

import { useState, useEffect, FormEvent, ChangeEvent, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/actions/button";
import Input from "@/components/inputs/input";
import Navbar from "@/components/navigations/navbar";
import { useAuth } from "@/context/authProvider";
import { createClient } from "@/lib/client"; // ✅ Client Supabase
import { PathItem } from "@/models/PathItem";
import { FaSignOutAlt, FaTrash, FaPen, FaUndo } from "react-icons/fa";
import PageTitle from "@/components/generics/page-title";
import Loader from "@/components/generics/loader";
import { appRoutes } from "@/utils/appRoutes";
import ActionStickyBar from "@/components/actions/action-sticky-bar";
import FormSection from "@/components/generics/form-section";
import { bytesToMb } from "@/utils/fileSizeUtils";
import ProgressBar from "@/components/generics/progress-bar";
import { GrUpdate } from "react-icons/gr";
import { sendEmailToUpgrade } from "@/utils/openMailer";
import DialogComponent from "@/components/modals/confirm-modal";
import ContextMenu, { ContextMenuItem } from "@/components/actions/context-menu";
import { Attachment } from "@/models/Attachment";

export default function ProfilePage() {
    const router = useRouter();
    const supabase = createClient();
    const { user, userData, refreshUserData } = useAuth();

    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isReadOnly, setIsReadOnly] = useState<boolean>(true);
    const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);
    const [openDeleteAccount, setOpenDeleteAccount] = useState<boolean>(false);

    const breadcrumbPaths: PathItem[] = [
        { label: 'I miei viaggi', href: appRoutes.home },
        { label: 'Profilo', href: appRoutes.profile }
    ];



    useEffect(() => {
        if (userData) {
            setFirstName(userData.first_name || '');
            setLastName(userData.last_name || '');
        }
    }, [userData]);

    const populateForm = useCallback(() => {
        setError(null);
        setFirstName(userData?.first_name || '');
        setLastName(userData?.last_name || '');
    }, [userData]);

    const handleCancel = () => {
        populateForm();
        setIsReadOnly(true);
    }

    // Business Logic: Il piano arriva dalla join nell'AuthProvider
    const activePlan = userData?.plan;

    const handleUpdateProfile = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user || isUpdating) return;

        setError(null);
        setSuccessMessage(null);
        setIsUpdating(true);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    first_name: firstName,
                    last_name: lastName,
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setSuccessMessage("Profilo aggiornato con successo!");
            await refreshUserData();
            setIsReadOnly(true);
        } catch (err) {
            console.error("Errore aggiornamento:", err);
            setError("Impossibile aggiornare il profilo. Riprova.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error("Errore logout:", error);
        }
    };

    async function deleteFullAccount() {
        if (!user) return;
        try {
            setIsDeletingAccount(true);

            // 1. Pulizia Storage (Hacker-proof)
            const { data: attachments } = await supabase
                .from('attachments')
                .select('storage_path')
                .eq('trip_id', user.id);

            if (attachments && attachments.length > 0) {
                const paths = attachments.map(a => a.storage_path).filter(Boolean) as string[];
                await supabase.storage.from('attachments').remove(paths);
            }

            // 2. Delete Profilo (Cascade delete gestirà il resto nel DB)
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

            if (profileError) throw profileError;

            await handleLogout();
        } catch (error: any) {
            console.error("Errore eliminazione:", error);
            setError("Errore durante la cancellazione dei dati.");
        } finally {
            setIsDeletingAccount(false);
        }
    }

    // --- CONTEXT MENU ITEMS ---
    const menuItems: ContextMenuItem[] = [
        {
            label: isReadOnly ? 'Modifica' : 'Annulla',
            icon: isReadOnly ? <FaPen /> : <FaUndo />,
            onClick: () => {
                if (isReadOnly) setIsReadOnly(false);
                else handleCancel();
            }
        },
        {
            label: 'Logout',
            icon: <FaSignOutAlt />,
            onClick: handleLogout
        },
        {
            label: 'Elimina Account',
            icon: <FaTrash />,
            onClick: () => setOpenDeleteAccount(true),
            className: 'text-red-500 hover:bg-red-50'
        }
    ];

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Navbar breadcrumb={breadcrumbPaths} />

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
                <PageTitle title="Il Tuo Profilo" subtitle="Gestisci le tue informazioni personali.">
                    <ContextMenu items={menuItems} />
                </PageTitle>

                <form className="space-y-6" onSubmit={handleUpdateProfile}>
                    <FormSection title="Informazioni Personali">
                        <Input
                            className="mb-6"
                            id="email"
                            label="Indirizzo Email"
                            type="email"
                            value={user?.email || ''}
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
                                value={activePlan?.name?.toUpperCase() || 'FREE'}
                                required
                                readOnly={true}
                            />
                            <Input
                                id="maxStorage"
                                label="Memoria Piano"
                                type="text"
                                value={(activePlan?.storage_limit_bytes ? bytesToMb(activePlan.storage_limit_bytes) : 10) + " MB"}
                                required
                                readOnly={true}
                            />
                            <Input
                                id="maxFileSize"
                                label="Dimensione Massima Singolo File"
                                type="text"
                                value={(activePlan?.max_file_size_bytes ? bytesToMb(activePlan.max_file_size_bytes) : 2) + " MB"}
                                required
                                readOnly={true}
                            />
                            <Input
                                id="maxTrips"
                                label="Creazione Viaggi Consentiti"
                                type="text"
                                value={`${activePlan?.max_trips || 'Illimitati'}`}
                                required
                                readOnly={true}
                            />
                            <Input
                                id="expiration"
                                label="Scadenza Piano"
                                type="text"
                                value={userData?.expiration_plan_date ? new Date(userData.expiration_plan_date).toLocaleDateString() : ''}
                                required
                                readOnly={true}
                            />
                        </div>
                    </FormSection>

                    <FormSection title="Il mio utilizzo">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <Input
                                id="tripsCreated"
                                label="Viaggi Creati"
                                type="text"
                                value={`${(userData?.total_trips_created ?? 0)} `}
                                required
                                readOnly={true}
                            />
                            <Input
                                id="tripsAvailable"
                                label="Viaggi Disponibili"
                                type="text"
                                value={`${activePlan?.max_trips ? activePlan.max_trips - (userData?.total_trips_created ?? 0) : 'Illimitati'} `}
                                required
                                readOnly={true}
                            />
                        </div>
                        <div className="w-full">
                            <ProgressBar
                                value={parseFloat(bytesToMb(userData?.total_storage_used_in_bytes ?? 0).toFixed(2))}
                                total={activePlan?.storage_limit_bytes ? bytesToMb(activePlan.storage_limit_bytes) : 10}
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
                                onClick={() => sendEmailToUpgrade(`${userData?.first_name} ${userData?.last_name}`, user?.email || '')}
                                className="mt-4 w-50"
                            >
                                <GrUpdate className="mr-2" /> Aggiorna il Piano
                            </Button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Eliminando il tuo account, tutti i dati associati verranno rimossi in modo permanente.
                        </p>
                        <div className="w-full mb-6">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setOpenDeleteAccount(true)}
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
                                onClick={handleLogout}
                                className="mt-4 w-50"
                            >
                                <FaSignOutAlt className="mr-2" /> Logout
                            </Button>
                        </div>
                    </FormSection>

                    {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</p>}
                    {successMessage && <p className="text-green-500 text-sm text-center font-medium bg-green-50 p-2 rounded">{successMessage}</p>}

                    {!isReadOnly && (
                        <ActionStickyBar
                            handleCancel={handleCancel}
                            isSubmitting={isUpdating}
                            isNew={false}
                        />
                    )}
                </form>
            </main>
        </div>
    );
}