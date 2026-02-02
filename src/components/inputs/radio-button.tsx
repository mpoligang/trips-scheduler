'use client';

import { ReactNode } from 'react';

interface RadioButtonProps {
    readonly id: string;
    readonly name: string;
    readonly value: string;
    readonly checked: boolean;
    readonly onChange: (value: string) => void;
    readonly children: ReactNode;
}

export function RadioButton({
    id,
    name,
    value,
    checked,
    onChange,
    children
}: RadioButtonProps) {
    return (
        <div className="flex items-start gap-3 mb-3">
            <div className="relative flex items-center">
                <input
                    id={id}
                    type="radio"
                    name={name}
                    value={value}
                    checked={checked}
                    onChange={() => onChange(value)}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-gray-600 bg-gray-700 transition-all checked:border-purple-600 checked:bg-purple-600 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
                {/* Il pallino centrale bianco che appare al check */}
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 transition-opacity peer-checked:opacity-100" />
            </div>
            <label
                htmlFor={id}
                className="text-sm text-gray-400 cursor-pointer select-none leading-tight"
            >
                {children}
            </label>
        </div>
    );
}