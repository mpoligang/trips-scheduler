import Link from "next/link";
import { FaMapMarkerAlt, FaPen, FaTrash, FaDirections } from "react-icons/fa";
import Button from "./button";

interface StageItemProps {
    stage: any;
    tripId: string;
    onDelete: (stageId: string) => void;
}

export default function StageItem({ stage, tripId, onDelete }: StageItemProps) {
    // Codifica l'indirizzo per usarlo nell'URL di Google Maps
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stage.location.address)}`;

    return (
        <li className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-4">
            <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-purple-100 dark:bg-purple-900/50 rounded-full">
                    <FaMapMarkerAlt className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                    <p className="font-bold text-gray-800 dark:text-white">{stage.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ">{stage.location.address}</p>
                </div>
            </div>
            {/* --- Contenitore dei bottoni reso responsive --- */}
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row self-end md:self-center">
                {/* --- Pulsante Indicazioni Aggiunto --- */}
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm" className="w-full justify-center md:w-auto">
                        <FaDirections />
                        <span className="ml-2">Indicazioni</span>
                    </Button>
                </a>
                <Link href={`/dashboard/trips/${tripId}/detail/stage/${stage.id}`} aria-label="Modifica tappa">
                    <Button variant="secondary" size="sm" className="w-full justify-center md:w-auto"><FaPen /> <span className="ml-2">Modifica</span> </Button>
                </Link>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onDelete(stage.id)}
                    aria-label="Elimina Tappa"
                    className="w-full justify-center md:w-auto"
                >
                    <FaTrash />
                    <span className="ml-2">Elimina</span>
                </Button>
            </div>
        </li>
    );
}

