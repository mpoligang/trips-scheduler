'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrash, FaDirections } from "react-icons/fa";
import ContextMenu, { ContextMenuItem } from '../actions/context-menu';
import { openDirectionLink } from '@/utils/open-link.utils';

interface DetailItemCardProps {
    readonly detailClick: string | (() => void);
    readonly icon: ReactNode;
    readonly title: string;
    readonly subtitle?: string;
    readonly address: string;
    readonly isOwner?: boolean;
    readonly onDelete: () => void;
    readonly additionalItems?: ContextMenuItem[];
}

/**
 * Componente per gli elementi della lista (Tappe, Alloggi, Trasporti).
 * Risolve il bug dell'icona schiacciata usando flex-shrink-0 e gestisce testi lunghi.
 */
export default function DetailItemCard({
    icon,
    title,
    detailClick,
    address,
    isOwner,
    onDelete,
    subtitle,
    additionalItems
}: DetailItemCardProps) {
    const router = useRouter();

    const handleCardClick = () => {
        if (typeof detailClick === 'function') {
            detailClick();
            return;
        }
        router.push(detailClick);
    };

    // Definiamo le azioni per il menu a comparsa
    let menuItems: ContextMenuItem[] = [
        {
            label: 'Indicazioni',
            icon: <FaDirections />,
            onClick: () => openDirectionLink(address),
        },

    ];

    if (isOwner) {
        menuItems.push(

            {
                label: 'Elimina',
                icon: <FaTrash />,
                onClick: onDelete ?? (() => { }),
                className: 'text-red-400 hover:bg-red-900/20',
            }
        );
    }

    menuItems = [...menuItems, ...(additionalItems || [])];

    return (
        <li className="list-none">
            <div
                onClick={handleCardClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
                className="w-full flex flex-row items-center justify-between p-4 bg-gray-700/50 rounded-2xl gap-4 cursor-pointer hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 group"
                aria-label={`Apri dettaglio di ${title}`}
            >
                {/* Sezione Sinistra: Icona e Testi */}
                <div className="flex items-center flex-1 min-w-0">
                    {/* Icona con flex-shrink-0 per evitare che venga schiacciata */}
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-500/20 transition-transform group-hover:scale-110">
                        {icon}
                    </div>

                    {/* Container Testo con min-w-0 per permettere il truncate del figlio */}
                    <div className="ml-4 flex-1 min-w-0">
                        <p className="font-bold text-white  text-sm md:text-base">
                            {title}
                        </p>
                        {
                            subtitle && (
                                <p className="text-gray-400 text-xs md:text-sm truncate">
                                    {subtitle}
                                </p>
                            )
                        }

                    </div>
                </div>

                {/* Sezione Destra: Menu Contestuale */}
                <div className="flex-shrink-0">
                    <ContextMenu items={menuItems} />
                </div>
            </div>
        </li>
    );
}