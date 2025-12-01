import { ReactNode } from 'react';
import { FaPen, FaTrash, FaDirections } from "react-icons/fa";
import ContextMenu, { ContextMenuItem } from './context-menu';

interface DetailItemCardProps {
    readonly icon: ReactNode;
    readonly title: string;
    readonly directionsUrl: string;
    readonly onEdit: () => void;
    readonly onDelete: () => void;
}

export default function DetailItemCard({
    icon,
    title,
    directionsUrl,
    onEdit,
    onDelete,
}: DetailItemCardProps) {

    const menuItems: ContextMenuItem[] = [
        {
            label: 'Indicazioni',
            icon: <FaDirections />,
            onClick: () => window.open(directionsUrl, '_blank'),
        },
        {
            label: 'Modifica',
            icon: <FaPen />,
            onClick: onEdit
        },
        {
            label: 'Elimina',
            icon: <FaTrash />,
            onClick: onDelete,
            // Aggiungiamo uno stile rosso per indicare un'azione distruttiva
            className: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
        },
    ];

    return (
        <li className="flex flex-row items-center  p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg gap-4">
            <div className="flex items-center w-full">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-purple-100 dark:bg-purple-900/50 rounded-full">
                    {icon}
                </div>
                <div className="ml-4">
                    <p className="font-bold text-gray-800 dark:text-white">{title}</p>
                    {/* <p className="text-sm text-gray-500 dark:text-gray-400 ">{subtitle}</p> */}
                </div>
            </div>
            <ContextMenu items={menuItems} />
        </li>
    );
}
