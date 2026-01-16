'use client';

import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import Button from '../actions/button';
import Breadcrumb from './breadcrumb';
import { PathItem } from '@/models/PathItem';
import Avatar from '../generics/userAvatar';
import Logo from '../generics/logo';

interface NavbarProps {
    readonly backPath: string;
    readonly breadcrumb: readonly PathItem[];
}

/**
 * Una barra di navigazione condivisa con un pulsante per tornare indietro e un pulsante di logout.
 * @param backPath - Il percorso a cui navigare quando si clicca il pulsante indietro.
 */
export default function Navbar({ backPath, breadcrumb }: NavbarProps) {
    return (
        // MODIFICA: Aumentato lo z-index per essere sopra la mappa ma sotto il modale
        <header className="w-full bg-white dark:bg-gray-800 shadow-md sticky top-0 z-8888">
            <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-16">
                    <Link href={backPath} passHref>
                        <Button variant="icon">
                            <FaArrowLeft size={20} />
                        </Button>
                    </Link>
                    <div className="flex items-center justify-between w-full">

                        <Logo className='ml-4' size='small' />
                        <Breadcrumb className='ml-6 md:block hidden' paths={breadcrumb} />
                        <Link href='/dashboard/profile'>
                            <Avatar />
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    );
}
