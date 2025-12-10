'use client';

import Link from 'next/link';
import { Fragment } from 'react';
import { FaChevronRight } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import { PathItem } from '@/models/PathItem';

// Props del componente Breadcrumb
interface BreadcrumbProps {
    readonly paths: readonly PathItem[];
    readonly className?: string;
}

/**
 * Un componente Breadcrumb semplificato (sempre visibile, senza logica responsive interna).
 */
export default function Breadcrumb({ paths, className }: BreadcrumbProps) {
    if (!paths || paths.length === 0) {
        return null;
    }

    return (
        <nav
            aria-label="breadcrumb"
            className={twMerge("w-full", className)}
        >
            <ol className="flex items-center gap-2 text-sm">
                {paths.map((path, index) => {
                    const isLast = index === paths.length - 1;

                    return (
                        <Fragment key={path.href}>
                            {/* Elemento del percorso */}
                            <li>
                                {isLast ? (
                                    <span className="font-semibold text-gray-900 dark:text-white" aria-current="page">
                                        {path.label}
                                    </span>
                                ) : (
                                    <Link
                                        href={path.href}
                                        className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    >
                                        {path.label}
                                    </Link>
                                )}
                            </li>

                            {/* Separatore */}
                            {!isLast && (
                                <li className="text-gray-400 flex items-center">
                                    <FaChevronRight className="h-3 w-3" />
                                </li>
                            )}
                        </Fragment>
                    );
                })}
            </ol>
        </nav>
    );
}