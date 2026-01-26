'use client';

import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface ProgressBarProps {
    value: number;    // Il valore attuale (es. 50)
    total: number;    // Il valore massimo (es. 200)
    label: string;
    unitMeasure?: string;
    showValue?: boolean;
    className?: string;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
    ({ value, total, label, showValue = true, className, unitMeasure }, ref) => {

        // Calcolo della percentuale
        const percentage = total > 0 ? (value / total) * 100 : 0;
        // Arrotondiamo per la visualizzazione e limitiamo tra 0 e 100
        const clampedValue = Math.min(Math.max(Math.round(percentage), 0), 100);

        // Logica dei colori richiesta:
        // < 51% verde | 51-85% giallo | > 85% rosso
        const getBarColor = (val: number) => {
            if (val < 51) { return 'bg-emerald-500' };
            if (val <= 85) { return 'bg-amber-500' };
            return 'bg-red-500';
        };

        return (
            <div ref={ref} className={twMerge("w-full", className)}>
                {/* Header: Label e Dettaglio (valore/totale + %) */}
                <div className="flex justify-between items-end mb-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        {label}
                    </label>

                </div>

                {/* Contenitore della barra (Tracciato) */}
                <div
                    className={twMerge(
                        "relative w-full h-3 bg-gray-700 rounded-full overflow-hidden p-[1px]",
                        "transition-all duration-300"
                    )}
                >
                    {/* Barra di progresso effettiva */}
                    <div
                        style={{ width: `${clampedValue}%` }}
                        className={twMerge(
                            "h-full rounded-full transition-all duration-500 ease-out",
                            getBarColor(clampedValue)
                        )}
                    />
                </div>
                {showValue && (
                    <div className="text-xs font-semibold text-gray-400 text-right mt-2">
                        <span className="mr-1">{value} {unitMeasure} / {total} {unitMeasure}</span>
                        <span className="text-gray-200">({clampedValue}%)</span>
                    </div>
                )}
            </div>
        );
    }
);

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;