'use client';

import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaPen, FaUndo, FaMap } from 'react-icons/fa';
import toast from 'react-hot-toast';

import { useTrip } from '@/context/tripContext';
import { useAuth } from '@/context/authProvider';
import { upsertStageAction } from '@/actions/stage-actions';

import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import { formatDateForPostgres, generateDateOptions, selectDateOption } from '@/utils/dateTripUtils';
import { Location } from '@/models/Location';
import { hasRealContent } from '@/utils/fileSizeUtils';

import Dropdown from '../inputs/dropdown';
import Input from '../inputs/input';
import PageTitle from '../generics/page-title';
import ContextMenu, { ContextMenuItem } from '../actions/context-menu';
import SearchLocation from '../inputs/search-location';
import ActionStickyBar from '../actions/action-sticky-bar';
import FormSection from '../generics/form-section';
import RichTextInput from '../inputs/rich-text-editor';
import { AttachmentList } from '../cards/attachment-manager';

export default function StageForm() {
    const router = useRouter();
    const { trip, stages, refreshData } = useTrip();
    const { user } = useAuth();
    const params = useParams();

    const stageId = params.id as string;
    const tripId = params.tripId as string;
    const isNew = stageId === 'new';
    const attachments = stages?.find(s => s.id === stageId)?.attachments || [];

    const isOwner = trip?.owner_id === user?.id;

    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Stato error rimosso

    // Stati del form (Invariati)
    const [stageName, setStageName] = useState('');
    const [stageDate, setStageDate] = useState<Date | undefined>();
    const [stageLocation, setStageLocation] = useState<Location | null>(null);
    const [stageDestination, setStageDestination] = useState<{ id: string; name: string } | null>(null);
    const [additionalContents, setAdditionalContents] = useState<string>('');

    const dateOptions = useMemo(() => {
        if (!trip?.start_date || !trip?.end_date) { return []; }
        return generateDateOptions(new Date(trip.start_date), new Date(trip.end_date));
    }, [trip?.start_date, trip?.end_date]);

    const selectedDateOption = useMemo(() => {
        if (!stageDate) { return null; }
        return selectDateOption(stageDate, dateOptions);
    }, [stageDate, dateOptions]);

    const populateForm = useCallback(() => {
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
        }
    }, [stages, stageId]);

    useEffect(() => {
        if (!isNew) populateForm();
    }, [populateForm, isNew]);

    const handleCancel = () => {
        if (isNew) router.back();
        else { populateForm(); setIsReadOnly(true); }
    };

    // --- SUBMIT CON SERVER ACTION ---
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validazione Client-side
        if (!trip || !stageName || !stageDate || !stageLocation || !stageDestination) {
            toast.error("Assicurati di aver compilato tutti i campi obbligatori.");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading(isNew ? "Aggiungendo tappa..." : "Salvando modifiche...");

        const stagePayload = {
            id: stageId, // La action gestirà il valore 'new'
            trip_id: tripId,
            name: stageName,
            arrival_date: formatDateForPostgres(stageDate),
            destination: stageDestination.name,
            address: stageLocation.address,
            lat: stageLocation.lat,
            lng: stageLocation.lng,
            notes: additionalContents,
        };

        try {
            const result = await upsertStageAction(stagePayload);

            if (!result.success) throw new Error(result.error);

            toast.success(isNew ? "Tappa aggiunta!" : "Tappa aggiornata!", { id: toastId });

            await refreshData(true);

            if (isNew) {
                // Dopo la creazione, torniamo alla lista o ai dettagli
                router.push(appRoutes.accommodations(tripId)); // o dove preferisci
            } else {
                setIsReadOnly(true);
            }
        } catch (err: any) {
            toast.error(err.message || "Errore durante il salvataggio", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const destinationOptions = trip?.destinations?.map(d => ({ id: d, name: d })) || [];

    const menuItems: ContextMenuItem[] = [
        {
            label: 'Indicazioni',
            icon: <FaMap />,
            onClick: () => { if (stageLocation?.address) window.open(mapNavigationUrl(stageLocation.address), '_blank'); }
        }
    ];

    if (isOwner && !isNew) {
        menuItems.unshift({
            label: isReadOnly ? 'Modifica' : 'Annulla',
            icon: isReadOnly ? <FaPen /> : <FaUndo />,
            onClick: () => isReadOnly ? setIsReadOnly(false) : handleCancel()
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

                {/* Mostra se non è sola lettura (modifica) OPPURE se c'è contenuto reale (lettura) */}
                {(!isReadOnly || hasRealContent(additionalContents)) && (
                    <FormSection title='Contenuti Aggiuntivi'>
                        <RichTextInput
                            value={additionalContents}
                            onChange={setAdditionalContents}
                            readOnly={isReadOnly}
                        />
                    </FormSection>
                )}

                {isReadOnly && attachments.length > 0 && (
                    <FormSection title="Allegati">
                        <AttachmentList attachments={attachments} isReadOnly={true} />
                    </FormSection>
                )}


                {!isReadOnly && (
                    <ActionStickyBar handleCancel={handleCancel} isSubmitting={isSubmitting} isNew={isNew} />
                )}
            </form>
        </div>
    );
}