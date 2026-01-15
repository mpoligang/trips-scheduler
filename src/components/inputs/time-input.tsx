'use client';

import { ChangeEvent, useState, useEffect } from 'react';
import Input from './input';
import { twMerge } from 'tailwind-merge';

interface TimeInputProps {
    readonly label?: string;
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly readOnly?: boolean;
    readonly className?: string;
    readonly id?: string;
    readonly placeholder?: string;
}

export default function TimeInput({
    label,
    value,
    onChange,
    readOnly,
    className,
    id,
    placeholder = "00:00"
}: TimeInputProps) {
    const [inputValue, setInputValue] = useState(value);

    // Sincronizza lo stato locale con la prop value
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        let newValue = e.target.value.replaceAll(/\D/g, ""); // Rimuove caratteri non numerici

        // Validazione Ore (00-23)
        if (newValue.length >= 2) {
            const hours = Number.parseInt(newValue.substring(0, 2), 10);
            // Se le ore sono > 23, imposta al massimo possibile (23) o gestisci come preferisci
            if (hours > 23) newValue = "23" + newValue.substring(2);
        }

        // Validazione Minuti (00-59)
        if (newValue.length >= 4) {
            const minutes = Number.parseInt(newValue.substring(2, 4), 10);
            if (minutes > 59) newValue = newValue.substring(0, 2) + "59";
        }

        // Maschera HH:mm
        if (newValue.length > 2) {
            newValue = `${newValue.slice(0, 2)}:${newValue.slice(2, 4)}`;
        }

        setInputValue(newValue);

        // Aggiorna il genitore solo se l'orario è completo (5 caratteri) o vuoto
        if (newValue.length === 5) {
            onChange(newValue);
        } else if (newValue === "") {
            onChange("");
        }
    };

    const handleBlur = () => {
        // Se l'utente esce e l'orario è incompleto (es. "12:"), resettiamo al valore valido precedente o vuoto
        if (inputValue.length > 0 && inputValue.length < 5) {
            setInputValue(value || "");
        }
    };

    return (
        <div className={twMerge("relative w-full", className)}>
            <Input
                id={id || `time-input-${label}`}
                label={label || ''}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={placeholder}
                readOnly={readOnly}
                autoComplete="off"
                maxLength={5}
            />
        </div>
    );
}