'use client';

import { ReactNode } from 'react';
import { FaTrash, FaDirections } from "react-icons/fa"; // Rimosso FaPen
import ContextMenu, { ContextMenuItem } from '../actions/context-menu';
import { useRouter } from 'next/navigation';

interface DetailItemCardProps {
    readonly icon: ReactNode;
    readonly title: string;
    readonly directionsUrl: string;
    readonly detailUrl: string; // Nuova prop per l'URL del dettaglio
    readonly onDelete: () => void;
}

export default function DetailItemCard({
    icon,
    title,
    directionsUrl,
    detailUrl,
    onDelete,
}: DetailItemCardProps) {
    const router = useRouter();

    const menuItems: ContextMenuItem[] = [
        {
            label: 'Indicazioni',
            icon: <FaDirections />,
            onClick: () => window.open(directionsUrl, '_blank'),
        },
        {
            label: 'Elimina',
            icon: <FaTrash />,
            onClick: onDelete,
            className: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
        },
    ];

    const handleCardClick = () => {
        router.push(detailUrl);
    };

    return (
        <li className="list-none">
            <div
                onClick={handleCardClick}
                role='button'
                className="w-full flex flex-row items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label={`Apri dettaglio di ${title}`}
            >
                <div className="flex items-center w-full">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-purple-100 dark:bg-purple-900/50 rounded-full">
                        {icon}
                    </div>
                    <div className="ml-4">
                        <p className="font-bold text-gray-800 dark:text-white">{title}</p>
                    </div>
                </div>
                <ContextMenu items={menuItems} />
            </div>
        </li>
    );
}