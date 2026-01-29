'use client';

import { FaTimes } from "react-icons/fa";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

// Utility veloce se non hai già un file cn.ts
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface BadgeProps {
    text: string;
    showRemove?: boolean;
    remove?: (dest: string) => void;
    className?: string; // Aggiunta per personalizzazione esterna
}

export default function Badge({ text, remove, showRemove = false, className }: BadgeProps) {
    return (
        <span
            className={cn(
                "flex items-center gap-2 bg-purple-900/40 text-purple-200 text-sm",
                "font-medium px-3 py-1 rounded-full w-fit border border-purple-800 transition-all",
                className // Gli stili passati come prop vincono su quelli base
            )}
        >
            <span className="truncate max-w-[150px]">{text}</span>

            {showRemove && (
                <button
                    type="button"
                    onClick={() => remove?.(text)}
                    className="text-purple-500 hover:text-purple-300 transition-colors cursor-pointer focus:outline-none"
                    aria-label={`Rimuovi ${text}`}
                >
                    <FaTimes size={12} />
                </button>
            )}
        </span>
    );
}