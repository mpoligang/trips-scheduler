import { Trip } from "@/models/Trip";
import Link from "next/link";
import { FaCalendarAlt, FaEye, FaPen, FaTrash } from "react-icons/fa";
import Button from "./button";
import { Timestamp } from "firebase/firestore";

interface TripCardProps {
    trip: Trip;
    onDelete: () => void
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
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col justify-between  hover:shadow-xl">
            <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{trip.name}</h3>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-300">
                    <FaCalendarAlt className="mr-2 text-white " />
                    <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                </div>
            </div>
            {/* --- Footer Aggiornato --- */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center sm:flex-row flex-col">
                <Link className="sm:w-auto w-full" href={`dashboard/trips/${trip.id}/detail`}>
                    <Button className="sm:w-auto w-full" variant="secondary" size="sm">
                        <FaEye />
                        <span className="ml-2">Dettagli</span>
                    </Button>
                </Link>
                <div className="flex mt-4 sm:mt-0">
                    <Link className=" sm:mt-0 w-full" href={`dashboard/trips/${trip.id}/metadata`} aria-label="Modifica viaggio">
                        <Button className="sm:w-auto w-full" variant="secondary" size="sm">
                            <FaPen />
                            <span className="ml-2">Modifica</span>
                        </Button>
                    </Link>
                    <Button className="sm:w-auto w-full ml-3" variant="secondary" size="sm" onClick={onDelete}>
                        <FaTrash />
                        <span className="ml-2">Elimina</span>
                    </Button>
                </div>
            </div>
        </div >
    );
}

