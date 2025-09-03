'use client';

import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

// Definizione delle props per il componente Navbar
interface NavbarProps {
    backPath: string;
    onLogout: () => void;
}

/**
 * Una barra di navigazione condivisa con un pulsante per tornare indietro e un pulsante di logout.
 * @param backPath - Il percorso a cui navigare quando si clicca il pulsante indietro.
 * @param onLogout - La funzione da eseguire quando si clicca il pulsante di logout.
 */
export default function Navbar({ backPath, onLogout }: NavbarProps) {
    return (
        <header className="w-full bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href={backPath} passHref>
                        <button
                            aria-label="Torna indietro"
                            className="p-2 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                        >
                            <FaArrowLeft size={20} />
                        </button>
                    </Link>
                    <button
                        onClick={onLogout}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                        Logout
                    </button>
                </div>
            </nav>
        </header>
    );
}
