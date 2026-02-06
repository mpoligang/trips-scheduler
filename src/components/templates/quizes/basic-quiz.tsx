'use client';

import { useState } from "react";
import ActionStickyBar from "@/components/actions/action-sticky-bar";
import FormSection from "@/components/generics/form-section";
import PageTitle from "@/components/generics/page-title";
import Checkbox from "@/components/inputs/checkbox";
import { RadioButton } from "@/components/inputs/radio-button";
import { generateAndSaveAIStages } from "@/actions/ai-actions";
import { ReferenceEntity } from "@/models/AIStageSuggestion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { appRoutes } from "@/utils/appRoutes";
import { useAuth } from "@/context/authProvider";
import DialogComponent from "@/components/modals/confirm-modal";
import Dropdown from "@/components/inputs/dropdown";
import { AIModels } from "@/utils/ai-utils";
import { useTrip } from "@/context/tripContext";
import { KeyLabelPair, quizCategories } from "@/utils/quiz.utils";

interface AISuggestionsQuizProps {
    address: string;
    lat: number;
    lng: number;
    tripId: string;
    destination: string;
    id: string;
    type: string;
}


export default function AISuggestionsQuiz(props: Readonly<AISuggestionsQuizProps>) {
    const router = useRouter();
    const { userData } = useAuth();
    const { refreshData } = useTrip();
    const [distance, setDistance] = useState<string>("1km");
    const [stageCount, setStageCount] = useState<string>("1-5");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorDialogOpen, setErrorDialogOpen] = useState<boolean>(false);
    const [selectedCategory, setSelectedCategory] = useState<KeyLabelPair>({ key: '', label: '' });
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const handleInterestChange = (value: string) => {
        setSelectedInterests((prev) =>
            prev.includes(value)
                ? prev.filter((item) => item !== value)
                : [...prev, value]
        );
    };

    const handleCategoryChange = (newCategories: KeyLabelPair) => {
        setSelectedCategory(newCategories);
        const validSubKeys = newCategories.items?.map(sub => sub.key) || [];
        setSelectedInterests(prev => prev.filter(key => validSubKeys.includes(key)));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) { return; }

        if (selectedInterests.length === 0 || distance === "" || stageCount === "") {
            toast.error("Completa il quiz prima di inviare la richiesta.");
            return;
        }

        try {
            setIsSubmitting(true);
            const requestData = {
                distance: distance,
                stageRange: stageCount, // Usa lo stato corretto
                selectedInterests: selectedInterests,
            };
            const reference: ReferenceEntity = {
                id: props.id,
                address: props.address,
                lat: props.lat,
                lng: props.lng,
                destination: props.destination,
                type: props.type,
            };

            const result = await generateAndSaveAIStages(
                userData?.ai_api_key as string,
                userData?.ai_model as string || AIModels.GEMINI_FLASH_LITE,
                requestData,
                reference,
                props.tripId
            );

            if (result.success) {
                toast.success("Itinerario generato con successo!");
                await refreshData(true);
                router.replace(`${appRoutes.home}/trips/${props.tripId}/${props.type}/${props.id}/ai/${result.request_id}`);
            } else {
                toast.error(result.error || "C'è stato un problema nel generare l'itinerario. Riprova.");
            }
        } catch (error) {
            console.error("Errore durante la generazione:", error);
            alert("C'è stato un problema nel generare l'itinerario. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };



    return (
        <>
            <PageTitle
                title="Completa il quiz"
                subtitle={`L'intelligenza artificiale ti suggerirà tappe e attività da fare nei dintorni di ${props?.address}, in base alle tue preferenze!`}
            />

            <form onSubmit={handleSubmit} className="space-y-8 pb-24">

                {/* DISTANZA - RadioButton */}
                <FormSection title="Quanto vuoi allontanarti dalla tappa?">
                    <div className="flex flex-col space-y-1">
                        <RadioButton
                            id="dist-1" name="distance" value="1km"
                            checked={distance === "1km"} onChange={setDistance}
                        >
                            <span className="text-white"> Entro 1 km</span>  <span className="block text-xs opacity-70">(5-10 min a piedi)</span>
                        </RadioButton>
                        <RadioButton
                            id="dist-5" name="distance" value="5km"
                            checked={distance === "5km"} onChange={setDistance}
                        >
                            <span className="text-white"> Entro 5 km</span> <span className="block text-xs opacity-70">(15-30 min in bici)</span>
                        </RadioButton>
                        <RadioButton
                            id="dist-15" name="distance" value="15km"
                            checked={distance === "15km"} onChange={setDistance}
                        >
                            <span className="text-white"> Entro 15 km</span> <span className="block text-xs opacity-70">(30-60 min in auto o mezzi)</span>
                        </RadioButton>
                    </div>
                </FormSection>


                {/* NUMERO TAPPE - RadioButton */}
                {/* FIX: name="stageCount" (prima era "distance" duplicato) */}
                <FormSection title="Quante tappe vuoi visualizzare?">
                    <div className="flex flex-col space-y-1">
                        <RadioButton
                            id="tappe-1-5" name="stageCount" value="1-5"
                            checked={stageCount === "1-5"} onChange={setStageCount}
                        >
                            <span className="text-white">da 1 a 5 tappe</span>
                        </RadioButton>
                        <RadioButton
                            id="tappe-5-10" name="stageCount" value="5-10"
                            checked={stageCount === "5-10"} onChange={setStageCount}
                        >
                            <span className="text-white">da 5 a 10 tappe</span>
                        </RadioButton>
                        <RadioButton
                            id="tappe-10-15" name="stageCount" value="10-15"
                            checked={stageCount === "10-15"} onChange={setStageCount}
                        >
                            <span className="text-white">da 10 a 15 tappe</span>
                        </RadioButton>
                    </div>
                </FormSection>


                {/* CATEGORIE - MultiSelect + Checkbox */}
                <FormSection title="Cosa vuoi che l'AI trovi per te?" className="border-none">
                    <div className="flex flex-col space-y-4">

                        {/* 2. FIX: Usa handleCategoryChange invece del setter diretto */}
                        <Dropdown<KeyLabelPair>
                            label="Seleziona la categoria di interesse"
                            items={quizCategories}
                            optionLabel="label"
                            optionValue="key"
                            selected={selectedCategory}
                            onSelect={(category) => handleCategoryChange(category as KeyLabelPair)}
                        />

                        <FormSection key={selectedCategory.key} title={selectedCategory.label}>
                            <div className="flex flex-col space-y-4">
                                {(selectedCategory.items || []).map((subcategory) => (
                                    <div key={subcategory.key} className="flex flex-col space-y-2">
                                        {/* 1. FIX: handleInterestChange ora gestisce il toggle correttamente */}
                                        <Checkbox
                                            id={`${selectedCategory.key}-${subcategory.key}`}
                                            checked={selectedInterests.includes(subcategory.key)}
                                            onChange={() => handleInterestChange(subcategory.key)}
                                        >
                                            <span className="text-white">{subcategory.label}</span>
                                        </Checkbox>
                                    </div>
                                ))}
                            </div>
                        </FormSection>

                    </div>
                </FormSection>

                <DialogComponent
                    isOpen={errorDialogOpen}
                    onClose={() => setErrorDialogOpen(false)}
                    title="Conferma"
                    isLoading={false}
                    showCancelButton={false}
                    confirmText="Chiudi"
                    onConfirm={() => setErrorDialogOpen(false)}
                >
                    <p>Si è verificato un errore durante la generazione dell&apos;itinerario. Riprova.</p>
                </DialogComponent>

                <ActionStickyBar
                    handleCancel={() => { }}
                    showCancel={false}
                    isSubmitting={isSubmitting}
                />
            </form>
        </>
    );
}