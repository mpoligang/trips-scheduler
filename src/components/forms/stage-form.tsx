'use client';

import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { FaPen, FaUndo, FaMap } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/firebase/config';
import { Stage } from '@/models/Stage';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import Dropdown from '../inputs/dropdown';
import Input from '../inputs/input';
import PageTitle from '../generics/page-title';
import ContextMenu, { ContextMenuItem } from '../actions/context-menu';
import SearchLocation from '../inputs/search-location';
import { EntityKeys } from '@/utils/entityKeys';
import { Attachment } from '@/models/Attachment';
import { Location } from '@/models/Location';
import { generateDateOptions, selectDateOption } from '@/utils/dateTripUtils';
import { useTrip } from '@/context/tripContext';
import { useAuth } from '@/context/authProvider';
import ActionStickyBar from '../actions/action-sticky-bar';
import FormSection from '../generics/form-section';
import RichTextInput from '../inputs/rich-text-editor';


export default function StageForm() {
    const router = useRouter();
    const { trip } = useTrip();
    const { user } = useAuth();
    const params = useParams();
    const stageId = params.id as string;
    const tripId = params.tripId as string;
    const isNew = stageId === 'new';
    const isOwner = trip?.owner === user?.uid;

    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stati del form
    const [stageName, setStageName] = useState('');
    const [stageDate, setStageDate] = useState<Date | undefined>();
    const [stageLocation, setStageLocation] = useState<Location | null>(null);
    const [stageDestination, setStageDestination] = useState<{ id: string; name: string } | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [additionalContents, setAdditionalContents] = useState<string>('');

    const dateOptions = useMemo(() => {
        if (!trip?.startDate || !trip?.endDate) { return []; }
        return generateDateOptions(trip.startDate.toDate(), trip.endDate.toDate());
    }, [trip?.startDate, trip?.endDate]);

    // Trova l'opzione selezionata per il dropdown basandosi sulla data corrente
    const selectedDateOption = useMemo(() => {
        if (!stageDate) { return null; }
        return selectDateOption(stageDate, dateOptions);
    }, [stageDate, dateOptions]);

    const populateForm = useCallback(() => {
        const stage = trip?.stages?.find(s => s.id === stageId);
        if (stage) {
            setStageName(stage.name);
            setStageDate(new Date(stage.date));
            setStageLocation(stage.location);
            setAttachments(stage.attachments || []);
            setAdditionalContents(stage.additionalContents || '');
            if (stage.destination) {
                setStageDestination({ id: stage.destination, name: stage.destination });
            }
        } else {
            setStageName('');
            setStageDate(undefined);
            setStageLocation(null);
            setStageDestination(null);
            setAdditionalContents('');
            setAttachments([]);
        }
    }, [trip?.stages, stageId]);

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

        const stageData: Stage = {
            id: isNew ? uuidv4() : (stageId as string),
            name: stageName,
            date: stageDate.toISOString().split('T')[0],
            location: stageLocation,
            destination: stageDestination.name,
            attachments: attachments,
            additionalContents
        };

        try {
            const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
            if (!isNew) {
                const updatedStages = trip.stages?.map(s =>
                    s.id === stageId ? stageData : s
                ) || [];
                await updateDoc(tripDocRef, { stages: updatedStages });
                setIsReadOnly(true);
            } else {
                await updateDoc(tripDocRef, { stages: arrayUnion(stageData) });
                router.push(appRoutes.stageDetails(tripId, stageData.id));
            }
        } catch (err) {
            console.error("Errore salvataggio:", err);
            setError("Impossibile salvare la tappa. Riprova.");
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
                subtitle={isNew ? "Inserisci una nuova fermata nel tuo itinerario" : "Visualizza o modifica i dettagli della tappa selezionata."}
            >
                {!isNew && <ContextMenu items={menuItems} />}
            </PageTitle>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* 1. SEZIONE INFORMAZIONI */}

                <FormSection title="Informazioni Base" >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            id="stage-name"
                            label="Nome della tappa"
                            placeholder="Es. Visita ai musei"
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




                {/* 2. SEZIONE LUOGO E TEMPO */}

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
                    isReadOnly && additionalContents.replace(/<[^>]*>/g, '').length > 0 && (
                        <FormSection title='Contenuti Aggiuntivi'>
                            <RichTextInput
                                value={additionalContents}
                                onChange={setAdditionalContents}
                                readOnly={true}
                            />
                        </FormSection>
                    )
                }
                {
                    !isReadOnly && (
                        <FormSection title='Contenuti Aggiuntivi'>
                            <RichTextInput
                                value={additionalContents}
                                onChange={setAdditionalContents}
                            />
                        </FormSection>
                    )
                }


                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-4 rounded-xl text-red-700 dark:text-red-400 text-sm text-center font-medium animate-in fade-in">
                        {error}
                    </div>
                )}

                {
                    !isReadOnly && (
                        <ActionStickyBar
                            handleCancel={handleCancel}
                            isSubmitting={isSubmitting}
                            isNew={isNew}
                        />
                    )
                }


            </form>
        </div>
    );
}