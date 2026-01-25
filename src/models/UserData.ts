
export interface UserData {
    uid: string;
    firstName: string;
    lastName: string;
    email: string;
    plan: Plan;
    expirationPlanDate: string | null;
    totalTripsCreated: number;
    totalStorageUsedInBytes: number;
    expiration_plan_date: string | null;
    first_name: string | null;
    id: string | null;
    last_name: string | null;
    total_storage_used_in_bytes: number | null;
    total_trips_created: number | null;
    updated_at: string | null;
}


export interface Plan {
    id: string;
    name: string;
    storage_limit_bytes: number;
    max_file_size_bytes: number;
    max_trips: number;
}