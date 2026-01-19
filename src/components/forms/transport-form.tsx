'use client';

import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { FaPen, FaUndo, FaPlus, FaTrash, FaCheck, FaMap, FaUserTie, FaCar } from 'react-icons/fa';
import { format } from 'date-fns';

import { db } from '@/firebase/config';
import { Trip } from '@/models/Trip';
import { Transport, TransportGeneric, TransportPrivate, TransportPublic, TransportRental, TransportType } from '@/models/Transport';
import { appRoutes, mapNavigationUrl } from '@/utils/appRoutes';
import { EntityKeys } from '@/utils/entityKeys';

import Input from '../inputs/input';
import Button from '../actions/button';
import Dropdown from '../inputs/dropdown';
import PageTitle from '../generics/page-title';
import ContextMenu, { ContextMenuItem } from '../actions/context-menu';
import Checkbox from '../inputs/checkbox';
import Textarea from '../inputs/textarea';
import SearchLocation from '../inputs/search-location';
import TimeInput from '../inputs/time-input';
import { generateDateOptions, selectDateOption } from '@/utils/dateTripUtils';
import { Location } from '@/models/Location';
import { useTrip } from '@/context/tripContext';
import ActionStickyBar from '../actions/action-sticky-bar';

interface StopoverState {
    id: string;
    location: Location | null;
    date: Date | undefined;
    arrivalTime: string;
    departureTime: string;
}


const transportOptions = [
    { id: TransportType.Flight, name: TransportType.Flight },
    { id: TransportType.Train, name: TransportType.Train },
    { id: TransportType.Bus, name: TransportType.Bus },
    { id: TransportType.Shuttle, name: TransportType.Shuttle },
    { id: TransportType.Ferry, name: TransportType.Ferry },
    { id: TransportType.CarRental, name: TransportType.CarRental },
    { id: TransportType.PrivateTransfer, name: TransportType.PrivateTransfer },
    { id: TransportType.Other, name: TransportType.Other },
];

export default function TransportForm() {
    const router = useRouter();
    const { trip, isOwner, } = useTrip();
    const tripId = trip?.id as string;
    const params = useParams();
    const transportId = params.id as string;
    const isNew = transportId === 'new';

    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [type, setType] = useState<{ id: string; name: string } | null>(transportOptions[0]);
    const [notes, setNotes] = useState('');


    const [carrier, setCarrier] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [seat, setSeat] = useState('');
    const [gateOrPlatform, setGateOrPlatform] = useState('');
    const [bookingReference, setBookingReference] = useState('');

    const [rentalCompany, setRentalCompany] = useState('');
    const [carModel, setCarModel] = useState('');
    const [pickupInstructions, setPickupInstructions] = useState('');
    const [insuranceDetails, setInsuranceDetails] = useState('');
    const [hasDifferentDropOff, setHasDifferentDropOff] = useState(false);
    const [dropOffLocation, setDropOffLocation] = useState<Location | null>(null);
    const [dropOffInstructions, setDropOffInstructions] = useState('');

    const [driverName, setDriverName] = useState('');
    const [driverPhoneNumber, setDriverPhoneNumber] = useState('');
    const [vehicleDescription, setVehicleDescription] = useState('');
    const [depDate, setDepDate] = useState<Date | undefined>();
    const [depTime, setDepTime] = useState('');
    const [depLocation, setDepLocation] = useState<Location | null>(null);
    const [arrDate, setArrDate] = useState<Date | undefined>();
    const [arrTime, setArrTime] = useState('');
    const [arrLocation, setArrLocation] = useState<Location | null>(null);
    const [stopovers, setStopovers] = useState<StopoverState[]>([]);


    const dateOptions = useMemo(() => {
        if (!trip?.startDate || !trip?.endDate) { return []; }
        return generateDateOptions(trip.startDate.toDate(), trip.endDate.toDate());
    }, [trip?.startDate, trip?.endDate]);

    const findDateOption = (date: Date | undefined) => {
        if (!date) { return null; }
        return selectDateOption(date, dateOptions);
    };


    const populateForm = useCallback(() => {
        const transport = trip?.transports?.find(t => t.id === transportId);
        if (transport) {
            setTitle(transport.title || '');
            const currentType = transportOptions.find(t => t.id === transport.type) || transportOptions[0];
            setType(currentType);
            setNotes(transport.notes || '');
            setDepDate(transport.departureDate.toDate());
            setDepTime(format(transport.departureDate.toDate(), 'HH:mm'));
            setDepLocation(transport.departureLocation ?? null);
            setArrDate(transport.arrivalDate.toDate());
            setArrTime(format(transport.arrivalDate.toDate(), 'HH:mm'));
            setArrLocation(transport.arrivalLocation ?? null);
            setStopovers(transport.stopovers?.map((s) => {
                return {
                    id: s.id,
                    location: s.location ?? null,
                    date: s.date?.toDate(),
                    arrivalTime: s.arrivalTime,
                    departureTime: s.departureTime
                };
            }) || []);

            const isPublicTransportType = [TransportType.Flight, TransportType.Train,
            TransportType.Bus, TransportType.Shuttle, TransportType.Ferry].includes(transport.type);

            // Specifici
            if (isPublicTransportType) {
                const t = transport as TransportPublic;
                setCarrier(t.carrier || '');
                setReferenceNumber(t.referenceNumber || '');
                setSeat(t.seat || '');
                setGateOrPlatform(t.gateOrPlatform || '');
                setBookingReference(t.bookingReference || '');
            } else if (transport.type === TransportType.CarRental) {
                const t = transport as TransportRental;
                setRentalCompany(t.rentalCompany || '');
                setCarModel(t.carModel || '');
                setPickupInstructions(t.pickupInstructions || '');
                setInsuranceDetails(t.insuranceDetails || '');
                setHasDifferentDropOff(t.hasDifferentDropOff || false);
                setDropOffLocation(t.dropOffLocation ?? null);
                setDropOffInstructions(t.dropOffInstructions || '');
            } else if (transport.type === TransportType.PrivateTransfer) {
                const t = transport as TransportPrivate;
                setDriverName(t.driverName || '');
                setDriverPhoneNumber(t.driverPhoneNumber || '');
                setVehicleDescription(t.vehicleDescription || '');
            } else {
                const t = transport as TransportGeneric;
                setReferenceNumber(t.referenceCode || '');
            }

        } else {
            // Reset
            setTitle('');
            setType(transportOptions[0]);
            setNotes('');
            setDepDate(undefined);
            setDepTime('');
            setDepLocation(null);
            setArrDate(undefined);
            setArrTime('');
            setArrLocation(null);
            setStopovers([]);
            setCarrier('');
            setReferenceNumber('');
            setSeat('');
            setGateOrPlatform('');
            setBookingReference('');
            setRentalCompany('');
            setCarModel('');
            setPickupInstructions('');
            setInsuranceDetails('');
            setHasDifferentDropOff(false);
            setDropOffLocation(null);
            setDropOffInstructions('');
            setDriverName('');
            setDriverPhoneNumber('');
            setVehicleDescription('');
        }
    }, [trip?.transports, transportId]);

    useEffect(() => { populateForm(); }, [populateForm]);


    // --- HELPERS E HANDLERS ---
    const combineDateTime = (date: Date | undefined, time: string): Timestamp | null => {
        if (!date || !time) return null;
        const [hours, minutes] = time.split(':');
        const newDate = new Date(date);
        newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return Timestamp.fromDate(newDate);
    };

    const handleAddStopover = () => {
        setStopovers([...stopovers, { id: uuidv4(), location: null, date: depDate, arrivalTime: '', departureTime: '' }]);
    };
    const handleRemoveStopover = (id: string) => setStopovers(stopovers.filter(s => s.id !== id));
    const updateStopover = (id: string, fields: Partial<StopoverState>) => {
        setStopovers(stopovers.map(s => s.id === id ? { ...s, ...fields } : s));
    };

    const handleCancel = () => {
        if (isNew) router.back();
        else { populateForm(); setIsReadOnly(true); setError(null); }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        // Validazione
        if (!title || !type || !depDate || !depTime || !arrDate || !arrTime || !depLocation
            || (!arrLocation && type.id !== TransportType.CarRental)) {
            setError("Compila tutti i campi base obbligatori.");
            return;
        }

        setIsSubmitting(true);

        const depTimestamp = combineDateTime(depDate, depTime);
        const arrTimestamp = combineDateTime(arrDate, arrTime);

        if (!depTimestamp || !arrTimestamp) {
            setError("Errore nelle date.");
            setIsSubmitting(false);
            return;
        }

        // Base Data
        const baseData = {
            id: isNew ? uuidv4() : (transportId as string),
            title,
            type: type.id,
            departureDate: depTimestamp,
            arrivalDate: arrTimestamp,
            departureLocation: depLocation,
            arrivalLocation: arrLocation || depLocation,
            stopovers: stopovers.map(s => ({
                id: s.id,
                location: s.location,
                date: combineDateTime(s.date, s.arrivalTime)!,
                arrivalTime: s.arrivalTime,
                departureTime: s.departureTime
            })),
            notes,
        };

        let transportData: Transport;
        const isPublicTransportType = [TransportType.Flight, TransportType.Train,
        TransportType.Bus, TransportType.Shuttle, TransportType.Ferry].includes(baseData.type as TransportType);

        // Costruzione Payload in base al tipo
        if (isPublicTransportType) {
            transportData = {
                ...baseData,
                carrier,
                referenceNumber,
                seat,
                gateOrPlatform,
                bookingReference
            } as TransportPublic;
        } else if (baseData.type === TransportType.CarRental) {
            transportData = {
                ...baseData,
                rentalCompany,
                carModel,
                pickupInstructions,
                insuranceDetails,
                hasDifferentDropOff,
                dropOffLocation: hasDifferentDropOff ? dropOffLocation : undefined,
                dropOffInstructions: hasDifferentDropOff ? dropOffInstructions : undefined
            } as TransportRental;
        } else if (baseData.type === TransportType.PrivateTransfer) {
            transportData = {
                ...baseData,
                driverName,
                driverPhoneNumber,
                vehicleDescription,
            } as TransportPrivate;
        } else {
            transportData = {
                ...baseData,
                referenceCode: referenceNumber
            } as TransportGeneric;
        }

        try {
            const tripDocRef = doc(db, EntityKeys.tripsKey, tripId);
            if (!isNew) {
                const updatedTransports = trip?.transports?.map(t => t.id === transportId ? transportData : t) || [];
                await updateDoc(tripDocRef, { transports: updatedTransports });
                setIsReadOnly(true);
            } else {
                await updateDoc(tripDocRef, { transports: arrayUnion(transportData) });
                router.push(appRoutes.tripDetails(tripId));
            }
        } catch (err) {
            console.error(err);
            setError("Impossibile salvare i dati.");
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- RENDER COMPONENTI SPECIFICI ---
    const renderSpecificFields = () => {
        if (!type) return null;
        const currentType = type.id;

        const isPublicTransportType = [TransportType.Flight, TransportType.Train, TransportType.Bus,
        TransportType.Shuttle, TransportType.Ferry].includes(currentType as TransportType);

        // 1. Pubblico
        if (isPublicTransportType) {
            return (
                <section className=" ">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            Dettagli Biglietto
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Input
                            id="company"
                            label="Compagnia"
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                            readOnly={isReadOnly}
                            placeholder="Es. Ryanair"
                        />
                        <Input
                            id="referenceNumber"
                            label="Numero Volo/Mezzo "
                            value={referenceNumber}
                            onChange={(e) => setReferenceNumber(e.target.value)}
                            readOnly={isReadOnly}
                            placeholder="Es. FR123"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Input
                            id="bookingReference"
                            label="Riferimento Prenotazione"
                            value={bookingReference}
                            onChange={(e) => setBookingReference(e.target.value)}
                            readOnly={isReadOnly}
                        />
                        <Input
                            id="seat"
                            label="Posto"
                            value={seat}
                            onChange={(e) => setSeat(e.target.value)}
                            readOnly={isReadOnly}
                        />
                        <Input
                            id="gateOrPlatform"
                            label={currentType === TransportType.Flight ? 'Gate' : 'Binario'}
                            value={gateOrPlatform}
                            onChange={(e) => setGateOrPlatform(e.target.value)}
                            readOnly={isReadOnly}
                        />
                    </div>
                </section>
            );
        }

        // 2. Noleggio Auto
        if (currentType === TransportType.CarRental) {
            return (
                <section className=" p-6 rounded-xl  border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><FaCar /> Dettagli Noleggio</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Input
                            id="rentalCompany"
                            label="Compagnia"
                            value={rentalCompany}
                            onChange={(e) => setRentalCompany(e.target.value)}
                            readOnly={isReadOnly}
                            required
                        />
                        <Input
                            id="carModel"
                            label="Modello Auto"
                            value={carModel}
                            onChange={(e) => setCarModel(e.target.value)}
                            readOnly={isReadOnly}
                        />
                    </div>
                    <div className="mb-6">
                        <Textarea
                            id="pickupInstructions"
                            label="Istruzioni Ritiro/Consegna"
                            value={pickupInstructions}
                            onChange={(e) => setPickupInstructions(e.target.value)}
                            readOnly={isReadOnly}
                        />
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                        <Checkbox
                            id="diff-drop"
                            checked={hasDifferentDropOff}
                            onChange={(c: boolean) => !isReadOnly && setHasDifferentDropOff(c)}
                        >
                            <span className="font-medium">Riconsegna in luogo diverso</span>
                        </Checkbox>
                        {hasDifferentDropOff && (
                            <div className="flex flex-col gap-6 mt-4 animate-in fade-in">
                                <SearchLocation
                                    label="Luogo Riconsegna"
                                    value={dropOffLocation}
                                    onSelect={setDropOffLocation}
                                    readOnly={isReadOnly}
                                />
                                <Textarea
                                    id="dropOffInstructions"
                                    label="Istruzioni Riconsegna"
                                    value={dropOffInstructions}
                                    onChange={(e) => setDropOffInstructions(e.target.value)}
                                    readOnly={isReadOnly}
                                />
                            </div>
                        )}
                    </div>
                </section>
            );
        }

        // 3. NCC
        if (currentType === TransportType.PrivateTransfer) {
            return (
                <section className=" p-6 rounded-xl  border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><FaUserTie /> Contatti Autista</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Input
                            id="driverName"
                            label="Nome Autista"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            readOnly={isReadOnly}
                        />
                        <Input
                            id="driverPhoneNumber"
                            label="Telefono Autista"
                            value={driverPhoneNumber}
                            onChange={(e) => setDriverPhoneNumber(e.target.value)}
                            readOnly={isReadOnly}
                            required
                            placeholder="+39..."
                        />
                    </div>
                    <div className="w-full">
                        <Input
                            id="vehicleDescription"
                            label="Veicolo"
                            value={vehicleDescription}
                            onChange={(e) => setVehicleDescription(e.target.value)}
                            readOnly={isReadOnly}
                            placeholder="Modello/Targa"
                        />

                    </div>
                </section>
            );
        }

        return null;
    };

    // --- MENU CONTEXT ---
    const menuItems: ContextMenuItem[] = [
        {
            label: 'Indicazioni Partenza',
            icon: <FaMap />,
            onClick: () => { if (depLocation?.address) window.open(mapNavigationUrl(depLocation.address), '_blank'); }
        }
    ];

    if (isOwner) {
        menuItems.unshift({
            label: isReadOnly ? 'Modifica' : 'Annulla',
            icon: isReadOnly ? <FaPen /> : <FaUndo />,
            onClick: () => { if (isReadOnly) setIsReadOnly(false); else handleCancel(); }
        });
    }

    // Label dinamiche per noleggio vs viaggio
    const isRental = type?.id === TransportType.CarRental;
    const departureLabel = isRental ? 'Luogo Ritiro' : 'Partenza da';
    const arrivalLabel = isRental ? 'Luogo Consegna (Standard)' : 'Arrivo a';
    const dateDepLabel = isRental ? 'Data Ritiro' : 'Data Partenza';
    const dateArrLabel = isRental ? 'Data Consegna' : 'Data Arrivo';
    const hourDepLabel = isRental ? 'Ora di Ritiro' : 'Ora di Partenza';
    const hourArrLabel = isRental ? 'Ora di Consegna' : 'Ora di Arrivo';

    return (
        <div className="space-y-6 pb-24">
            <PageTitle
                title={isNew ? "Nuovo Trasporto" : isReadOnly ? "Dettagli Trasporto" : "Modifica Trasporto"}
                subtitle={isNew ? "Inserisci i dettagli del trasporto." : "Visualizza o aggiorna i dettagli del trasporto."}
            >
                {!isNew && <ContextMenu items={menuItems} />}
            </PageTitle>

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Generale</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <Input
                            id="title"
                            label="Titolo"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            readOnly={isReadOnly}
                            required />
                        <Dropdown
                            label="Tipo"
                            items={transportOptions}
                            selected={type}
                            onSelect={setType}
                            optionValue="id"
                            optionLabel="name"
                            required
                            readOnly={isReadOnly}
                        />
                    </div>
                </section>

                {/* 2. CAMPI SPECIFICI PER TIPO */}
                {renderSpecificFields()}

                {/* 3. LOGISTICA (Date e Luoghi) */}
                <section className=" ">
                    <div className="flex items-center gap-3 mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{isRental ? 'Periodo Noleggio' : 'Itinerario'}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <SearchLocation
                            label={`${departureLabel}`}
                            value={depLocation} onSelect={setDepLocation}
                            readOnly={isReadOnly}
                            required />
                        {(!isRental || !hasDifferentDropOff) && (
                            <SearchLocation
                                label={`${arrivalLabel}`}
                                value={arrLocation}
                                onSelect={setArrLocation}
                                readOnly={isReadOnly}
                                required />
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Partenza / Ritiro */}
                        <div className="flex md:flex-row flex-col gap-2 items-end">
                            <div className="flex-grow w-full">
                                <Dropdown
                                    label={`${dateDepLabel}`}
                                    items={dateOptions}
                                    selected={findDateOption(depDate)}
                                    onSelect={(val) => setDepDate(val?.date)}
                                    readOnly={isReadOnly}
                                    required
                                    optionValue="id"
                                    optionLabel="name"
                                />
                            </div>
                            <div className="md:w-50 w-full">
                                <TimeInput
                                    label={hourDepLabel}
                                    value={depTime}
                                    onChange={setDepTime}
                                    readOnly={isReadOnly} />
                            </div>
                        </div>
                        {/* Arrivo / Consegna */}
                        <div className="flex md:flex-row flex-col gap-2 items-end">
                            <div className="flex-grow w-full">
                                <Dropdown
                                    label={`${dateArrLabel}`}
                                    items={dateOptions}
                                    selected={findDateOption(arrDate)}
                                    onSelect={(val) => setArrDate(val?.date)}
                                    readOnly={isReadOnly}
                                    required
                                    optionValue="id"
                                    optionLabel="name"
                                />
                            </div>
                            <div className="md:w-50 w-full">
                                <TimeInput
                                    label={hourArrLabel}
                                    value={arrTime}
                                    onChange={setArrTime}
                                    readOnly={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. SCALI (Solo se non è Noleggio o NCC) */}
                {!isRental && type?.id !== TransportType.PrivateTransfer && (
                    <section className="  rounded-xl s">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Scali</h3>
                            {!isReadOnly && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleAddStopover}>
                                    <FaPlus /> <span className="ml-2">Aggiungi</span>
                                </Button>
                            )}
                        </div>

                        {stopovers.length > 0 ? stopovers.map((scalo, i) => {
                            // LOGICA PER IL CAMPO "PARTENZA"
                            // Se è il primo scalo, prende la partenza del viaggio principale (departure).
                            // Altrimenti, prende la destinazione dello scalo precedente.
                            const previousLocation = i === 0 ? depLocation : stopovers[i - 1].location;


                            // LOGICA CHECKBOX "ULTIMO SCALO"
                            // Confrontiamo gli indirizzi per capire se è selezionato
                            const isLastStop = scalo.location?.address === arrLocation?.address;

                            return (
                                <div key={scalo.id} className="sm:p-4 mb-4 rounded-xl  relative">
                                    <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                                        <h4>Scalo {i + 1}</h4>
                                        {!isReadOnly &&
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleRemoveStopover(scalo.id)}
                                            >
                                                <FaTrash />
                                                <span className="ml-2">Rimuovi</span>
                                            </Button>
                                        }
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* CAMPO PARTENZA (READONLY) */}
                                        <div className="md:col-span-2">

                                            <SearchLocation
                                                label="Partenza"
                                                value={previousLocation}
                                                onSelect={() => { }} // Non modificabile
                                                readOnly={true}
                                            />

                                        </div>

                                        {/* GRUPPO DESTINAZIONE + CHECKBOX */}
                                        <div className="md:col-span-2">

                                            <SearchLocation
                                                label="Destinazione"
                                                value={scalo.location}
                                                onSelect={(l) => updateStopover(scalo.id, { location: l })}
                                                // Se è "Ultimo scalo", rendiamo il campo readonly per evitare modifiche accidentali che romperebbero la logica
                                                readOnly={isReadOnly || isLastStop}
                                            />
                                        </div>

                                        <Dropdown
                                            label="Data"
                                            items={dateOptions}
                                            selected={findDateOption(scalo.date)}
                                            onSelect={(v) => updateStopover(scalo.id, { date: v?.date })}
                                            readOnly={isReadOnly}
                                            optionValue={'id'}
                                            optionLabel={'name'}
                                        />

                                        <div className="sm:grid sm:grid-cols-2 flex flex-col gap-2">
                                            <TimeInput
                                                label="Partenza"
                                                value={scalo.departureTime}
                                                onChange={(v) => updateStopover(scalo.id, { departureTime: v })}
                                                readOnly={isReadOnly}
                                            />
                                            <TimeInput
                                                label="Arrivo"
                                                value={scalo.arrivalTime}
                                                onChange={(v) => updateStopover(scalo.id, { arrivalTime: v })}
                                                readOnly={isReadOnly}
                                            />

                                        </div>

                                    </div>
                                    <div className="flex justify-end mt-6">
                                        {/* CHECKBOX PERSONALIZZATA */}
                                        {!isReadOnly && arrLocation && (
                                            <Checkbox
                                                id={`last-stop-check-${scalo.id}`}
                                                checked={isLastStop}
                                                onChange={(checked) => {
                                                    if (checked) {
                                                        // Copia l'oggetto Location (lat, lng, address) dalla destinazione finale
                                                        updateStopover(scalo.id, { location: arrLocation });
                                                    } else {
                                                        // Resetta il campo permettendo una nuova selezione
                                                        updateStopover(scalo.id, { location: null });
                                                    }
                                                }}
                                            >
                                                Ultimo scalo
                                            </Checkbox>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : <p className="text-sm text-gray-400 italic">Nessuno scalo.</p>}
                    </section>
                )}



                {error && (
                    <div className="bg-red-50 p-3 rounded text-red-600 text-center border border-red-200">{error}</div>
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