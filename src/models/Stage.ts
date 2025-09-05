export interface Stage {
    id: string;
    name: string;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    date: string;
    description?: string;
}
