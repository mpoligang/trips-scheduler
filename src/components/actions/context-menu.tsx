'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { FaEllipsisV } from 'react-icons/fa';
import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export interface ContextMenuItem {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    className?: string;
}

interface ContextMenuProps {
    items: ContextMenuItem[];
    className?: string;
}

export default function ContextMenu({ items, className }: Readonly<ContextMenuProps>) {
    return (
        <Menu as="div" className={twMerge("relative inline-block text-left", className)}>
            <div>
                <MenuButton
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                        }
                    }}
                    className="flex items-center justify-center p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
                    <FaEllipsisV />
                </MenuButton>
            </div>

            {/* Pannello del menu */}
            <MenuItems
                transition
                className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
            >
                <div className="p-1">
                    {items.map((item, index) => {
                        const key = `context-menu-item-${index}`;
                        return <MenuItem key={key}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    item.onClick();
                                }}
                                className={twMerge(
                                    "group flex w-full items-center gap-2 rounded-md py-2 px-3 text-sm text-gray-800 dark:text-gray-200 transition-colors",
                                    "data-[focus]:bg-purple-100 dark:data-[focus]:bg-purple-900/50 data-[focus]:text-purple-900 dark:data-[focus]:text-purple-100",
                                    item.className
                                )}
                            >
                                {item.icon && (
                                    <span className="h-4 w-4 flex items-center justify-center opacity-70 group-data-[focus]:opacity-100">
                                        {item.icon}
                                    </span>
                                )}
                                {item.label}
                            </button>
                        </MenuItem>
                    })}
                </div>
            </MenuItems>
        </Menu>
    );
}