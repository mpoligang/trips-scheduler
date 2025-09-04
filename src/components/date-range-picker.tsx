'use client';

import { DateRange } from 'react-day-picker';
import SingleDatePicker from './date-picker';

// Props del componente principale
interface DateRangePickerProps {
    value: DateRange | undefined;
    onChange: (range: DateRange | undefined) => void;
    className?: string;
}

export default function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
    const handleStartDateChange = (date: Date | undefined) => {
        // Se la nuova data di inizio è dopo la data di fine, resetta anche la data di fine
        if (date && value?.to && date > value.to) {
            onChange({ from: date, to: undefined });
        } else {
            onChange({ from: date, to: value?.to });
        }
    };

    const handleEndDateChange = (date: Date | undefined) => {
        onChange({ from: value?.from, to: date });
    };

    return (
        <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
            <SingleDatePicker
                label="Data di Inizio"
                selected={value?.from}
                onSelect={handleStartDateChange}
            />
            <SingleDatePicker
                label="Data di Fine"
                selected={value?.to}
                onSelect={handleEndDateChange}
                disabledDays={{ before: value?.from || new Date() }}
            />
        </div>
    );
}

