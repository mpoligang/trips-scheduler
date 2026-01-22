export enum Plans {
    FREE = 'free',
    PREMIUM = 'premium',
    // ENTERPRISE = 'enterprise',
}

export const unlimited = 'unlimited';

export const appConfig: AppConfig = {
    supportEmail: 'michelangelopoli21@gmail.com',
    plans: {
        free: {
            name: Plans.FREE,
            maxTrips: 2,
            monthlyPrice: 0,
            maxFileSizeInMb: 3,
            totalStorageLimitMb: 50,
        },
        premium: {
            name: Plans.PREMIUM,
            maxTrips: unlimited,
            monthlyPrice: 9.99,
            maxFileSizeInMb: 10,
            totalStorageLimitMb: 1000,
        },
    }
}


export interface PlanDetails {
    name: string;
    maxTrips: number | typeof unlimited;
    monthlyPrice: number;
    maxFileSizeInMb: number;
    totalStorageLimitMb: number;
}

export class PlanDetailsInstance implements PlanDetails {
    public name = '';
    public maxTrips: number | typeof unlimited = 0;
    public monthlyPrice = 0;
    public maxFileSizeInMb = 0;
    public totalStorageLimitMb = 0;
}

export interface AppConfig {
    supportEmail: string;
    plans: {
        [key in Plans]: PlanDetails;
    }
}

