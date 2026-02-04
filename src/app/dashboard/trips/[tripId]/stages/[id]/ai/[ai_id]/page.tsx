'use client';
import StageTemplatePage from "@/components/templates/stage-template";
import { useTrip } from "@/context/tripContext";
import { useParams } from "next/navigation";
import AISuggestionsQuiz from "@/components/templates/quizes/basic-quiz";
import { EntityKeys } from "@/utils/entityKeys";
import AISuggestionsDetails from "@/components/list/ai/ai-suggestions-details";

export default function AIInfoPage() {
    const { trip } = useTrip();
    const params = useParams();
    const id = params.id;
    const ai_id = params.ai_id;
    const isNew = ai_id === 'new';
    const reference = trip?.stages?.find((stage) => stage.id === id);
    const suggestions = trip?.ai_search_requests?.find((req) => req.id === ai_id)?.ai_suggestions || []

    console.log(trip);

    return (
        <StageTemplatePage>
            {
                isNew ? (
                    <AISuggestionsQuiz
                        address={reference?.address as string}
                        lat={reference?.lat as number}
                        lng={reference?.lng as number}
                        tripId={trip?.id as string}
                        id={reference?.id as string}
                        destination={reference?.destination as string}
                        type={EntityKeys.stagesKey}
                    />
                ) : (
                    <AISuggestionsDetails suggestions={suggestions} />
                )
            }

        </StageTemplatePage>
    );
}