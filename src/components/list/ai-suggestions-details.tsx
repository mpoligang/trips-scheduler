import DetailItemCard from "@/components/cards/detail-item-card";
import Sidebar from "@/components/containers/sidebar";
import FormSection from "@/components/generics/form-section";
import PageTitle from "@/components/generics/page-title";
import Input from "@/components/inputs/input";
import RichTextEditor from "@/components/inputs/rich-text-editor";
import Tabs from "@/components/navigations/tabs";
import { AISearchRequest, AIStageSuggestion, ReferenceEntity } from "@/models/AIStageSuggestion";
import dynamic from "next/dynamic";
import { useState } from "react";
import { FiMapPin } from "react-icons/fi";
import LoaderIcon from "@/components/loading/loader-icon";
import Button from "@/components/actions/button";
import { FaDirections, FaTrash } from "react-icons/fa";
import DialogComponent from "../modals/confirm-modal";
// import { deleteAISuggestions } from "@/actions/ai-actions";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { appRoutes } from "@/utils/appRoutes";
import { useTrip } from "@/context/tripContext";


const AISuggestionsMap = dynamic(
    () => import('@/components/maps/suggested-stages-map'), // Assicurati che il percorso sia corretto
    {
        ssr: false,
    }
);

export default function AISuggestionsDetails({ search_results, reference }:
    {
        readonly search_results: AISearchRequest;
        readonly reference: ReferenceEntity
    }) {

    const router = useRouter();
    const { trip, refreshData } = useTrip();
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        // try {
        //     const response = await deleteAISuggestions(search_results.id);
        //     if (response.success) {
        //         toast.success("Suggerimenti eliminati con successo!");
        //         await refreshData();
        //         router.push(appRoutes.aiInfo(trip?.id as string, reference.type, reference.id, 'new'));

        //     } else {
        //         toast.error("Errore durante l'eliminazione dei suggerimenti.");
        //     }
        // } catch (error) {
        //     console.error("Errore durante l'eliminazione:", error);
        //     toast.error("Errore durante l'eliminazione dei suggerimenti.");
        // } finally {
        //     setIsDeleting(false);
        //     setIsDeleteOpen(false);
        // }
    }


    return (



        <>
            <DialogComponent
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Conferma Eliminazione"
                isLoading={isDeleting}
                onConfirm={() => {
                    handleDelete();
                }}
            >
                <p>Sei sicuro di voler eliminare questa lista di suggerimenti? L&apos;azione è irreversibile.</p>
            </DialogComponent>

            <PageTitle title="Dettagli Suggerimenti AI" subtitle={`Numero di suggerimenti generati: ${search_results.ai_suggestions.length}`}>
                <Button variant="secondary" size="sm" onClick={() => setIsDeleteOpen(true)}>
                    <FaTrash className="mr-2" />
                    Elimina
                </Button>
            </PageTitle>

            <Tabs tabs={[
                {
                    label: 'Tappe Suggerite',
                    content: <SuggestedStagesList suggestions={search_results.ai_suggestions} />,
                },
                {
                    label: 'Mappa',
                    content: <AISuggestionsMap suggestions={search_results.ai_suggestions} referencePoint={reference} />,
                },
            ]} />
        </>
    );



}



const MapPicker = dynamic(() => import('@/components/maps/map'), {
    ssr: false,
    loading: () => <LoaderIcon />,
});
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
        <ul >
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} title="Dettagli Tappa Suggerita">
                {selectedSuggestion ? (
                    <>
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
                                    readOnly
                                />

                            </div>
                        </FormSection>

                        <FormSection title="Mappa" className="p-5 relative">
                            <Button variant="secondary" size="sm" className="absolute top-4 right-4 z-10" onClick={() => setSidebarOpen(false)}>
                                <FaDirections className="mr-2" />
                                Indicazioni
                            </Button>
                            <MapPicker value={{
                                lat: selectedSuggestion.lat,
                                lng: selectedSuggestion.lng,
                                address: selectedSuggestion.address
                            }} />
                        </FormSection>
                    </>
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
    );
};
