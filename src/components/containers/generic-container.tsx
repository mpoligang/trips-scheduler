'use client';

import { useTrip } from "@/context/tripContext";
import { PathItem } from "@/models/PathItem";
import { appRoutes } from "@/utils/appRoutes";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import { FaExclamationTriangle, FaChevronRight, FaChevronLeft, FaTimes, FaBars, FaArrowLeft } from "react-icons/fa";
import Loader from "../loading/loader";
import Logo from "../generics/logo";
import Navbar from "../navigations/navbar";
import SidebarItem from "../navigations/sidebar-item";
import DialogComponent from "../modals/confirm-modal";
import useWindowSize from "@/utils/windowSize";

interface GenericLayoutProps {
    readonly children: ReactNode;
    readonly backPath?: string;
    readonly breadcrumb: PathItem[];
    readonly menuItems?: PathItem[];
    readonly mobileMenuItems?: PathItem[];
    readonly backToItem?: Partial<PathItem>;
}

export default function GenericLayout({ children, backPath, breadcrumb, menuItems, mobileMenuItems, backToItem }: GenericLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <GenericLayoutContent
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
            backPath={backPath}
            breadcrumb={breadcrumb}
            menuItems={menuItems}
            mobileMenuItems={mobileMenuItems}
            backToItem={backToItem}
        >
            {children}
        </GenericLayoutContent>
    );
}

interface GenericLayoutContentProps {
    readonly children: ReactNode;
    readonly isCollapsed: boolean;
    readonly setIsCollapsed: (collapsed: boolean) => void;
    readonly isMobileOpen: boolean;
    readonly setIsMobileOpen: (open: boolean) => void;
    readonly backPath?: string;
    readonly breadcrumb: PathItem[];
    readonly menuItems?: PathItem[];
    readonly mobileMenuItems?: PathItem[];
    readonly backToItem?: Partial<PathItem>;
}

function GenericLayoutContent({
    children,
    isCollapsed,
    setIsCollapsed,
    isMobileOpen,
    setIsMobileOpen,
    backPath,
    breadcrumb,
    menuItems = [],
    mobileMenuItems = [],
    backToItem
}: GenericLayoutContentProps) {
    const { trip, loading, error } = useTrip();
    const router = useRouter();
    const pathname = usePathname();
    const { width } = useWindowSize();

    if (loading) {
        return <Loader />;
    }

    if (error) {
        return (
            <DialogComponent
                isOpen={true}
                title="Attenzione"
                confirmText="Torna alla Dashboard"
                onConfirm={() => router.push(appRoutes.home)}
                onClose={() => router.push(appRoutes.home)}
                isLoading={false}
            >
                <p>{error}</p>
            </DialogComponent>
        )
    }

    return (
        /* MODIFICA 1: Usa h-[100dvh] invece di h-screen.
           Questo adatta l'altezza alla viewport dinamica del browser mobile (escludendo la barra indirizzi).
        */
        <div className="flex h-[100dvh] w-full bg-gray-900 overflow-hidden relative">

            {/* --- MOBILE OVERLAY --- */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[25] lg:hidden backdrop-blur-md animate-in fade-in"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* --- SIDEBAR --- */}
            <aside className={`
                fixed inset-y-0 left-0 z-[30] bg-gray-800 border-r border-gray-700
                transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col shadow-2xl lg:shadow-none
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${isCollapsed ? 'lg:w-20' : 'lg:w-72 w-80'}
            `}>
                <div className="p-6 flex items-center justify-between h-16 border-b border-gray-700/50 flex-shrink-0">
                    {isCollapsed ? <div className="w-4" /> : <Logo size="small" />}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex p-2 rounded-xl bg-gray-700/50 text-gray-400 hover:text-white transition-all border border-transparent"
                    >
                        {isCollapsed ? <FaChevronRight size={18} /> : <FaChevronLeft size={18} />}
                    </button>

                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-2 rounded-xl bg-gray-700/50 text-gray-400 transition-all"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto no-scrollbar text-left min-h-0">
                    {menuItems.map((item, index) => (
                        <SidebarItem
                            key={item.label + '_' + index}
                            icon={item.icon ?? FaExclamationTriangle}
                            label={item.label}
                            active={pathname === item.href || pathname.includes(item.href)}
                            collapsed={isCollapsed}
                            onClick={() => {
                                router.push(item.href);
                                setIsMobileOpen(false);
                            }}
                        />
                    ))}
                </nav>

                <nav className={`flex-shrink-0 px-4 pb-4 text-left flex items-end ${!trip || isCollapsed ? 'mb-5' : ''} `}>
                    <SidebarItem
                        icon={FaArrowLeft}
                        label={backToItem?.label || 'Torna Indietro'}
                        active={false}
                        collapsed={isCollapsed}
                        onClick={() => {
                            router.push(backToItem?.href || appRoutes.home);
                            setIsMobileOpen(false);
                        }}
                    />
                </nav>

                {!isCollapsed && trip && (
                    <div className="p-5 m-5 mt-0 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex-shrink-0">
                        <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1 text-left">Stai visualizzando</p>
                        <h4 className="text-sm font-bold truncate leading-tight text-left">{trip.name}</h4>
                    </div>
                )}
            </aside>

            {/* --- MAIN AREA --- */}
            {/* MODIFICA 2: Aggiunto overflow-hidden al main container per assicurarci
                che lo scroll sia gestito solo dal div interno e non dal body o dal main stesso.
            */}
            <main className={`
                flex-1 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) min-w-0 flex flex-col h-full overflow-hidden relative
                ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}
            `}>

                {/* 1. NAVBAR SUPERIORE */}
                {/* Aggiunto flex-shrink-0 per evitare che si schiacci */}
                <div className="flex-shrink-0 w-full z-10">
                    <Navbar backPath={backPath} breadcrumb={breadcrumb} showLogo={isCollapsed || (width !== undefined && width < 1024)}>
                        <div className="flex items-center">
                            <button
                                onClick={() => { setIsMobileOpen(!isMobileOpen); setIsCollapsed(false); }}
                                className="lg:hidden p-2 rounded-xl bg-gray-700/50 text-gray-400 transition-all"
                            >
                                <FaBars size={24} />
                            </button>
                        </div>
                    </Navbar>
                </div>

                {/* 2. AREA CONTENUTO */}
                {/* MODIFICA 3: min-h-0 è fondamentale nei nested flex container per permettere allo scroll di funzionare.
                    Senza di esso, il contenuto spinge il padre oltre il 100% dell'altezza.
                */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900 min-h-0 w-full relative">
                    <div className="p-6">
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                            {children}
                        </div>
                    </div>
                </div>

                {/* 3. BOTTOM NAVBAR */}
                {/* MODIFICA 4: shrink-0 assicura che la navbar non venga schiacciata o spinta fuori
                    se il contenuto è troppo lungo. z-20 la tiene sopra il contenuto se necessario.
                */}
                {mobileMenuItems && mobileMenuItems.length > 0 && (
                    <div className="lg:hidden bg-gray-800 border-t border-gray-700 px-2 py-2 safe-area-bottom flex-shrink-0 z-20 w-full">
                        <div className="flex justify-around items-center h-14">
                            {mobileMenuItems.map((item, index) => {
                                const isActive = pathname === item.href || pathname.includes(item.href);
                                const Icon = item.icon ?? FaExclamationTriangle;

                                return (
                                    <button
                                        key={`mobile-nav-${item.id || item.label}-${index}`}
                                        onClick={() => router.push(item.href)}
                                        className={`
                                            flex flex-col items-center justify-center w-full h-full space-y-1
                                            ${isActive ? 'text-indigo-400' : 'text-gray-400 hover:text-gray-200'}
                                            transition-colors duration-200
                                        `}
                                    >
                                        <Icon size={20} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}