'use client';

import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { FaPen, FaUndo, FaCheck, FaMap } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

import { db } from '@/firebase/config';
import { Trip } from '@/models/Trip';
import { Stage, Attachment } from '@/models/Stage';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import Dropdown from '../inputs/dropdown';
import Input from '../inputs/input';
import PageTitle from '../generics/page-title';
import ContextMenu, { ContextMenuItem } from '../actions/context-menu';
import SearchLocation from '../inputs/search-location';
import Button from '../actions/button';
import { EntityKeys } from '@/utils/entityKeys';

interface StageFormProps {
    readonly trip: Trip;
    readonly tripId: string;
    readonly stageId?: string;
    readonly isNew: boolean;
    readonly isOwner: boolean;
    readonly onSuccess?: () => Promise<void>;
}

export default function StageForm({
    trip,
    tripId,
    stageId,
    isNew,
    isOwner,
    onSuccess
}: Readonly<StageFormProps>) {
    const router = useRouter();

    // Stati locali
    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stati del form
    const [stageName, setStageName] = useState('');
    const [stageDate, setStageDate] = useState<Date | undefined>();
    const [stageLocation, setStageLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [stageDestination, setStageDestination] = useState<{ id: string; name: string } | null>(null);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    // Generazione delle date disponibili tra startDate e endDate del viaggio
    const dateOptions = useMemo(() => {
        if (!trip?.startDate || !trip?.endDate) return [];
        const dates = [];
        const start = trip.startDate.toDate();
        const end = trip.endDate.toDate();

        const current = new Date(start);
        current.setHours(0, 0, 0, 0);
        const finalEnd = new Date(end);
        finalEnd.setHours(0, 0, 0, 0);

        while (current <= finalEnd) {
            const dateObj = new Date(current);
            const id = dateObj.toISOString().split('T')[0];
            dates.push({
                id: id,
                name: dateObj.toLocaleDateString('it-IT', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                }),
                date: dateObj
            });
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, [trip?.startDate, trip?.endDate]);

    // Trova l'opzione selezionata per il dropdown basandosi sulla data corrente
    const selectedDateOption = useMemo(() => {
        if (!stageDate) return null;
        const iso = stageDate.toISOString().split('T')[0];
        return dateOptions.find(opt => opt.id === iso) || null;
    }, [stageDate, dateOptions]);

    const populateForm = useCallback(() => {
        const stage = trip.stages?.find(s => s.id === stageId);
        if (stage) {
            setStageName(stage.name);
            setStageDate(new Date(stage.date));
            setStageLocation(stage.location);
            setAttachments(stage.attachments || []);
            if (stage.destination) {
                setStageDestination({ id: stage.destination, name: stage.destination });
            }
        } else {
            setStageName('');
            setStageDate(undefined);
            setStageLocation(null);
            setStageDestination(null);
            setAttachments([]);
        }
    }, [trip.stages, stageId]);

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
        };

        try {
            const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
            if (!isNew) {
                const updatedStages = trip.stages?.map(s =>
                    s.id === stageId ? stageData : s
                ) || [];
                await updateDoc(tripDocRef, { stages: updatedStages });
                setIsReadOnly(true);
                onSuccess?.();
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
    const submitButtonLabel = isSubmitting ? 'Salvataggio...' : (isNew ? 'Aggiungi' : 'Salva');

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
        <div className="space-y-8 max-w-4xl pb-12">
            <PageTitle
                subtitle={isNew ? "Inserisci una nuova fermata nel tuo itinerario" : "Visualizza o modifica i dettagli della tappa selezionata."}
            >
                {!isNew && <ContextMenu items={menuItems} />}
            </PageTitle>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* 1. SEZIONE INFORMAZIONI */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Informazioni Base</h3>
                    </div>
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
                </section>

                {/* 2. SEZIONE LUOGO E TEMPO */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Luogo e Data della Tappa</h3>
                    </div>
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
                </section>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-4 rounded-xl text-red-700 dark:text-red-400 text-sm text-center font-medium animate-in fade-in">
                        {error}
                    </div>
                )}

                {!isReadOnly && (
                    <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <Button
                            className="w-full sm:w-auto px-8"
                            variant="secondary"
                            type="button"
                            onClick={handleCancel}
                        >
                            Annulla
                        </Button>
                        <Button className="w-full sm:w-auto px-10 shadow-lg shadow-purple-500/20" type="submit" disabled={isSubmitting}>
                            <div className="flex items-center gap-2">
                                {!isSubmitting && <FaCheck size={12} />}
                                <span>{isSubmitting ? 'Salvataggio...' : (isNew ? 'Aggiungi' : 'Salva')}</span>
                            </div>
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}