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