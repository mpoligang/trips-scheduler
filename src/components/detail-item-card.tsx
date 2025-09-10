import { ReactNode } from 'react';
import Link from "next/link";
import { FaPen, FaTrash, FaDirections } from "react-icons/fa";
import Button from './button';

interface DetailItemCardProps {
    icon: ReactNode;
    title: string;
    subtitle: string;
    directionsUrl: string;
    editUrl: string;
    onDelete: () => void;
}

export default function DetailItemCard({
    icon,
    title,
    subtitle,
    directionsUrl,
    editUrl,
    onDelete,
}: DetailItemCardProps) {
    return (
        <li className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-4">
            <div className="flex items-start">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-purple-100 dark:bg-purple-900/50 rounded-full">
                    {icon}
                </div>
                <div className="ml-4">
                    <p className="font-bold text-gray-800 dark:text-white">{title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 ">{subtitle}</p>
                </div>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row self-end md:self-center">
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm" className="w-full justify-center md:w-auto">
                        <FaDirections />
                        <span className="ml-2">Indicazioni</span>
                    </Button>
                </a>
                <Link href={editUrl} aria-label="Modifica elemento">
                    <Button variant="secondary" size="sm" className="w-full justify-center md:w-auto">
                        <FaPen />
                        <span className="ml-2">Modifica</span>
                    </Button>
                </Link>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onDelete}
                    aria-label="Elimina elemento"
                    className="w-full justify-center md:w-auto"
                >
                    <FaTrash />
                    <span className="ml-2">Elimina</span>
                </Button>
            </div>
        </li>
    );
}
