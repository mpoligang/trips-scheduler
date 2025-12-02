'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { FaPen, FaMap, FaUndo } from 'react-icons/fa';
import { v4 as uuidv4 } from 'uuid';

import { db } from '@/firebase/config';
import { Trip } from '@/models/Trip';
import { Stage, Attachment } from '@/models/Stage';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import Dropdown from '../inputs/dropdown';
import Input from '../inputs/input';
import PageTitle from '../generics/page-title';
import ContextMenu from '../actions/context-menu';
import SearchLocation from '../inputs/search-location';
import SingleDatePicker from '../inputs/date-picker';
import AttachmentsManager from '../cards/attachment-manager';
import Button from '../actions/button';



interface StageFormProps {
    readonly trip: Trip;
    readonly tripId: string;
    readonly stageId?: string;
    readonly isNew: boolean;
}

const formatDateForLabel = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
};

export default function StageForm({
    trip,
    tripId,
    stageId,
    isNew,
}: StageFormProps) {
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

    const populateForm = useCallback(() => {
        const stage = trip.stages?.find(s => s.id === stageId);
        const initialData = stage ?? null;
        if (initialData) {
            setStageName(initialData.name);
            setStageDate(new Date(initialData.date));
            setStageLocation(initialData.location);
            setAttachments(initialData.attachments || []);
            if (initialData.destination) {
                setStageDestination({ id: initialData.destination, name: initialData.destination });
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
            setError("Tutti i campi obbligatori sono richiesti.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const tripDocRef = doc(db, 'trips', tripId);

        const stageData: Stage = {
            id: isNew ? uuidv4() : (stageId as string),
            name: stageName,
            date: stageDate.toISOString().split('T')[0],
            location: stageLocation,
            destination: stageDestination.name,
            attachments: attachments,
        };

        try {
            if (!isNew && stageData) {
                const updatedStages = trip.stages?.map(s =>
                    s.id === stageId ? stageData : s
                ) || [];

                await updateDoc(tripDocRef, { stages: updatedStages });
                setIsReadOnly(true);
            } else {
                await updateDoc(tripDocRef, { stages: arrayUnion(stageData) });
                router.push(appRoutes.tripDetails(tripId));
            }
        } catch (err) {
            console.error("Errore salvataggio:", err);
            setError("Impossibile salvare. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const datePickerPlaceholder = isReadOnly
        ? `Data della tappa`
        : `Seleziona una data da ${formatDateForLabel((trip?.startDate)?.toDate())} a ${formatDateForLabel((trip?.endDate)?.toDate())}`;

    const destinationOptions = trip?.destinations?.map(d => ({ id: d, name: d })) || [];
    const submitButtonLabel = isSubmitting ? 'Salvataggio...' : (isNew ? 'Aggiungi' : 'Salva Modifiche');

    return (
        <div className="space-y-6">
            <PageTitle
                title={isNew ? 'Aggiungi Tappa' : (stageName || 'Dettaglio Tappa')}
                subtitle={isNew ? "Aggiungi una nuova tappa al tuo viaggio." : "Dettagli della tappa."}
            >
                {!isNew && (
                    <ContextMenu items={[
                        {
                            label: isReadOnly ? 'Modifica' : 'Annulla',
                            icon: isReadOnly ? <FaPen /> : <FaUndo />,
                            onClick: () => {
                                if (isReadOnly) setIsReadOnly(false);
                                else handleCancel();
                            }
                        },
                        {
                            label: 'Indicazioni',
                            icon: <FaMap />,
                            onClick: () => { if (stageLocation?.address) window.open(mapNavigationUrl(stageLocation.address), '_blank'); }
                        }
                    ]} />
                )}
            </PageTitle>

            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <Input
                    placeholder='es. Visita al Colosseo'
                    id="stage-name"
                    label="Nome della Tappa"
                    type="text"
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
                    placeholder="Seleziona una destinazione"
                    readOnly={isReadOnly}
                />

                <SearchLocation
                    label="Indirizzo della Tappa"
                    value={stageLocation}
                    readOnly={isReadOnly}
                    onSelect={isReadOnly ? () => { } : setStageLocation}
                    placeholder="Digita per cercare..."
                />

                <SingleDatePicker
                    label={datePickerPlaceholder}
                    selected={stageDate}
                    onSelect={setStageDate}
                    disabledDays={trip ? {
                        before: (trip.startDate).toDate(),
                        after: (trip.endDate).toDate()
                    } : { before: new Date() }}
                    readOnly={isReadOnly}
                />

                <AttachmentsManager
                    tripId={tripId}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    readOnly={isReadOnly}
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                {/* REINSERITI I BOTTONI SALVA/ANNULLA */}
                {!isReadOnly && (
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <Button
                            className="w-auto"
                            variant="secondary"
                            type="button"
                            onClick={handleCancel}
                        >
                            Annulla
                        </Button>
                        <Button className="w-auto" type="submit" disabled={isSubmitting}>
                            {submitButtonLabel}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}