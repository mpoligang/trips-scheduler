export interface Stage {
    id: string;
    name: string;
    destination: string;
    location: {
        lat: number;
        lng: number;
        address: string;
    };
    date: string;
    description?: string;
}
