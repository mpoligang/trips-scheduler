'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { FaPen, FaUndo } from 'react-icons/fa';
import { format } from 'date-fns';

import { db } from '@/firebase/config';
import { Trip } from '@/models/Trip';
import { Transport, TransportType } from '@/models/Transport';
import { appRoutes } from '@/utils/appRoutes';

import Input from '@/components/inputs/input';
import Button from '@/components/actions/button';
import SingleDatePicker from '@/components/inputs/date-picker';
import Dropdown from '@/components/inputs/dropdown';
import PageTitle from '@/components/generics/page-title';
import ContextMenu from '@/components/actions/context-menu';
import Checkbox from '@/components/inputs/checkbox';
import Textarea from '@/components/inputs/textarea';
import SearchLocation from '@/components/inputs/search-location';
import TimeInput from '@/components/inputs/time-input';

interface TransportFormProps {
    readonly trip: Trip;
    readonly tripId: string;
    readonly transportId?: string;
    readonly isNew: boolean;
}

const transportOptions = [
    { id: 'Aereo', name: 'Aereo' },
    { id: 'Treno', name: 'Treno' },
    { id: 'Autobus', name: 'Autobus' },
    { id: 'Navetta', name: 'Navetta' },
    { id: 'Traghetto', name: 'Traghetto' },
    { id: 'Noleggio Auto', name: 'Noleggio Auto' },
    { id: 'Altro', name: 'Altro' },
];

export default function TransportForm({
    trip,
    tripId,
    transportId,
    isNew,
}: TransportFormProps) {
    const router = useRouter();

    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Campi Form
    const [title, setTitle] = useState('');
    const [type, setType] = useState<{ id: string; name: string } | null>(transportOptions[0]);
    const [referenceCode, setReferenceCode] = useState('');
    const [notes, setNotes] = useState('');

    // Andata
    const [depDate, setDepDate] = useState<Date | undefined>();
    const [depTime, setDepTime] = useState('');
    const [arrDate, setArrDate] = useState<Date | undefined>();
    const [arrTime, setArrTime] = useState('');
    const [depLocation, setDepLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [arrLocation, setArrLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    // Ritorno
    const [isRoundTrip, setIsRoundTrip] = useState(false);
    const [retDepDate, setRetDepDate] = useState<Date | undefined>();
    const [retDepTime, setRetDepTime] = useState('');
    const [retArrDate, setRetArrDate] = useState<Date | undefined>();
    const [retArrTime, setRetArrTime] = useState('');

    const populateForm = useCallback(() => {
        const transport = trip.transports?.find(t => t.id === transportId);
        const initialData = transport ?? null;

        if (initialData) {
            setTitle(initialData.title || '');
            const foundType = transportOptions.find(t => t.id === initialData.type) || transportOptions[6];
            setType(foundType);
            setReferenceCode(initialData.referenceCode || '');
            setNotes(initialData.notes || '');

            // Andata
            const dDate = initialData.departureDate.toDate();
            setDepDate(dDate);
            setDepTime(format(dDate, 'HH:mm'));

            const aDate = initialData.arrivalDate.toDate();
            setArrDate(aDate);
            setArrTime(format(aDate, 'HH:mm'));

            if (initialData.departureLocation) {
                setDepLocation({ lat: 0, lng: 0, address: initialData.departureLocation });
            }
            if (initialData.arrivalLocation) {
                setArrLocation({ lat: 0, lng: 0, address: initialData.arrivalLocation });
            }

            // Ritorno
            setIsRoundTrip(initialData.isRoundTrip);
            if (initialData.isRoundTrip && initialData.returnDepartureDate && initialData.returnArrivalDate) {
                const rdDate = initialData.returnDepartureDate.toDate();
                setRetDepDate(rdDate);
                setRetDepTime(format(rdDate, 'HH:mm'));

                const raDate = initialData.returnArrivalDate.toDate();
                setRetArrDate(raDate);
                setRetArrTime(format(raDate, 'HH:mm'));
            }
        } else {
            // Reset
            setTitle('');
            setType(transportOptions[0]);
            setReferenceCode('');
            setNotes('');
            setDepDate(undefined); setDepTime('');
            setArrDate(undefined); setArrTime('');
            setDepLocation(null); setArrLocation(null);
            setIsRoundTrip(false);
            setRetDepDate(undefined); setRetDepTime('');
            setRetArrDate(undefined); setRetArrTime('');
        }
    }, [trip.transports, transportId]);

    useEffect(() => {
        populateForm();
    }, [populateForm]);

    const combineDateTime = (date: Date | undefined, time: string): Timestamp | null => {
        if (!date || !time) return null;
        const dateTimeString = `${format(date, 'yyyy-MM-dd')}T${time}`;
        const newDate = new Date(dateTimeString);
        return Timestamp.fromDate(newDate);
    };

    const handleCancel = () => {
        if (isNew) router.back();
        else {
            populateForm();
            setIsReadOnly(true);
            setError(null);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!title || !type || !depDate || !depTime || !arrDate || !arrTime) {
            setError("Compila almeno titolo, tipo e date di andata.");
            return;
        }

        if (isRoundTrip && (!retDepDate || !retDepTime || !retArrDate || !retArrTime)) {
            setError("Hai selezionato 'Aggiungi Ritorno', compila tutti i dati del ritorno.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const tripDocRef = doc(db, 'trips', tripId);

        const depTimestamp = combineDateTime(depDate, depTime);
        const arrTimestamp = combineDateTime(arrDate, arrTime);
        const retDepTimestamp = isRoundTrip ? combineDateTime(retDepDate, retDepTime) : null;
        const retArrTimestamp = isRoundTrip ? combineDateTime(retArrDate, retArrTime) : null;

        if (!depTimestamp || !arrTimestamp) {
            setError("Date non valide.");
            setIsSubmitting(false);
            return;
        }

        // CORREZIONE: Usiamo lo spread operator per inserire i campi opzionali
        // SOLO se sono definiti. Questo evita di passare 'undefined' a Firestore.
        const transportData: Transport = {
            id: isNew ? uuidv4() : (transportId as string),
            title,
            type: type.id as TransportType,
            departureDate: depTimestamp,
            arrivalDate: arrTimestamp,
            isRoundTrip,
            referenceCode,
            notes,
            departureLocation: depLocation?.address || '',
            arrivalLocation: arrLocation?.address || '',
            // Inserimento condizionale: se retDepTimestamp esiste, aggiungi la chiave
            ...(retDepTimestamp && { returnDepartureDate: retDepTimestamp }),
            ...(retArrTimestamp && { returnArrivalDate: retArrTimestamp }),
        };

        try {
            if (!isNew && transportId) {
                const updatedTransports = trip.transports?.map(t =>
                    t.id === transportId ? transportData : t
                ) || [];
                await updateDoc(tripDocRef, { transports: updatedTransports });
                setIsReadOnly(true);
            } else {
                await updateDoc(tripDocRef, { transports: arrayUnion(transportData) });
                router.push(appRoutes.tripDetails(tripId));
            }
        } catch (err) {
            console.error("Errore salvataggio trasporto:", err);
            setError("Impossibile salvare.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageTitle
                title={isNew ? 'Aggiungi Trasporto' : (title || 'Dettaglio Trasporto')}
                subtitle="Gestisci i dettagli del tuo spostamento."
            >
                {!isNew && (
                    <ContextMenu items={[
                        {
                            label: isReadOnly ? 'Modifica' : 'Annulla',
                            icon: isReadOnly ? <FaPen /> : <FaUndo />,
                            onClick: () => isReadOnly ? setIsReadOnly(false) : handleCancel()
                        }
                    ]} />
                )}
            </PageTitle>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Sezione Principale */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-4">

                    <Input
                        id="transport-title" label="Titolo"
                        value={title} onChange={(e) => setTitle(e.target.value)}
                        readOnly={isReadOnly} placeholder="es. Volo per Parigi"
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Dropdown
                            label="Tipo di Mezzo"
                            items={transportOptions}
                            selected={type}
                            onSelect={setType}
                            optionValue="id"
                            optionLabel="name"
                            readOnly={isReadOnly}
                            required
                        />
                        <Input
                            id="ref-code" label="Codice Riferimento (Volo, Treno...)"
                            value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)}
                            readOnly={isReadOnly} placeholder="es. AZ1234"
                        />
                    </div>
                </div>

                {/* Sezione Andata */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-4 border-l-4 border-purple-500">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2">Andata</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SearchLocation
                            label="Partenza da" value={depLocation} onSelect={isReadOnly ? () => { } : setDepLocation}
                            readOnly={isReadOnly} placeholder="Stazione, Aeroporto..."
                            required
                        />
                        <SearchLocation
                            label="Arrivo a" value={arrLocation} onSelect={isReadOnly ? () => { } : setArrLocation}
                            readOnly={isReadOnly} placeholder="Stazione, Aeroporto..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Partenza Data/Ora */}
                        <div className="flex gap-2 items-end">
                            <div className="flex-grow">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Partenza</label>
                                <SingleDatePicker selected={depDate} onSelect={setDepDate} readOnly={isReadOnly} />
                            </div>
                            <div className="w-24">
                                <TimeInput label="Ora" value={depTime} onChange={setDepTime} readOnly={isReadOnly} />
                            </div>
                        </div>

                        {/* Arrivo Data/Ora */}
                        <div className="flex gap-2 items-end">
                            <div className="flex-grow">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Arrivo</label>
                                <SingleDatePicker selected={arrDate} onSelect={setArrDate} readOnly={isReadOnly} />
                            </div>
                            <div className="w-24">
                                <TimeInput label="Ora" value={arrTime} onChange={setArrTime} readOnly={isReadOnly} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sezione Ritorno */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-4 border-l-4 border-gray-300 dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                            id="round-trip"
                            checked={isRoundTrip}
                            onChange={(checked) => { if (!isReadOnly) setIsRoundTrip(checked); }}
                        >
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800 dark:text-white">Aggiungi Ritorno</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                                    La partenza e l&apos;arrivo saranno invertiti rispetto all&apos;andata ({arrLocation?.address ? arrLocation.address.split(',')[0] : 'Arrivo'} {'->'} {depLocation?.address ? depLocation.address.split(',')[0] : 'Partenza'}).
                                </span>
                            </div>
                        </Checkbox>
                    </div>

                    {isRoundTrip && (
                        <div className="animate-fade-in space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                {/* Ritorno Partenza (Invertito logicamente) */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-grow">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Partenza (Ritorno)</label>
                                        <SingleDatePicker
                                            selected={retDepDate}
                                            onSelect={setRetDepDate}
                                            readOnly={isReadOnly}
                                            {...(depDate ? { disabledDays: { before: depDate } } : {})}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <TimeInput label="Ora" value={retDepTime} onChange={setRetDepTime} readOnly={isReadOnly} />
                                    </div>
                                </div>

                                {/* Ritorno Arrivo */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-grow">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Arrivo (Ritorno)</label>
                                        <SingleDatePicker
                                            selected={retArrDate}
                                            onSelect={setRetArrDate}
                                            readOnly={isReadOnly}
                                            disabledDays={
                                                (retDepDate || depDate)
                                                    ? { before: (retDepDate || depDate) as Date }
                                                    : undefined
                                            }
                                        />
                                    </div>
                                    <div className="w-24">
                                        <TimeInput label="Ora" value={retArrTime} onChange={setRetArrTime} readOnly={isReadOnly} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Note */}
                <Textarea id="notes" label="Note Aggiuntive" value={notes} onChange={(e) => setNotes(e.target.value)} readOnly={isReadOnly} />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                {!isReadOnly && (
                    <div className="flex justify-end gap-4">
                        <Button className="w-auto" variant="secondary" type="button" onClick={handleCancel}>Annulla</Button>
                        <Button className="w-auto" type="submit" disabled={isSubmitting}>{isNew ? 'Aggiungi' : 'Salva Modifiche'}</Button>
                    </div>
                )}
            </form>
        </div>
    );
}