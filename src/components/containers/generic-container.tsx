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
    readonly backToItem?: Partial<PathItem>;

}

export default function GenericLayout({ children, backPath, breadcrumb, menuItems, backToItem, }: GenericLayoutProps) {
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
                <p >{error}</p>

            </DialogComponent>

        )
    }

    return (
        <div className="flex h-screen bg-gray-900 overflow-hidden">

            {/* --- MOBILE OVERLAY --- */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-[18] lg:hidden backdrop-blur-md animate-in fade-in"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* --- SIDEBAR --- */}
            <aside className={`
        fixed inset-y-0 left-0 z-[22] bg-gray-800 border-r border-gray-700
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col shadow-2xl lg:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72 w-80'}
      `}>

                {/* Sidebar Header: Toggle desktop */}
                <div className="p-6 flex items-center justify-between h-16 border-b border-gray-700/50">
                    {!isCollapsed ? (
                        <Logo size="small" />
                    ) : (
                        <div className="w-4" />
                    )}

                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex p-2 rounded-xl bg-gray-700/50 text-gray-400 transition-all border border-transparent"
                    >
                        {isCollapsed ? <FaChevronRight size={18} /> : <FaChevronLeft size={18} />}
                    </button>



                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-2 rounded-xl bg-gray-700/50 text-gray-400 transition-all border border-transparent"
                    >
                        <FaTimes size={16} />
                    </button>

                </div>

                {/* Navigation Links */}
                <nav className="flex-2 px-4 py-8 space-y-3 overflow-y-auto no-scrollbar text-left">
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
                <nav className={`flex-1 px-4  text-left flex items-end ${!trip || isCollapsed ? 'mb-5' : ''} `}>

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

                {/* Footer Sidebar */}
                {!isCollapsed && trip && (
                    <div className="p-5 m-5 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-indigo-600  text-white">
                        <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1 text-left">Stai visualizzando</p>
                        <h4 className="text-sm font-bold truncate leading-tight text-left">{trip.name}</h4>
                    </div>
                )}
            </aside>

            {/* --- MAIN AREA --- */}
            <main className={`
        flex-1 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) min-w-0 flex flex-col h-full
        ${isCollapsed ? 'lg:ml-20' : 'lg:ml-72'}
      `}>

                {/* NAVBAR INTEGRATA */}
                <Navbar backPath={backPath} breadcrumb={breadcrumb} showLogo={isCollapsed || (width !== undefined && width < 1024)}>
                    <div className="flex items-center">
                        {/* Burger Menu Mobile */}

                        <button
                            onClick={() => { setIsMobileOpen(!isMobileOpen); setIsCollapsed(false); }}
                            className="lg:hidden p-2 rounded-xl bg-gray-700/50 text-gray-400 transition-all border border-transparent"
                        >
                            <FaBars size={24} />
                        </button>
                    </div>
                </Navbar>

                {/* Area Contenuto */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-900">
                    <div className="p-6">
                        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                            {children}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}