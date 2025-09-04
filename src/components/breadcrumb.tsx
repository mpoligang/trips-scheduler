'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import { PathItem } from '@/models/PathItem'; // Importazione del tipo esternalizzato

// Props del componente Breadcrumb
interface BreadcrumbProps {
    paths: PathItem[];
    className?: string; // Prop per la classe esterna
}

/**
 * Un componente Breadcrumb responsive.
 * @param paths - Un array di oggetti { label: string, href: string }
 * @param className - Classi CSS aggiuntive per il contenitore nav.
 */
export default function Breadcrumb({ paths, className }: BreadcrumbProps) {
    // Non renderizzare nulla se non ci sono percorsi
    if (!paths || paths.length === 0) {
        return null;
    }

    return (
        <nav
            aria-label="breadcrumb"
            className={twMerge("w-full", className)} // Unione delle classi
        >
            <ol className="flex items-center gap-2 text-sm">
                {/* Puntini per la vista mobile (mostrati solo se c'è più di un percorso) */}
                {paths.length > 1 && (
                    <li className="flex items-center gap-2 md:hidden">
                        <span className="text-gray-500 dark:text-gray-400">...</span>
                        <FaChevronRight className="h-3 w-3 flex-shrink-0 text-gray-400" />
                    </li>
                )}

                {/* Mappa di tutti i percorsi */}
                {paths.map((path, index) => {
                    const isLast = index === paths.length - 1;

                    return (
                        <Fragment key={path.href}>
                            {/* Elemento della lista: visibile su desktop, nascosto su mobile (tranne l'ultimo) */}
                            <li className={`${isLast ? 'block' : 'hidden md:block'}`}>
                                {isLast ? (
                                    // L'ultimo elemento è testo semplice (pagina corrente)
                                    <span className="font-semibold text-gray-900 dark:text-white" aria-current="page">
                                        {path.label}
                                    </span>
                                ) : (
                                    // Gli altri elementi sono link
                                    <Link
                                        href={path.href}
                                        className="text-gray-600 dark:text-gray-300 hover:text-white dark:hover:text-white transition-colors"
                                    >
                                        {path.label}
                                    </Link>
                                )}
                            </li>

                            {/* Separatore: visibile solo su desktop e non dopo l'ultimo elemento */}
                            {!isLast && (
                                <li className="hidden md:flex">
                                    <FaChevronRight className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                </li>
                            )}
                        </Fragment>
                    );
                })}
            </ol>
        </nav>
    );
}

