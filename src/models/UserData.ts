
export interface UserData {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    username: string | null;
    plan: Plan;
    expiration_plan_date: string | null;
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