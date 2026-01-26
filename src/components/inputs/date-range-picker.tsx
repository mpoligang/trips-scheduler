'use client';

import { DateRange } from 'react-day-picker';
import SingleDatePicker from './date-picker';

// Props del componente principale
interface DateRangePickerProps {
    id?: string; // Aggiunto id opzionale per completezza
    value: DateRange | undefined;
    onChange: (range: DateRange | undefined) => void;
    readOnly?: boolean; // Nuova prop fondamentale
    className?: string;
    required?: boolean;
}

export default function DateRangePicker({ value, onChange, readOnly, className, required }: Readonly<DateRangePickerProps>) {
    const handleStartDateChange = (date: Date | undefined) => {
        if (readOnly) return; // Blocco modifiche se in readonly

        // Se la nuova data di inizio è dopo la data di fine, resetta anche la data di fine
        if (date && value?.to && date > value.to) {
            onChange({ from: date, to: undefined });
        } else {
            onChange({ from: date, to: value?.to });
        }
    };

    const handleEndDateChange = (date: Date | undefined) => {
        if (readOnly) return; // Blocco modifiche se in readonly
        onChange({ from: value?.from, to: date });
    };

    return (
        <div className={`flex flex-col sm:flex-row gap-6 ${className}`}>
            <SingleDatePicker
                required={required}
                label="Data di Inizio"
                selected={value?.from}
                readOnly={readOnly} // Passiamo la prop al figlio
                onSelect={handleStartDateChange}
            />
            <SingleDatePicker
                label="Data di Fine"
                required={required}
                selected={value?.to}
                readOnly={readOnly} // Passiamo la prop al figlio
                onSelect={handleEndDateChange}
                disabledDays={{ before: value?.from || new Date() }}
            />
        </div>
    );
}