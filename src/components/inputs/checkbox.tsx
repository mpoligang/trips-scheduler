'use client';

import { ReactNode } from 'react';

interface CheckboxProps {
    readonly id: string;
    readonly checked: boolean;
    readonly onChange: (checked: boolean) => void;
    readonly children: ReactNode;
    readonly required?: boolean;
}

export default function Checkbox({
    id,
    checked,
    onChange,
    children,
    required
}: CheckboxProps) {
    return (
        <div className="flex items-start gap-3">
            <div className="relative flex items-center">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    required={required}
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-600 bg-gray-700 transition-all checked:border-purple-600 checked:bg-purple-600 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
                {/* Icona di spunta personalizzata (SVG) che appare quando checked */}
                <svg
                    className="pointer-events-none absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="20 6 9 17 4 12" />
                </svg>
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