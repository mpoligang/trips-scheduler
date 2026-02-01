'use client';

import { useState, FormEvent } from 'react';
import { signInAction, signInWithGoogleAction } from '@/actions/auth-actions';
import Button from '@/components/actions/button';
import Input from '@/components/inputs/input';
import { appRoutes } from '@/utils/appRoutes';
import Logo from '@/components/generics/logo';
import { ImSpinner8 } from "react-icons/im";
import { FaGoogle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function LoginPage() {

    const router = useRouter();

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {

        e.preventDefault();
        if (isLoading) { return; }

        if (!email || !password) {
            toast.error("Compila tutti i campi richiesti.");
            return;
        }

        setIsLoading(true);

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        try {
            const result = await signInAction(formData);

            if (result?.error) {
                toast.error(result.error);
                setIsLoading(false);
            } else if (result?.success) {
                toast.success(`Login effettuato!`);
                router.push(appRoutes.home);
                router.refresh();
            }
        } catch {
            toast.error("Errore imprevisto. Riprova.");
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-900">
            <div className="w-full max-w-4xl flex min-h-[550px] bg-gray-800 shadow-lg rounded-lg overflow-hidden">

                <div className="hidden md:flex w-1/2 items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 p-12 text-white">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-4">Bentornato!</h1>
                        <p className="text-lg opacity-90">Accedi per continuare a pianificare i tuoi viaggi.</p>
                    </div>
                </div>

                <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                    <Logo className="mb-4 flex justify-center" />

                    <h2 className="text-3xl font-bold text-white text-center mb-4">Accedi</h2>
                    <p className="text-center text-gray-300 mb-0">Inserisci le tue credenziali per accedere</p>

                    <Button className="mt-5" variant="secondary" onClick={signInWithGoogleAction} disabled={isLoading}>
                        <FaGoogle className="text-gray-700 dark:text-gray-200" />
                        <span className="ml-2">Accedi con Google</span>
                    </Button>

                    <div className="flex items-center my-5">
                        <hr className="flex-grow border-gray-600" />
                        <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">oppure</span>
                        <hr className="flex-grow border-gray-600" />
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <Input label='Indirizzo Email' type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="mb-6">
                            <Input label='Password' type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            <div className="flex justify-end mt-2">
                                <a href={appRoutes.forgotPassword} className="text-xs font-medium hover:underline text-purple-400">
                                    Password dimenticata?
                                </a>
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading}>
                            <ImSpinner8 className={`animate-spin mr-2 ${isLoading ? 'inline-block' : 'hidden'}`} />
                            Accedi
                        </Button>

                        <p className="text-center text-sm text-gray-400 mt-8">
                            Non hai un account?{' '}
                            <a href={appRoutes.register} className="font-medium hover:underline text-purple-400">Registrati</a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}