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

export default function Tabs({ tabs }: TabsProps) {
    return (
        <TabGroup as="div" className="w-full">
            <TabList className="flex border-b border-gray-200 dark:border-gray-700">
                {tabs.map((tab) => (
                    <Tab as={Fragment} key={tab.label}>
                        <button
                            className="px-4 py-2 text-sm font-medium leading-5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300 focus:outline-none data-[selected]:border-b-2 data-[selected]:border-purple-600 data-[selected]:text-purple-600 dark:data-[selected]:text-purple-400"
                        >
                            {tab.label}
                        </button>
                    </Tab>
                ))}
            </TabList>
            <TabPanels className="mt-4">
                {tabs.map((tab) => (
                    <TabPanel key={tab.label} className="p-2 focus:outline-none">
                        {tab.content}
                    </TabPanel>
                ))}
            </TabPanels>
        </TabGroup>
    );
}
