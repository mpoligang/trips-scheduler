export enum RoutingModeEnum {
    Walking = 'walking',
    Cycling = 'cycling',
    Driving = 'driving',
    Transit = 'transit',
}

export type RoutingMode = `${RoutingModeEnum}`;

export const ROUTING_MODES: RoutingMode[] = [
    RoutingModeEnum.Walking,
    RoutingModeEnum.Cycling,
    RoutingModeEnum.Driving,
    RoutingModeEnum.Transit,
];

export interface StageLeg {
    id: string;
    trip_id: string;
    from_stage_id: string;
    to_stage_id: string;
    mode: RoutingMode;
    distance_m: number;
    duration_s: number;
    provider: string;
    computed_at: string;
}

export interface StageLegPreference {
    from_stage_id: string;
    to_stage_id: string;
    trip_id: string;
    mode: RoutingMode;
    updated_at: string;
}
