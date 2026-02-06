'use client';

import LoaderIcon from "./loader-icon";

interface LoaderProps {
    message?: string;
}

/**
 * Un componente di caricamento a schermo intero con un'icona animata.
 * @param message - Un messaggio opzionale da visualizzare sotto l'icona.
 */
export default function Loader({ message = "Caricamento..." }: LoaderProps) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90">
            <LoaderIcon />
            <p className="mt-4 text-lg font-medium text-gray-300">
                {message}
            </p>
        </div>
    );
}
