'use client';

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";

export default function SingleDatePicker({
    label,
    selected,
    onSelect,
    disabledDays,
}: {
    label?: string;
    selected: Date | undefined;
    onSelect: (date: Date | undefined) => void;
    disabledDays?: any;
}) {
    const displayValue = selected ? format(selected, 'dd MMM yyyy', { locale: it }) : (label || '');

    return (
        <Popover className="relative w-full">
            {({ open }) => (
                <>
                    {/* Wrapper per l'effetto gradiente, ora basato sullo stato 'open' */}
                    <div className={`relative rounded-lg p-[1.5px] transition-colors duration-300 ${open ? 'bg-gradient-to-br from-purple-600 to-indigo-700' : 'bg-transparent'}`}>
                        <PopoverButton
                            as="div"
                            className="flex items-center w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-left font-normal focus:outline-none cursor-pointer"
                        >
                            <FaCalendarAlt className="mr-2 text-gray-500 dark:text-gray-400" />
                            <span className="flex-grow text-gray-800 dark:text-gray-200">{displayValue}</span>
                            {/* Pulsante per cancellare la data selezionata */}
                            {selected && (
                                <button
                                    type="button"
                                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Impedisce l'apertura del calendario
                                        onSelect(undefined);
                                    }}
                                    aria-label="Cancella data"
                                >
                                    <FaTimes className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                                </button>
                            )}
                        </PopoverButton>
                    </div>
                    <PopoverPanel
                        transition
                        className="absolute z-10 mt-2 w-auto origin-top-left rounded-lg bg-white dark:bg-gray-800 shadow-lg transition data-[closed]:-translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
                    >
                        {({ close }) => (
                            <DayPicker
                                mode="single"
                                selected={selected}
                                onSelect={(date) => {
                                    onSelect(date);
                                    close();
                                }}
                                locale={it}
                                defaultMonth={selected || new Date()}
                                disabled={disabledDays}
                                classNames={{
                                    root: 'p-3',
                                    caption: 'flex justify-between items-center pt-1 pb-3 px-1',
                                    caption_label: 'font-semibold tracking-wide text-gray-800 dark:text-white',
                                    weekday: 'text-white py-3',
                                    month_caption: 'ml-1 mt-2',
                                    head_cell: 'w-10 text-sm font-medium text-gray-500 dark:text-white pb-2 flex justify-center',
                                    row: 'flex w-full mt-2',
                                    cell: 'w-10 h-10 flex items-center justify-center text-center text-sm p-0 relative',
                                    day: 'w-10 h-10 text-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-white',
                                    disabled: 'text-gray-300 dark:text-gray-700 opacity-50 cursor-not-allowed',
                                }}
                            />
                        )}
                    </PopoverPanel>
                </>
            )}
        </Popover>
    );
}

