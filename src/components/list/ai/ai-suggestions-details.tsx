import DetailItemCard from "@/components/cards/detail-item-card";
import Sidebar from "@/components/containers/sidebar";
import FormSection from "@/components/generics/form-section";
import PageTitle from "@/components/generics/page-title";
import Input from "@/components/inputs/input";
import RichTextEditor from "@/components/inputs/rich-text-editor";
import SearchLocation from "@/components/inputs/search-location";
import Tabs from "@/components/navigations/tabs";
import { AIStageSuggestion } from "@/models/AIStageSuggestion";
import { useState } from "react";
import { FiMapPin } from "react-icons/fi";

export default function AISuggestionsDetails({ suggestions }: { suggestions: AIStageSuggestion[] }) {

    console.log(suggestions);

    return (
        <>
            <PageTitle title="Dettagli Suggerimenti AI" subtitle={`Numero di suggerimenti generati: ${suggestions.length}`} />

            <Tabs tabs={
                [
                    {
                        label: 'Tappe Suggerite',
                        content: <SuggestedStagesList suggestions={suggestions} />,
                    },
                    {
                        label: 'Mappa',
                        content: '',
                    },
                ]
            } />
        </>
    );

}



export const SuggestedStagesList = ({ suggestions }: { suggestions: AIStageSuggestion[] }) => {

    const [selectedSuggestion, setSelectedSuggestion] = useState<AIStageSuggestion | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

    const additionalItems = [
        {
            label: 'Aggiungi alle tue tappe',
            icon: <FiMapPin />,
            onClick: () => {
            },
        },
    ];

    return (
        <>
            <ul >
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} title="Dettagli Tappa Suggerita">
                    {selectedSuggestion ? (
                        <FormSection title="Informazioni" className="p-5">
                            <div className="space-y-4">
                                <Input
                                    id="name"
                                    label="Nome"
                                    value={selectedSuggestion.name}
                                    readOnly
                                />
                                <Input
                                    id="location"
                                    label="Posizione"
                                    onSelect={() => { }}
                                    value={selectedSuggestion.address}
                                    readOnly
                                />
                                <RichTextEditor
                                    label="Note"
                                    value={selectedSuggestion.notes as string}
                                    onChange={(value) => setSelectedSuggestion({ ...selectedSuggestion, notes: value })}
                                    className="mb-4"
                                    readOnly
                                />

                            </div>
                        </FormSection>
                    ) : (
                        <p className="p-4 text-gray-600">Nessuna tappa selezionata.</p>
                    )}
                </Sidebar>
                {suggestions.map((suggestion) => (
                    <div className="mb-4" key={suggestion.id}>

                        <DetailItemCard
                            additionalItems={additionalItems}
                            icon={<FiMapPin />}
                            title={suggestion.name}
                            subtitle={suggestion.address}
                            directionsUrl={''}
                            detailClick={() => {
                                setSelectedSuggestion(suggestion);
                                setSidebarOpen(true);
                            }}>

                        </DetailItemCard>

                    </div>
                ))}
            </ul>
        </>
    );
};
