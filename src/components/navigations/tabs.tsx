'use client';

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { ReactNode, Fragment } from 'react';

export interface TabItem {
    label: string;
    content: ReactNode;
}

interface TabsProps {
    tabs: TabItem[];
}

export default function Tabs({ tabs }: Readonly<TabsProps>) {
    return (
        <TabGroup as="div" className="w-full">
            <TabList className="
                flex flex-nowrap overflow-x-auto 
                border-b border-gray-700
                
                /* Firefox: 'thin' e colori con opacità */
                [scrollbar-width:thin] 
                [scrollbar-color:rgba(156,163,175,0.2)_transparent]
                
                /* --- Webkit (Chrome, Safari, Edge) --- */
                /* 1. Altezza super fine (4px) */
                [&::-webkit-scrollbar]:h-0.5
                
                /* 2. Traccia invisibile */
                [&::-webkit-scrollbar-track]:bg-transparent
                
                /* 3. Pillola quasi trasparente (20% opacità) */
                [&::-webkit-scrollbar-thumb]:bg-gray-400/20 
                [&::-webkit-scrollbar-thumb]:rounded-full
                
                /* 4. Diventa più visibile (50%) solo quando ci passi sopra col mouse */
                [&::-webkit-scrollbar-thumb]:hover:bg-gray-400/50
                
                /* --- Dark Mode --- */
                dark:[&::-webkit-scrollbar-thumb]:bg-gray-500/20
                dark:[&::-webkit-scrollbar-thumb]:hover:bg-gray-500/50
            ">
                {tabs.map((tab) => (
                    <Tab as={Fragment} key={tab.label}>
                        <button
                            className="
                                flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium leading-5 
                                text-gray-500 transition-colors duration-200
                                hover:bg-gray-100 hover:text-gray-700 
                                dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300 
                                focus:outline-none 
                                data-[selected]:border-b-2 data-[selected]:border-purple-600 
                                data-[selected]:text-purple-600 dark:data-[selected]:text-purple-400
                            "
                        >
                            {tab.label}
                        </button>
                    </Tab>
                ))}
            </TabList>
            <TabPanels className="mt-5">
                {tabs.map((tab) => (
                    <TabPanel key={tab.label} className="px-2 focus:outline-none">
                        {tab.content}
                    </TabPanel>
                ))}
            </TabPanels>
        </TabGroup>
    );
}