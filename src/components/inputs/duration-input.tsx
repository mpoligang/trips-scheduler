'use client';

import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';



interface DurationInputProps {
    readonly id: string;
    readonly label: string;
    readonly value: string; // Formato atteso "Xh Ym" o simile
    readonly onChange: (formattedValue: string) => void;
    readonly readOnly?: boolean;
    readonly className?: string;
    readonly required?: boolean;
}

/**
 * DurationInput
 * Un input segmentato per ore e minuti con lo stile del design system ItinerIA.
 */
export default function DurationInput({
    id,
    label,
    value,
    onChange,
    readOnly,
    className,
    required
}: DurationInputProps) {
    // Parsing iniziale del valore (es. "1h 30m" -> ore: 1, min: 30)
    const parseValue = (val: string) => {
        const hoursMatch = val.match(/(\d+)h/);
        const minsMatch = val.match(/(\d+)m/);
        return {
            hours: hoursMatch ? hoursMatch[1] : '',
            minutes: minsMatch ? minsMatch[1] : ''
        };
    };

    const initialParsed = parseValue(value);
    const [hours, setHours] = useState(initialParsed.hours);
    const [minutes, setMinutes] = useState(initialParsed.minutes);

    // Sincronizza lo stato interno se la prop cambia dall'esterno
    useEffect(() => {
        const parsed = parseValue(value);
        setHours(parsed.hours);
        setMinutes(parsed.minutes);
    }, [value]);

    const handleUpdate = (h: string, m: string) => {
        let formatted = "";
        if (h) formatted += `${h}h`;
        if (m) formatted += (formatted ? " " : "") + `${m}m`;
        onChange(formatted);
    };

    const onHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, ""); // Solo numeri
        setHours(val);
        handleUpdate(val, minutes);
    };

    const onMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, "");
        if (parseInt(val) > 59) val = "59"; // Cap ai minuti
        setMinutes(val);
        handleUpdate(hours, val);
    };

    if (readOnly) {
        return (
            <div className={twMerge("w-full", className)}>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {label}
                </label>
                <div className="flex items-center gap-2 py-2 text-gray-800 dark:text-gray-200 ">
                    <span>{value || '-'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className={twMerge("w-full", className)}>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {/* Wrapper per l'effetto bordo gradiente */}
            <div className="relative rounded-[7px] p-[1.5px] transition-all duration-300 bg-transparent focus-within:bg-gradient-to-br focus-within:from-purple-600 focus-within:to-indigo-700">
                <div className="flex items-center w-full bg-gray-50 dark:bg-gray-700 rounded-[7px] overflow-hidden px-4 py-2">

                    {/* Segmento Ore */}
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            value={hours}
                            onChange={onHoursChange}
                            placeholder="0"
                            className="w-8 bg-transparent border-none p-0 text-gray-900 dark:text-white  text-right outline-none  placeholder-gray-400"
                        />
                        <span className="text-xs text-gray-400 uppercase select-none">h</span>
                    </div>

                    {/* Separatore visivo */}
                    <div className="mx-3 h-4 w-[1px] bg-gray-200 dark:bg-gray-600" />

                    {/* Segmento Minuti */}
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            value={minutes}
                            onChange={onMinutesChange}
                            placeholder="00"
                            maxLength={2}
                            className="w-8 bg-transparent border-none p-0 text-gray-900 dark:text-white  outline-none text-right placeholder-gray-400"
                        />
                        <span className="text-xs text-gray-400 uppercase select-none">m</span>
                    </div>

                    <div className="flex-grow" />
                </div>
            </div>
        </div>
    );
}