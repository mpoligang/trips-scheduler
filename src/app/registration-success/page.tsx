'use client';

import Link from 'next/link';
import { GoShieldCheck } from "react-icons/go";
import Logo from '@/components/generics/logo';
import Button from '@/components/actions/button';
import { FaArrowRight } from 'react-icons/fa';
import { appRoutes } from '@/utils/appRoutes';

export default function RegistrationSuccessPage() {

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 font-sans text-gray-100">

            <div className="w-full max-w-md relative z-10">
                {/* Logo più discreto */}


                {/* Card Compatta */}
                <div className="bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-800 text-center">
                    <div className="flex justify-center mb-8 opacity-90">
                        <Logo className="h-8 w-auto" />
                    </div>
                    {/* Icona ridimensionata */}
                    <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white text-sm select-none  flex items-center justify-center mb-6">
                        <GoShieldCheck className="w-7 h-7 text-white" />
                    </div>

                    {/* Testi ridimensionati */}
                    <h1 className="text-xl md:text-2xl font-bold mb-3 tracking-tight">
                        Registrazione avvenuta con successo
                    </h1>

                    <p className="text-[15px]text-gray-400 mb-8 leading-relaxed px-2">
                        Vai alla pagina di Login e inserisci le tue credenziali.
                    </p>

                    {/* Azione principale */}
                    <div className="space-y-4">
                        <Link href={appRoutes.login} className="block">
                            <Button className="w-full py-2.5 text-sm font-semibold shadow-md">
                                Vai al Login
                                <FaArrowRight className="ml-2" />
                            </Button>
                        </Link>


                    </div>
                </div>

            </div>
        </div>
    );
}