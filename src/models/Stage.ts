import { Attachment } from "./Attachment";
import { Location } from "./Location";

export interface Stage {
    id: string;
    name: string;
    destination: string;
    location: Location | null;
    date: string;
    description?: string;
    attachments?: Attachment[];
}

