'use client';

import { useState, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { FaPen, FaUndo, FaCheck, FaMap, FaCar, FaUserTie, FaPlus, FaTrash } from 'react-icons/fa';
import { format } from 'date-fns';

import { db } from '@/firebase/config';
import { Trip } from '@/models/Trip';
import {
    Transport,
    TransportType,
    TransportPublic,
    TransportRental,
    TransportPrivate,
    TransportStopover,
    TransportGeneric
} from '@/models/Transport';
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

interface TransportFormProps {
    readonly trip: Trip;
    readonly tripId: string;
    readonly transportId?: string;
    readonly isNew: boolean;
    readonly isOwner: boolean;
    readonly onSuccess?: () => Promise<void>;
}

// Opzioni per il dropdown basate sull'Enum TransportType
const transportOptions = [
    { id: TransportType.Flight, name: 'Aereo' },
    { id: TransportType.Train, name: 'Treno' },
    { id: TransportType.Bus, name: 'Autobus' },
    { id: TransportType.Shuttle, name: 'Navetta' },
    { id: TransportType.Ferry, name: 'Traghetto' },
    { id: TransportType.CarRental, name: 'Noleggio Auto' },
    { id: TransportType.PrivateTransfer, name: 'Noleggio con conducente' },
    { id: TransportType.Other, name: 'Altro' },
];

export default function TransportForm({
    trip,
    tripId,
    transportId,
    isNew,
    isOwner,
    onSuccess
}: Readonly<TransportFormProps>) {
    const router = useRouter();

    // --- STATI UI ---
    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- CAMPI COMUNI (BaseTransport) ---
    const [title, setTitle] = useState('');
    const [type, setType] = useState<{ id: string; name: string } | null>(transportOptions[0]);
    const [notes, setNotes] = useState('');

    // --- CAMPI SPECIFICI ---
    // Public (Aereo, Treno, etc.)
    const [carrier, setCarrier] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [seat, setSeat] = useState('');
    const [gateOrPlatform, setGateOrPlatform] = useState('');
    const [bookingReference, setBookingReference] = useState('');

    // Rental (Noleggio Auto)
    const [rentalCompany, setRentalCompany] = useState('');
    const [carModel, setCarModel] = useState('');
    const [pickupInstructions, setPickupInstructions] = useState('');
    const [insuranceDetails, setInsuranceDetails] = useState('');
    const [hasDifferentDropOff, setHasDifferentDropOff] = useState(false);
    const [dropOffLocation, setDropOffLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [dropOffInstructions, setDropOffInstructions] = useState('');

    // Private (NCC)
    const [driverName, setDriverName] = useState('');
    const [driverPhoneNumber, setDriverPhoneNumber] = useState('');
    const [vehicleDescription, setVehicleDescription] = useState('');
    const [meetingPoint, setMeetingPoint] = useState('');

    // --- LOGISTICA (Partenza/Arrivo) ---
    const [depDate, setDepDate] = useState<Date | undefined>();
    const [depTime, setDepTime] = useState('');
    const [depLocation, setDepLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    const [arrDate, setArrDate] = useState<Date | undefined>();
    const [arrTime, setArrTime] = useState('');
    const [arrLocation, setArrLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    // --- SCALI ---
    // Usiamo uno stato locale per gestire l'UI degli scali prima del salvataggio
    interface StopoverState {
        id: string;
        location: { lat: number; lng: number; address: string } | null;
        date: Date | undefined;
        arrivalTime: string;
        departureTime: string;
    }
    const [stopovers, setStopovers] = useState<StopoverState[]>([]);


    // --- GESTIONE DATE DROPDOWN ---
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
            dates.push({
                id: dateObj.toISOString().split('T')[0],
                name: dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
                date: dateObj
            });
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, [trip?.startDate, trip?.endDate]);

    const findDateOption = (date: Date | undefined) => {
        if (!date) return null;
        const iso = date.toISOString().split('T')[0];
        return dateOptions.find(opt => opt.id === iso) || null;
    };


    // --- POPOLAMENTO FORM ---
    const populateForm = useCallback(() => {
        const transport = trip.transports?.find(t => t.id === transportId);
        if (transport) {
            // Base
            setTitle(transport.title || '');
            const currentType = transportOptions.find(t => t.id === transport.type) || transportOptions[0];
            setType(currentType);
            setNotes(transport.notes || '');

            // Logistica
            setDepDate(transport.departureDate.toDate());
            setDepTime(format(transport.departureDate.toDate(), 'HH:mm'));
            setDepLocation(transport.departureLocation ? { lat: 0, lng: 0, address: transport.departureLocation } : null);

            setArrDate(transport.arrivalDate.toDate());
            setArrTime(format(transport.arrivalDate.toDate(), 'HH:mm'));
            setArrLocation(transport.arrivalLocation ? { lat: 0, lng: 0, address: transport.arrivalLocation } : null);

            // Scali
            setStopovers(transport.stopovers?.map((s) => ({
                id: s.id,
                location: { lat: 0, lng: 0, address: s.location },
                date: s.date?.toDate(),
                arrivalTime: s.arrivalTime,
                departureTime: s.departureTime
            })) || []);

            const isPublicTransportType = [TransportType.Flight, TransportType.Train, TransportType.Bus, TransportType.Ferry]
                .includes(transport.type);

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
                setDropOffLocation(t.dropOffLocation ? { lat: 0, lng: 0, address: t.dropOffLocation } : null);
                setDropOffInstructions(t.dropOffInstructions || '');
            } else if (transport.type === TransportType.PrivateTransfer) {
                const t = transport as TransportPrivate;
                setDriverName(t.driverName || '');
                setDriverPhoneNumber(t.driverPhoneNumber || '');
                setVehicleDescription(t.vehicleDescription || '');
                setMeetingPoint(t.meetingPoint || '');
            } else {
                const t = transport as TransportGeneric;
                setReferenceNumber(t.referenceCode || '');
            }

        } else {
            // Reset
            setTitle(''); setType(transportOptions[0]); setNotes('');
            setDepDate(undefined); setDepTime(''); setDepLocation(null);
            setArrDate(undefined); setArrTime(''); setArrLocation(null);
            setStopovers([]);
            setCarrier(''); setReferenceNumber(''); setSeat(''); setGateOrPlatform(''); setBookingReference('');
            setRentalCompany(''); setCarModel(''); setPickupInstructions(''); setInsuranceDetails('');
            setHasDifferentDropOff(false); setDropOffLocation(null); setDropOffInstructions('');
            setDriverName(''); setDriverPhoneNumber(''); setVehicleDescription(''); setMeetingPoint('');
        }
    }, [trip.transports, transportId]);

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
            departureLocation: depLocation.address,
            arrivalLocation: arrLocation?.address || depLocation.address, // Fallback per rental se stesso luogo
            stopovers: stopovers.map(s => ({
                id: s.id,
                location: s.location?.address || '',
                date: combineDateTime(s.date, s.arrivalTime)!,
                arrivalTime: s.arrivalTime,
                departureTime: s.departureTime
            })),
            notes,
        };

        let transportData: Transport;
        const isPublicTransportType = [TransportType.Flight, TransportType.Train, TransportType.Bus, TransportType.Shuttle, TransportType.Ferry].includes(baseData.type as TransportType);
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
                dropOffLocation: hasDifferentDropOff ? dropOffLocation?.address : undefined,
                dropOffInstructions: hasDifferentDropOff ? dropOffInstructions : undefined
            } as TransportRental;
        } else if (baseData.type === TransportType.PrivateTransfer) {
            transportData = {
                ...baseData,
                driverName,
                driverPhoneNumber,
                vehicleDescription,
                meetingPoint
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
                const updatedTransports = trip.transports?.map(t => t.id === transportId ? transportData : t) || [];
                await updateDoc(tripDocRef, { transports: updatedTransports });
                setIsReadOnly(true);
                onSuccess?.();
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
        const currentType = type.id as TransportType;

        const isPublicTransportType = [TransportType.Flight, TransportType.Train, TransportType.Bus,
        TransportType.Shuttle, TransportType.Ferry].includes(currentType);

        // 1. Pubblico
        if (isPublicTransportType) {
            return (
                <section className="bg-white dark:bg-gray-800 p-6 rounded-xl  border border-gray-100 dark:border-gray-700">
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
                            label={currentType === 'Aereo' ? 'Gate' : 'Binario'}
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
                <section className="bg-white dark:bg-gray-800 p-6 rounded-xl  border border-gray-100 dark:border-gray-700">
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
                <section className="bg-white dark:bg-gray-800 p-6 rounded-xl  border border-gray-100 dark:border-gray-700">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            id="vehicleDescription"
                            label="Veicolo"
                            value={vehicleDescription}
                            onChange={(e) => setVehicleDescription(e.target.value)}
                            readOnly={isReadOnly}
                            placeholder="Modello/Targa"
                        />
                        <Input
                            id="meetingPoint"
                            label="Punto d'incontro"
                            value={meetingPoint}
                            onChange={(e) => setMeetingPoint(e.target.value)}
                            readOnly={isReadOnly}
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
    const departureLabel = isRental ? 'Luogo di Ritiro' : 'Partenza da';
    const arrivalLabel = isRental ? 'Luogo di Riconsegna (Standard)' : 'Arrivo a';
    const dateDepLabel = isRental ? 'Data di Ritiro' : 'Data di Partenza';
    const dateArrLabel = isRental ? 'Data di Consegna' : 'Data di Arrivo';
    const hourDepLabel = isRental ? 'Ora di Ritiro' : 'Ora di Partenza';
    const hourArrLabel = isRental ? 'Ora di Consegna' : 'Ora di Arrivo';

    return (
        <div className="space-y-6 max-w-4xl pb-12">
            <PageTitle
                subtitle={isNew ? "Inserisci i dettagli del trasporto." : "Visualizza o aggiorna i dettagli del trasporto."}
            >
                {!isNew && <ContextMenu items={menuItems} />}
            </PageTitle>

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="bg-white dark:bg-gray-800 sm:p-6 rounded-xl  sm:border border-gray-100 dark:border-gray-700">
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

                {/* 2. SPECIFICI (Renderizzati in base al tipo) */}
                {renderSpecificFields()}

                {/* 3. LOGISTICA (Date e Luoghi) */}
                <section className="bg-white dark:bg-gray-800 sm:p-6 rounded-xl  sm:border border-gray-100 dark:border-gray-700">
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
                {!isRental && type?.id !== 'Noleggio con conducente' && (
                    <section className="bg-white dark:bg-gray-800 sm:p-6 rounded-xl  sm:border border-gray-100 dark:border-gray-700">
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
                        {stopovers.length > 0 ? stopovers.map((scalo, i) => (
                            <div key={scalo.id} className="sm:p-4 mb-4  rounded-xl sm:border border-gray-100 dark:border-gray-700 relative">
                                {!isReadOnly &&
                                    <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                                        <h4>Scalo {i + 1}</h4>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleRemoveStopover(scalo.id)}
                                        >
                                            <FaTrash />
                                            <span className="ml-2">Rimuovi</span>
                                        </Button>
                                    </div>
                                }
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <SearchLocation
                                            label={`Destinazione`}
                                            value={scalo.location}
                                            onSelect={(l) => updateStopover(scalo.id, { location: l })}
                                            readOnly={isReadOnly} /></div>
                                    <Dropdown
                                        label="Data"
                                        items={dateOptions}
                                        selected={findDateOption(scalo.date)}
                                        onSelect={(v) => updateStopover(scalo.id, { date: v?.date })}
                                        readOnly={isReadOnly}
                                        optionValue={'id'}
                                        optionLabel={'id'}
                                    />
                                    <div className="sm:grid sm:grid-cols-2 flex flex-col gap-2">
                                        <TimeInput
                                            label="Arrivo"
                                            value={scalo.arrivalTime}
                                            onChange={(v) => updateStopover(scalo.id, { arrivalTime: v })}
                                            readOnly={isReadOnly}
                                        />
                                        <TimeInput
                                            label="Partenza"
                                            value={scalo.departureTime}
                                            onChange={(v) => updateStopover(scalo.id, { departureTime: v })}
                                            readOnly={isReadOnly}
                                        />
                                    </div>
                                </div>
                            </div>
                        )) : <p className="text-sm text-gray-400 italic">Nessuno scalo.</p>}
                    </section>
                )}

                {/* 5. NOTE */}
                <section className="bg-white dark:bg-gray-800 p-6 rounded-xl  border border-gray-100 dark:border-gray-700">
                    <Textarea
                        id="notes"
                        label="Note Aggiuntive"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        readOnly={isReadOnly}
                    />
                </section>

                {error && (
                    <div className="bg-red-50 p-3 rounded text-red-600 text-center border border-red-200">{error}</div>
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