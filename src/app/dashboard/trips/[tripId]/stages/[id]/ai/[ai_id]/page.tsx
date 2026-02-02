'use client';

import { useState } from "react";
import ActionStickyBar from "@/components/actions/action-sticky-bar";
import FormSection from "@/components/generics/form-section";
import PageTitle from "@/components/generics/page-title";
import Checkbox from "@/components/inputs/checkbox"; // Assicurati che il path sia corretto
import { RadioButton } from "@/components/inputs/radio-button"; // Assicurati che il path sia corretto
import StageTemplatePage from "@/components/templates/stage-template";

export default function AIInfoPage() {
    // Stato per i Radio Buttons (Scelta singola)
    const [distance, setDistance] = useState<string>("1km");
    const [duration, setDuration] = useState<string>("short");

    // Stato per le Checkbox (Scelta multipla)
    const [interests, setInterests] = useState({
        culture: false,
        food: false,
        leisure: false,
        nature: false, // Aggiunto per arricchire
    });

    const handleInterestChange = (key: keyof typeof interests) => {
        setInterests((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = { distance, duration, interests };
        console.log("Dati per l'IA:", formData);
        // Qui chiamerai la tua API o funzione per l'IA
    };

    return (
        <StageTemplatePage>
            <PageTitle
                title="Genera informazioni AI"
                subtitle="Personalizza la tua esperienza: l'intelligenza artificiale ti darà dei suggerimenti su misura per te."
            />

            <form onSubmit={handleSubmit} className="space-y-8 pb-24">

                {/* DISTANZA - RadioButton (Scelta univoca) */}
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

                {/* TEMPO - RadioButton (Scelta univoca) */}
                <FormSection title="Quanto tempo hai a disposizione?">
                    <div className="flex flex-col space-y-1">
                        <RadioButton
                            id="time-short" name="duration" value="short"
                            checked={duration === "short"} onChange={setDuration}
                        >
                            <span className="text-white"> Breve sosta</span> <span className="block text-xs opacity-70">Meno di un&apos;ora (giusto un&apos;occhiata)</span>
                        </RadioButton>
                        <RadioButton
                            id="time-half" name="duration" value="half"
                            checked={duration === "half"} onChange={setDuration}
                        >
                            <span className="text-white"> Mezza giornata</span> <span className="block text-xs opacity-70">2-4 ore di esplorazione</span>
                        </RadioButton>
                        <RadioButton
                            id="time-full" name="duration" value="full"
                            checked={duration === "full"} onChange={setDuration}
                        >
                            <span className="text-white"> Intera giornata</span> <span className="block text-xs opacity-70">4-8 ore di esplorazione</span>
                        </RadioButton>
                    </div>
                </FormSection>

                {/* CATEGORIE - Checkbox (Scelta multipla) */}
                <FormSection title="Cosa vuoi che l'AI trovi per te?">
                    <div className="flex flex-col space-y-4 pt-2">
                        <Checkbox
                            id="cat-culture"
                            checked={interests.culture}
                            onChange={() => handleInterestChange('culture')}
                        >
                            <span className="text-white font-medium">Cultura e Storia</span>
                            <span className="block text-xs opacity-70">Musei, monumenti e siti archeologici</span>
                        </Checkbox>

                        <Checkbox
                            id="cat-food"
                            checked={interests.food}
                            onChange={() => handleInterestChange('food')}
                        >
                            <span className="text-white font-medium">Gastronomia</span>
                            <span className="block text-xs opacity-70">Ristoranti tipici, Street food o mercati locali</span>
                        </Checkbox>

                        <Checkbox
                            id="cat-leisure"
                            checked={interests.leisure}
                            onChange={() => handleInterestChange('leisure')}
                        >
                            <span className="text-white font-medium">Svago e Relax</span>
                            <span className="block text-xs opacity-70">Parchi, piscine, terme o shopping</span>
                        </Checkbox>

                        <Checkbox
                            id="cat-nature"
                            checked={interests.nature}
                            onChange={() => handleInterestChange('nature')}
                        >
                            <span className="text-white font-medium">Natura e Panorami</span>
                            <span className="block text-xs opacity-70">Punti panoramici, sentieri o aree verdi</span>
                        </Checkbox>
                    </div>
                </FormSection>

                <ActionStickyBar
                    handleCancel={() => { }}
                    showCancel={false}
                    isSubmitting={false}
                />
            </form>
        </StageTemplatePage>
    );
}