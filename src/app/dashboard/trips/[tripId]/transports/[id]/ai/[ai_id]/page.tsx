'use client';
import { useTrip } from "@/context/tripContext";
import { useParams } from "next/navigation";
import AISuggestionsQuiz from "@/components/templates/quizes/basic-quiz";
import { EntityKeys } from "@/utils/entityKeys";
import AISuggestionsDetails from "@/components/list/ai-suggestions-details";
import AIContainerTemplate from "@/components/containers/ai-container-template";
import { AISearchRequest, ReferenceEntity } from "@/models/AIStageSuggestion";

export default function AIInfoPage() {
    const { trip } = useTrip();
    const params = useParams();
    const id = params.id as string;
    const ai_id = params.ai_id as string;
    const isNew = ai_id === 'new';
    const reference = trip?.transports?.find((data) => data.id === id);
    const search_results = trip?.ai_search_requests?.find((req) => req.id === ai_id) as AISearchRequest;
    const referencePoint: ReferenceEntity = {
        id: reference?.id as string,
        address: reference?.dep_address as string,
        lat: reference?.dep_lat as number,
        lng: reference?.dep_lng as number,
        destination: reference?.destination as string,
        type: EntityKeys.transportsKey,
        name: reference?.title as string
    }

    return (
        <AIContainerTemplate detailId={id} sectionPath={EntityKeys.transportsKey}>
            {isNew ? (
                <AISuggestionsQuiz
                    address={reference?.dep_address as string}
                    lat={reference?.dep_lat as number}
                    lng={reference?.dep_lng as number}
                    tripId={trip?.id as string}
                    id={reference?.id as string}
                    destination={reference?.destination as string}
                    type={EntityKeys.transportsKey}
                />
            ) : (
                <AISuggestionsDetails search_results={search_results} reference={referencePoint} />
            )
            }

        </AIContainerTemplate>
    );
}