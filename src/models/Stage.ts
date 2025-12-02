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
    attachments?: Attachment[];
}

export interface Attachment {
    id: string;
    name: string;
    url: string;
    type: 'file' | 'link';
    createdAt: string;
}

