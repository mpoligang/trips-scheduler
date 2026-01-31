'use client';

import Link from 'next/link';
import Breadcrumb from './breadcrumb';
import { PathItem } from '@/models/PathItem';
import Avatar from '../generics/userAvatar';
import Logo from '../generics/logo';

interface NavbarProps {
    readonly backPath?: string;
    readonly breadcrumb: readonly PathItem[];
    readonly children?: React.ReactNode;
    readonly showLogo?: boolean;
}


export default function Navbar({ breadcrumb, children, showLogo = true }: NavbarProps) {

    return (
        <header className="w-full bg-gray-800 shadow-md sticky top-0 z-[19]">
            <nav className=" px-4 sm:px-6 lg:px-8">
                <div className="flex items-center h-16">
                    <div className="flex items-center justify-between w-full">
                        {children}
                        {showLogo && <Logo size='small' />}
                        <Breadcrumb className={`${showLogo ? 'ml-6' : ''} lg:block hidden`} paths={breadcrumb} />
                        <Link href='/dashboard/profile'>
                            <Avatar />
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    );
}
