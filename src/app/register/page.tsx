'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signUpAction } from '@/actions/auth-actions';
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import { appRoutes } from '@/utils/appRoutes';
import Logo from '@/components/generics/logo';
import Checkbox from '@/components/inputs/checkbox';
import { ImSpinner8 } from 'react-icons/im';

export default function RegisterPage() {
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
    const router = useRouter();

    // REGISTRAZIONE EMAIL/PASSWORD (Via Server Action)
    const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isLoading) return;

        if (password !== confirmPassword) {
            setError("Le password non coincidono.");
            return;
        }

        if (!termsAccepted) {
            setError("Devi accettare i termini e le condizioni.");
            return;
        }

        setError(null);
        setIsLoading(true);

        // Prepariamo i dati per la Server Action
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);

        try {
            const result = await signUpAction(formData);

            if (result?.error) {
                setError(result.error);
            } else if (result?.confirmEmail) {
                router.push(appRoutes.verifyEmail);
                return;
            } else {
                router.push(appRoutes.home);
            }
        } catch (err) {
            console.error("Errore durante la registrazione:", err);
            setError("Si è verificato un errore imprevisto.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900">
            <div className="w-full max-w-4xl flex h-auto min-h-[600px] bg-gray-800 shadow-lg rounded-lg overflow-hidden">

                {/* --- Sezione Sinistra --- */}
                <div className="hidden md:flex w-1/2 items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 p-12 text-white">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Unisciti a Noi</h1>
                        <p className="text-lg opacity-90">Crea un account per iniziare a salvare i tuoi viaggi preferiti.</p>
                    </div>
                </div>

                {/* --- Sezione Destra --- */}
                <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                    <Logo className="mb-4 flex justify-center" />

                    <h2 className="text-3xl font-bold text-white text-center mb-4">Crea il tuo Account</h2>
                    <p className="text-center text-gray-400 mb-0">Inizia gratuitamente</p>

                    {/* <Button className="mb-6" variant="secondary" onClick={handleGoogleRegister} disabled={isLoading}>
                        <FaGoogle className="text-gray-700 dark:text-gray-200" />
                        <span className="ml-2">Registrati con Google</span>
                    </Button> */}

                    <div className="flex items-center my-10">
                        <hr className="flex-grow border-gray-600" />
                        {/* <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">oppure</span> */}
                        <hr className="flex-grow border-gray-600" />
                    </div>

                    <form onSubmit={handleRegister}>
                        <div className="flex gap-4 mb-4">
                            <div className="w-1/2">
                                <Input label='Nome' type="text" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                            </div>
                            <div className="w-1/2">
                                <Input label='Cognome' type="text" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                            </div>
                        </div>

                        <div className="mb-4">
                            <Input label='Indirizzo Email' type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>

                        <div className="mb-4">
                            <Input label='Password' type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>

                        <div className="mb-6">
                            <Input label='Conferma Password' type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </div>

                        <div className="mb-6">
                            <Checkbox id="terms" checked={termsAccepted} onChange={(e) => setTermsAccepted(e)} required>
                                <span className="text-sm text-slate-400">Accetto i termini e le condizioni</span>
                            </Checkbox>
                        </div>

                        {error && <p className={`text-sm text-center mb-4 ${error.includes('riuscita') ? 'text-green-500' : 'text-red-500'}`}>{error}</p>}

                        <Button type="submit" disabled={isLoading}>
                            <ImSpinner8 className={`animate-spin mr-2 ${isLoading ? 'inline-block' : 'hidden'}`} />
                            Crea Account
                        </Button>

                        <p className="text-center text-sm text-gray-400 mt-8">
                            Hai già un account?{' '}
                            <a href={appRoutes.login} className="font-medium text-purple-400 hover:underline">Accedi</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}