// dateUtils.ts

export interface DateOption {
    id: string;   // Formato YYYY-MM-DD
    name: string; // Es: "lun 16 ott 2023"
    date: Date;   // Oggetto Date nativo
}


export const toLocalISOString = (date: Date): string => {
    return date.toLocaleDateString('en-CA');
};


export const generateDateOptions = (startDate: Date, endDate: Date): DateOption[] => {
    const options: DateOption[] = [];

    const current = new Date(startDate);
    const finalEnd = new Date(endDate);

    current.setHours(0, 0, 0, 0);
    finalEnd.setHours(0, 0, 0, 0);

    while (current <= finalEnd) {
        const dateObj = new Date(current);

        options.push({
            id: toLocalISOString(dateObj), // ID Sicuro (YYYY-MM-DD locale)
            name: dateObj.toLocaleDateString('it-IT', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }),
            date: dateObj
        });

        // Aggiungiamo 1 giorno
        current.setDate(current.getDate() + 1);
    }

    return options;
};

/**
 * Trova l'opzione corrispondente a una data specifica.
 */
export const selectDateOption = (date: Date | undefined | null, options: DateOption[]): DateOption | null => {
    if (!date) return null;

    // Generiamo l'ID della data in ingresso con la stessa logica locale
    const searchId = toLocalISOString(date);

    return options.find(opt => opt.id === searchId) || null;
};

// utils/dateTripUtils.ts
export const formatDateForPostgres = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

/**
 * Formatta una data nel formato dd/mm/yyyy HH:mm
 * @param date - La data da formattare (oggetto Date o stringa ISO)
 * @returns Stringa formattata o stringa vuota se la data non è valida
 */
export const formatDate = (date: Date | string | number): string => {
    const d = new Date(date);

    // Controllo se la data è valida
    if (isNaN(d.getTime())) {
        console.warn("formatDate: Fornita una data non valida");
        return "";
    }

    return new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // Forza il formato 24 ore
    }).format(d).replace(',', '');
    // Nota: Intl a volte inserisce una virgola tra data e ora a seconda dell'ambiente
};