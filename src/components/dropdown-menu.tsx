'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { FaEllipsisV } from 'react-icons/fa';
import Button from './button';

export interface MenuItemType {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
}

interface DropdownMenuProps {
    items: MenuItemType[];
}

export default function DropdownMenu({ items }: DropdownMenuProps) {
    return (
        <Menu as="div" className="relative inline-block text-left">
            <div>
                <MenuButton as={Button} variant="secondary" className="w-auto">
                    <FaEllipsisV />
                </MenuButton>
            </div>

            <MenuItems
                transition
                className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
            >
                <div className="p-1">
                    {items.map((item) => (
                        <MenuItem key={item.label} as={Fragment}>
                            <button
                                onClick={item.onClick}
                                className="cursor-pointer group flex w-full items-center gap-2 rounded-md py-2 px-3 text-sm text-gray-900 dark:text-gray-200 data-[focus]:bg-purple-100 dark:data-[focus]:bg-purple-900/50"
                            >
                                {item.icon && (
                                    <span className="h-5 w-5 text-gray-500 dark:text-gray-400 group-data-[focus]:text-purple-600 dark:group-data-[focus]:text-purple-400">
                                        {item.icon}
                                    </span>
                                )}
                                {item.label}
                            </button>
                        </MenuItem>
                    ))}
                </div>
            </MenuItems>
        </Menu>
    );
}
