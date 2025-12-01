'use client';

import { Trip } from "@/models/Trip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaCalendarAlt, FaEye, FaPen, FaTrash } from "react-icons/fa";
import { Timestamp } from "firebase/firestore";
import ContextMenu, { ContextMenuItem } from "./context-menu";
import Button from "./button";

interface TripCardProps {
    readonly trip: Trip;
    readonly onDelete: () => void;
}

// Funzione helper per formattare correttamente i Timestamp di Firestore
const formatDate = (timestamp: Timestamp) => {
    if (!timestamp || typeof timestamp.toDate !== 'function') {
        return 'Data non valida';
    }
    return timestamp.toDate().toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

export default function TripCard({ trip, onDelete }: TripCardProps) {
    const router = useRouter();

    // Definizione delle opzioni del menu
    const menuItems: ContextMenuItem[] = [
        {
            label: 'Modifica',
            icon: <FaPen />,
            onClick: () => router.push(`/dashboard/trips/${trip.id}/metadata`),
        },
        {
            label: 'Elimina',
            icon: <FaTrash />,
            onClick: onDelete,
            className: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
        },
    ];

    return (
        <Link href={`/dashboard/trips/${trip.id}/detail`} className="bg-white p-6 dark:bg-gray-800 rounded-lg shadow-lg flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-start ">

                <div className="flex flex-col w-full">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{trip.name}</h3>

                </div>
                <ContextMenu items={menuItems} />

            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 mt-4 pt-4">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-300">
                    <FaCalendarAlt className="mr-2 text-purple-500 dark:text-white" />
                    <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                </div>
            </div>
        </Link>
    );
}