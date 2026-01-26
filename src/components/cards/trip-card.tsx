'use client';

import { Trip } from "@/models/Trip";
import { useRouter } from "next/navigation";
import { FaCalendarAlt, FaPen, FaTrash } from "react-icons/fa";
import ContextMenu, { ContextMenuItem } from "../actions/context-menu";
import { appRoutes } from "@/utils/appRoutes";

interface TripCardProps {
    readonly trip: Trip;
    isOwner: boolean;
    readonly onDelete: () => void;
}

/**
 * Formatta la data da stringa (YYYY-MM-DD) a MM/DD/YYYY
 */
const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Data non definita';

    const date = new Date(dateString);

    // Controlla se la data è valida
    if (isNaN(date.getTime())) {
        return 'Data non valida';
    }

    // Formato richiesto: MM/DD/YYYY
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
};

export default function TripCard({ trip, onDelete, isOwner }: TripCardProps) {
    const router = useRouter();

    const menuItems: ContextMenuItem[] = [
        {
            label: 'Modifica',
            icon: <FaPen />,
            onClick: () => {
                router.push(appRoutes.settings(trip.id as string));
            },
        },
        {
            label: 'Elimina',
            icon: <FaTrash />,
            onClick: onDelete,
            className: 'text-red-400 hover:bg-red-900/20',
        },
    ];

    const handleNavigateToDetail = (event: React.MouseEvent<HTMLDivElement>) => {
        router.push(appRoutes.stages(trip.id as string));
        event.stopPropagation();
    }

    return (
        <div
            onClick={(event: React.MouseEvent<HTMLDivElement>) => handleNavigateToDetail(event)}
            role="button"
            className="p-6 bg-gray-800 rounded-lg shadow-lg flex flex-col justify-between hover:shadow-xl transition-shadow duration-300 cursor-pointer"
        >
            <div className="flex items-start justify-between">
                <div className="flex flex-col w-full pr-4">
                    <h3 className="text-xl font-bold text-white truncate">
                        {trip.name}
                    </h3>
                </div>

                {isOwner && <ContextMenu items={menuItems} />}
            </div>

            <div className="border-t border-gray-700 mt-4 pt-4">
                <div className="flex items-center text-sm text-gray-300">
                    <FaCalendarAlt className="mr-2 text-white flex-shrink-0" />
                    {/* Usiamo i nomi dei campi aggiornati: start_date e end_date */}
                    <span>{formatDate(trip.start_date)} - {formatDate(trip.end_date)}</span>
                </div>
            </div>
        </div>
    );
}