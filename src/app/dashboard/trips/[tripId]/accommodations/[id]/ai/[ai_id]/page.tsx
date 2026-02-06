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
    const reference = trip?.accommodations?.find((data) => data.id === id);
    const referencePoint: ReferenceEntity = {
        id: reference?.id as string,
        address: reference?.address as string,
        lat: reference?.lat as number,
        lng: reference?.lng as number,
        destination: reference?.destination as string,
        type: EntityKeys.accommodationsKey,
        name: reference?.name as string
    }
    const search_results = trip?.ai_search_requests?.find((req) => req.id === ai_id) as AISearchRequest

    return (
        <AIContainerTemplate detailId={id} sectionPath={EntityKeys.accommodationsKey}>
            {isNew ? (
                <AISuggestionsQuiz
                    address={reference?.address as string}
                    lat={reference?.lat as number}
                    lng={reference?.lng as number}
                    tripId={trip?.id as string}
                    id={reference?.id as string}
                    destination={reference?.destination as string}
                    type={EntityKeys.accommodationsKey}
                />
            ) : (
                <AISuggestionsDetails search_results={search_results} reference={referencePoint} />
            )}

        </AIContainerTemplate>
    );
}