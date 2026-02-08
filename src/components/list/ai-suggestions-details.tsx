import DetailItemCard from "@/components/cards/detail-item-card";
import Sidebar from "@/components/containers/sidebar";
import FormSection from "@/components/generics/form-section";
import PageTitle from "@/components/generics/page-title";
import Input from "@/components/inputs/input";
import RichTextEditor from "@/components/inputs/rich-text-editor";
import Tabs from "@/components/navigations/tabs";
import { AISearchRequest, AIStageSuggestion, ReferenceEntity } from "@/models/AIStageSuggestion";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { FiMapPin } from "react-icons/fi";
import LoaderIcon from "@/components/loading/loader-icon";
import Button from "@/components/actions/button";
import { FaDirections, FaTrash } from "react-icons/fa";
import DialogComponent from "../modals/confirm-modal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { appRoutes } from "@/utils/appRoutes";
import { useTrip } from "@/context/tripContext";
import { openDirectionLink } from "@/utils/open-link.utils";
import { deleteAISuggestions } from "@/actions/ai-actions";
import Dropdown from "../inputs/dropdown";
import { formatDateForPostgres, generateDateOptions, selectDateOption } from "@/utils/dateTripUtils";
import { upsertStageAction } from "@/actions/stage-actions";
import { INTEREST_MAP } from "@/utils/ai.utils";
import Loader from "../loading/loader";


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
    const { trip } = useTrip();
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const handleDelete = async () => {
        setIsDeleting(true);

        try {
            const response = await deleteAISuggestions(search_results.id);
            if (response.success) {
                toast.success("Suggerimenti eliminati con successo!");
                router.replace(appRoutes.aiInfo(trip?.id as string, reference.type, reference.id, 'new'));
                location.reload();
            } else {
                toast.error("Errore durante l'eliminazione.");
            }
        } catch (error) {
            console.error("Errore:", error);
            toast.error("Errore durante l'eliminazione.");
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
        }
    }
    useEffect(() => {
        if (!search_results) {
            router.replace(appRoutes.aiInfo(trip?.id as string, reference.type, reference.id, 'new'));
        }
    }, [search_results, router, trip?.id, reference]);

    if (!search_results) {
        return <Loader />;
    }


    const interestsDescription = search_results.search_params.selectedInterests
        .map((key: string) => INTEREST_MAP[key] || key.replaceAll('_', ' '))
        .join(", ");


    const description = `Questi sono i suggerimenti generati dall'AI basati su ${reference.address} a una distanza di ${search_results.search_params['distance']}.
    Gli interessi che hai selezionato sono: ${interestsDescription}`;


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

            <PageTitle title="Dettagli Suggerimenti AI" subtitle={description}>
                <Button variant="secondary" size="sm" onClick={() => setIsDeleteOpen(true)}>
                    <FaTrash className="mr-2" />
                    Elimina
                </Button>
            </PageTitle>

            <Tabs tabs={[
                {
                    label: 'Tappe Suggerite',
                    content: <SuggestedStagesList suggestions={search_results.ai_suggestions} reference={reference} />,
                },
                {
                    label: 'Mappa',
                    content: <AISuggestionsMap suggestions={search_results.ai_suggestions} referencePoint={reference} />,
                },
            ]} />
        </>
    );
};



const MapPicker = dynamic(() => import('@/components/maps/map'), {
    ssr: false,
    loading: () => <LoaderIcon />,
});
export const SuggestedStagesList = ({ suggestions, reference }: { suggestions: AIStageSuggestion[], reference: ReferenceEntity }) => {

    const [selectedSuggestion, setSelectedSuggestion] = useState<AIStageSuggestion | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
    const [isOpenAddToStage, setIsOpenAddToStage] = useState<boolean>(false);

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
                            <Button variant="secondary" size="sm" className="absolute top-4 right-4 z-10"
                                onClick={() => openDirectionLink(selectedSuggestion.address)}>
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
                        additionalItems={[
                            {
                                label: 'Aggiungi alle tue tappe',
                                icon: <FiMapPin />,
                                onClick: () => {
                                    setSelectedSuggestion(suggestion);
                                    setIsOpenAddToStage(true);
                                },
                            },
                        ]}
                        icon={<FiMapPin />}
                        title={suggestion.name}
                        subtitle={suggestion.address}
                        latitude={suggestion.lat}
                        longitude={suggestion.lng}
                        detailClick={() => {
                            setSelectedSuggestion(suggestion);
                            setSidebarOpen(true);
                        }}>

                    </DetailItemCard>

                </div>
            ))}
            <AddToStageDialog
                reference={reference}
                suggestion={selectedSuggestion as AIStageSuggestion}
                open={isOpenAddToStage}
                setIsOpen={setIsOpenAddToStage}
            />
        </ul>
    );
};


export const AddToStageDialog = ({ reference, suggestion, open, setIsOpen }: { reference: ReferenceEntity, suggestion: AIStageSuggestion, open: boolean, setIsOpen: (open: boolean) => void }) => {

    const { trip, refreshData } = useTrip();
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const dateOptions = useMemo(() => {
        if (!trip?.start_date || !trip?.end_date) return [];
        return generateDateOptions(new Date(trip.start_date), new Date(trip.end_date));
    }, [trip?.start_date, trip?.end_date]);

    const selectedStartDateOption = useMemo(() =>
        startDate ? selectDateOption(startDate, dateOptions) : null
        , [startDate, dateOptions]);

    const handleSubmit = async () => {


        if (!startDate) {
            toast.error("Per favore, seleziona una data per la tappa.");
            return;
        }

        const stagePayload = {
            id: 'new',
            trip_id: trip?.id as string,
            name: suggestion.name,
            arrival_date: formatDateForPostgres(startDate),
            destination: reference.destination,
            address: suggestion.address,
            lat: suggestion.lat,
            lng: suggestion.lng,
            notes: suggestion.notes || '',
        };


        setIsSubmitting(true);

        try {
            const result = await upsertStageAction(stagePayload);

            if (!result.success) throw new Error(result.error);

            toast.success("Tappa aggiunta con successo!");

            await refreshData(true);

        } catch (err: unknown) {
            if (err instanceof Error) {
                toast.error(err.message || "Errore durante il salvataggio");
            } else {
                toast.error("Errore sconosciuto durante il salvataggio");
            }
        } finally {
            setIsSubmitting(false);
        }
        setIsOpen(false);
    }

    return (
        <DialogComponent
            isOpen={open}
            onClose={() => setIsOpen(false)}
            isLoading={isSubmitting}
            title="Aggiungi Tappa"
            onConfirm={handleSubmit}
        >
            {
                suggestion && (
                    <form className="space-y-4">
                        <Input
                            id="name"
                            label="Nome"
                            value={suggestion.name}
                            readOnly
                        />
                        <Input
                            id="destination"
                            label="Destinazione di riferimento"
                            value={reference.destination}
                            readOnly
                        />
                        <Input
                            id="location"
                            label="Posizione"
                            value={suggestion.address}
                            readOnly
                        />
                        <Dropdown
                            label="Quando vuoi visitare questa tappa?"
                            items={dateOptions}
                            selected={selectedStartDateOption}
                            onSelect={(val) => setStartDate(val?.date)}
                            optionLabel="name"
                            optionValue='id'
                            required
                        />

                    </form>
                )
            }

        </DialogComponent>
    );
};  
