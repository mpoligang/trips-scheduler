// utils/planUtils.ts
import { appConfig, PlanDetails, Plans } from '@/configs/app-config';
import { UserData } from '@/models/UserData';

// Variabile globale nel modulo per memorizzare la differenza di tempo
let serverTimeOffset = 0;
let isOffsetCalculated = false;

// 1. Funzione da chiamare UNA VOLTA all'avvio dell'app (es. in App.tsx o main.ts)
export const syncServerTime = async () => {
    try {
        const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Europe/Rome');
        if (response.ok) {
            const timeData = await response.json();
            const serverMs = new Date(timeData.dateTime).getTime();
            // Calcoliamo la differenza: (Ora Server) - (Ora Locale attuale)
            serverTimeOffset = serverMs - Date.now();
            isOffsetCalculated = true;
            console.log(`Sincronizzazione completata. Offset: ${serverTimeOffset}ms`);
        }
    } catch (e) {
        console.error("Impossibile sincronizzare l'ora, userò l'ora locale.");
    }
};

// 2. La tua funzione ritorna SINCROΝΑ (più veloce e senza errori di Promise)
export const getActivePlan = (userData: UserData | null): PlanDetails => {
    if (!userData) {
        return appConfig.plans.free;
    }
    // Otteniamo l'ora corretta applicando l'offset all'ora locale attuale
    const nowMs = Date.now() + serverTimeOffset;

    const expirationDate = userData.expirationPlanDate
        ? new Date(userData.expirationPlanDate.seconds * 1000)
        : null;

    if (
        userData.plan !== Plans.FREE &&
        expirationDate &&
        expirationDate.getTime() > nowMs
    ) {
        return appConfig.plans.premium;
    }

    return appConfig.plans.free;
};

export const bytesToMb = (bytes: number) => bytes / (1024 * 1024);
export const mbToBytes = (mb: number) => mb * 1024 * 1024;