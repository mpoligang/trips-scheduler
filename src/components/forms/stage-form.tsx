'use client';

import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaPen, FaUndo, FaMap } from 'react-icons/fa';
import { createClient } from '@/lib/client'; // Il tuo client Supabase
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import Dropdown from '../inputs/dropdown';
import Input from '../inputs/input';
import PageTitle from '../generics/page-title';
import ContextMenu, { ContextMenuItem } from '../actions/context-menu';
import SearchLocation from '../inputs/search-location';
import { Location } from '@/models/Location';
import { formatDateForPostgres, generateDateOptions, selectDateOption } from '@/utils/dateTripUtils';
import { useTrip } from '@/context/tripContext'; // Il context aggiornato
import { useAuth } from '@/context/authProvider';
import ActionStickyBar from '../actions/action-sticky-bar';
import FormSection from '../generics/form-section';
import RichTextInput from '../inputs/rich-text-editor';
import { EntityKeys } from '@/utils/entityKeys';
import { hasRealContent } from '@/utils/fileSizeUtils';
import { AttachmentList } from '../cards/attachment-manager';

export default function StageForm() {
    const router = useRouter();
    const supabase = createClient();
    const { trip, stages, refreshData } = useTrip();
    const { user } = useAuth();
    const params = useParams();

    const stageId = params.id as string;
    const tripId = params.tripId as string;
    const isNew = stageId === 'new';
    const attachments = stages?.find(s => s.id === stageId)?.attachments || [];

    // Su Supabase usiamo owner_id
    const isOwner = trip?.owner_id === user?.id;

    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stati del form
    const [stageName, setStageName] = useState('');
    const [stageDate, setStageDate] = useState<Date | undefined>();
    const [stageLocation, setStageLocation] = useState<Location | null>(null);
    const [stageDestination, setStageDestination] = useState<{ id: string; name: string } | null>(null);
    const [additionalContents, setAdditionalContents] = useState<string>('');

    // Date Options: convertiamo le stringhe di Supabase in oggetti Date per l'utility
    const dateOptions = useMemo(() => {
        if (!trip?.start_date || !trip?.end_date) { return []; }
        return generateDateOptions(new Date(trip.start_date), new Date(trip.end_date));
    }, [trip?.start_date, trip?.end_date]);

    const selectedDateOption = useMemo(() => {
        if (!stageDate) { return null; }
        return selectDateOption(stageDate, dateOptions);
    }, [stageDate, dateOptions]);

    const populateForm = useCallback(() => {
        // Cerchiamo la tappa nell'array 'stages' fornito dal context
        const stage = stages?.find(s => s.id === stageId);
        if (stage) {
            setStageName(stage.name);
            setStageDate(new Date(stage.arrival_date));
            setStageLocation({
                address: stage.address || '',
                lat: stage.lat || 0,
                lng: stage.lng || 0
            });
            setAdditionalContents(stage.notes || '');
            if (stage.destination) {
                setStageDestination({ id: stage.destination, name: stage.destination });
            }
        } else {
            setStageName('');
            setStageDate(undefined);
            setStageLocation(null);
            setStageDestination(null);
            setAdditionalContents('');
        }
    }, [stages, stageId]);

    useEffect(() => {
        populateForm();
    }, [populateForm]);

    const handleCancel = () => {
        if (isNew) {
            router.back();
        } else {
            populateForm();
            setIsReadOnly(true);
            setError(null);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!trip || !stageName || !stageDate || !stageLocation || !stageDestination) {
            setError("Assicurati di aver compilato tutti i campi obbligatori.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        // Mappatura dati per la tabella 'stages' di Postgres
        const stageData = {
            trip_id: tripId,
            name: stageName,
            arrival_date: formatDateForPostgres(stageDate),
            destination: stageDestination.name,
            address: stageLocation.address,
            lat: stageLocation.lat,
            lng: stageLocation.lng,
            notes: additionalContents, // 'notes' nel tuo CSV
            // position: stages.length + 1 // Opzionale: calcolo posizione
        };

        try {
            if (isNew) {
                const { data, error: insertError } = await supabase
                    .from(EntityKeys.stagesKey)
                    .insert([stageData])
                    .select()
                    .single();

                if (insertError) { throw insertError; }

                // Reindirizziamo ai dettagli della nuova tappa
                router.push(appRoutes.stageDetails(tripId, data.id));
            } else {
                const { error: updateError } = await supabase
                    .from(EntityKeys.stagesKey)
                    .update(stageData)
                    .eq('id', stageId);

                if (updateError) { throw updateError; }

                setIsReadOnly(true);
            }
            await refreshData(true); // Aggiorna il context globale
        } catch (err) {
            console.error("Errore salvataggio Supabase:", err);
            setError("Impossibile salvare la tappa. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Le destinazioni ora arrivano come array di stringhe da Supabase
    const destinationOptions = trip?.destinations?.map(d => ({ id: d, name: d })) || [];

    const menuItems: ContextMenuItem[] = [
        {
            label: 'Indicazioni',
            icon: <FaMap />,
            onClick: () => { if (stageLocation?.address) window.open(mapNavigationUrl(stageLocation.address), '_blank'); }
        }
    ];

    if (isOwner) {
        menuItems.unshift({
            label: isReadOnly ? 'Modifica' : 'Annulla',
            icon: isReadOnly ? <FaPen /> : <FaUndo />,
            onClick: () => {
                if (isReadOnly) setIsReadOnly(false);
                else handleCancel();
            }
        });
    }

    return (
        <div className="space-y-8 pb-24">
            <PageTitle
                title={isNew ? "Aggiungi Tappa" : (isReadOnly ? "Dettagli Tappa" : "Modifica Tappa")}
                subtitle={isNew ? "Inserisci una nuova fermata nel tuo itinerario" : "Visualizza o modifica i dettagli della tappa."}
            >
                {!isNew && <ContextMenu items={menuItems} />}
            </PageTitle>

            <form onSubmit={handleSubmit} className="space-y-4">
                <FormSection title="Informazioni Base" >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            id="stage-name"
                            label="Nome della tappa"
                            value={stageName}
                            onChange={(e) => setStageName(e.target.value)}
                            required
                            readOnly={isReadOnly}
                        />
                        <Dropdown<{ id: string; name: string }>
                            label="Destinazione"
                            items={destinationOptions}
                            selected={stageDestination}
                            onSelect={setStageDestination}
                            optionValue="id"
                            optionLabel="name"
                            placeholder="Scegli destinazione"
                            readOnly={isReadOnly}
                            required
                        />
                    </div>
                </FormSection>

                <FormSection title="Luogo e Data della Tappa">
                    <div className={`grid gap-6 items-start ${isReadOnly ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                        <SearchLocation
                            label="Indirizzo"
                            value={stageLocation}
                            readOnly={isReadOnly}
                            onSelect={setStageLocation}
                            placeholder="Cerca un indirizzo..."
                            required
                        />
                        <Dropdown<{ id: string; name: string; date: Date }>
                            label="Data della tappa"
                            items={dateOptions}
                            selected={selectedDateOption}
                            onSelect={(val) => setStageDate(val?.date)}
                            optionValue="id"
                            optionLabel="name"
                            placeholder="Seleziona data"
                            readOnly={isReadOnly}
                            required
                        />
                    </div>
                </FormSection>

                {
                    isReadOnly && hasRealContent(additionalContents) && (
                        <FormSection title='Contenuti Aggiuntivi'>
                            <RichTextInput
                                value={additionalContents}
                                onChange={setAdditionalContents}
                                readOnly={isReadOnly}
                            />
                        </FormSection>
                    )
                }

                {
                    isReadOnly && attachments.length > 0 && (
                        <FormSection title="Allegati">
                            <AttachmentList
                                attachments={attachments}
                                isReadOnly={true}
                            />
                        </FormSection>
                    )
                }


                {error && (
                    <div className="bg-red-50 p-4 rounded-xl text-red-700 text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                {!isReadOnly && (
                    <ActionStickyBar
                        handleCancel={handleCancel}
                        isSubmitting={isSubmitting}
                        isNew={isNew}
                    />
                )}
            </form>
        </div>
    );
}