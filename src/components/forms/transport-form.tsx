import { useTrip } from "@/context/tripContext";
import { useParams, useRouter } from "next/navigation"; // Usa next/navigation per App Router
import PageTitle from "../generics/page-title";
import { useCallback, useEffect, useMemo, useState } from "react";
import ContextMenu, { ContextMenuItem } from "../actions/context-menu";
import { FaMap, FaPen, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import FormSection from "../generics/form-section";
import Input from "../inputs/input";
import Dropdown from "../inputs/dropdown";
import { Stopover, StopoverInstance, Transport, TransportType } from "@/models/Transport";
import SearchLocation from "../inputs/search-location";
import { Location } from "@/models/Location";
import { generateDateOptions, selectDateOption } from "@/utils/dateTripUtils";
import TimeInput from "../inputs/time-input";
import Checkbox from "../inputs/checkbox";
import Button from "../actions/button";
import Textarea from "../inputs/textarea";
import { mapNavigationUrl } from "@/utils/appRoutes";
import ActionStickyBar from "../actions/action-sticky-bar";
import { doc, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { EntityKeys } from "@/utils/entityKeys";
import DurationInput from "../inputs/duration-input";
import RichTextInput from '../inputs/rich-text-editor';

// Helper per generare ID univoci (se non usi una libreria esterna come uuid)
const generateUUID = () => crypto.randomUUID();

export default function TransportForm() {

    const { trip, isOwner } = useTrip();
    const params = useParams();
    const router = useRouter();
    // Gestione sicura del parametro id che potrebbe essere array o undefined
    const transportId = Array.isArray(params.id) ? params.id[0] : params.id;
    const isNew = transportId === 'new';

    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // --- State Form ---
    const [title, setTitle] = useState<string>('');
    const [type, setType] = useState<{ id: string; name: string } | null>({ id: TransportType.Flight, name: TransportType.Flight });
    const [carrier, setCarrier] = useState<string>('');
    const [referenceNumber, setReferenceNumber] = useState<string>('');
    const [gateOrPlatform, setGateOrPlatform] = useState<string>('');
    const [bookingReference, setBookingReference] = useState<string>('');

    // Partenza
    const [depLocation, setDepLocation] = useState<Location | null>(null);
    const [depDate, setDepDate] = useState<Date | undefined>();
    const [depTime, setDepTime] = useState<string>(''); // Formato "HH:mm"
    const [tripDuration, setTripDuration] = useState<string>(''); // Formato "HH:mm"

    // Arrivo
    const [arrivalDate, setArrivalDate] = useState<Date | undefined>();
    const [arrivalTime, setArrivalTime] = useState<string>(''); // Formato "HH:mm"

    // Privato / Noleggio
    const [driverName, setDriverName] = useState<string>('');
    const [driverPhoneNumber, setDriverPhoneNumber] = useState<string>('');
    const [vehicleDescription, setVehicleDescription] = useState<string>('');
    const [rentalCompany, setRentalCompany] = useState<string>('');
    const [carModel, setCarModel] = useState<string>('');

    // Ritiro / Consegna (Noleggio)
    const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
    const [pickupDate, setPickupDate] = useState<Date | undefined>();
    const [pickupTime, setPickupTime] = useState<string>('');

    const [hasDifferentDropOff, setHasDifferentDropOff] = useState<boolean>(false);

    const [dropOffLocation, setDropOffLocation] = useState<Location | null>(null);
    const [dropOffDate, setDropOffDate] = useState<Date | undefined>();
    const [dropOffTime, setDropOffTime] = useState<string>('');
    const [dropOffNotes, setDropOffNotes] = useState<string>('');

    const [stopovers, setStopovers] = useState<Stopover[]>([]);
    const [additionalContents, setAdditionalContents] = useState<string>('');

    const isPublicTransportType = [TransportType.Flight, TransportType.Train,
    TransportType.Bus, TransportType.Shuttle, TransportType.Ferry].includes(type?.id as TransportType);

    // --- Helpers Date/Time ---

    /**
     * Combina un oggetto Date e una stringa "HH:mm" in un Firestore Timestamp.
     */
    const combineDateTimeToTimestamp = (date: Date | undefined, time: string): Timestamp | undefined => {
        if (!date) return undefined;
        // Se c'è la data ma non l'ora, impostiamo default 00:00 o gestiamo l'errore in validazione
        const timeStr = time || "00:00";
        const [hours, minutes] = timeStr.split(':').map(Number);

        const newDate = new Date(date);
        newDate.setHours(hours || 0, minutes || 0, 0, 0);

        return Timestamp.fromDate(newDate);
    };

    /**
     * Estrae la stringa "HH:mm" da un Firestore Timestamp.
     */
    const extractTimeFromTimestamp = (timestamp: Timestamp | undefined): string => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        // Formatta in HH:mm assicurandosi che ci siano 2 cifre
        return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    };

    // --- Popolamento Dati ---

    const populateForm = useCallback(() => {
        if (!trip || !trip.transports) return;

        const transport = trip.transports.find(t => t.id === transportId);

        if (transport) {
            setTitle(transport.title || '');
            setType({ id: transport.type, name: transport.type });
            setCarrier(transport.carrier || '');
            setReferenceNumber(transport.referenceNumber || '');
            setGateOrPlatform(transport.gateOrPlatform || '');
            setBookingReference(transport.bookingReference || '');
            setAdditionalContents(transport.additionalContents || '');
            // Partenza
            setDepLocation(transport.depLocation || null);
            setDepDate(transport.depDate ? transport.depDate.toDate() : undefined);
            setDepTime(extractTimeFromTimestamp(transport.depDate)); // Estrai stringa
            setTripDuration(transport.tripDuration || '');


            // Arrivo
            setArrivalDate(transport.arrivalDate ? transport.arrivalDate.toDate() : undefined);
            setArrivalTime(extractTimeFromTimestamp(transport.arrivalDate)); // Estrai stringa

            // Driver
            setDriverName(transport.driverName || '');
            setDriverPhoneNumber(transport.driverPhoneNumber || '');
            setVehicleDescription(transport.vehicleDescription || '');

            // Rental
            setRentalCompany(transport.rentalCompany || '');
            setCarModel(transport.carModel || '');

            // Pickup
            setPickupLocation(transport.pickupLocation || null);
            setPickupDate(transport.pickupDate ? transport.pickupDate.toDate() : undefined);
            setPickupTime(extractTimeFromTimestamp(transport.pickupDate));

            // Dropoff
            setHasDifferentDropOff(transport.hasDifferentDropOff || false);
            setDropOffLocation(transport.dropOffLocation || null);
            setDropOffDate(transport.dropOffDate ? transport.dropOffDate.toDate() : undefined);
            setDropOffTime(extractTimeFromTimestamp(transport.dropOffDate));
            setDropOffNotes(transport.dropOffNotes || '');

            setStopovers(transport.stopovers || []);
        }
    }, [trip, transportId]);

    useEffect(() => {
        if (!isNew) {
            populateForm();
        }
    }, [populateForm, isNew]);


    // --- Logica Form ---

    const validateForm = (): boolean => {
        setError(null);
        if (!title) { setError("Il titolo è obbligatorio."); return false; }
        if (!type) { setError("Il tipo di trasporto è obbligatorio."); return false; }

        if (type.id === TransportType.CarRental) {
            if (!pickupLocation) { setError("Luogo di ritiro obbligatorio."); return false; }
            if (!pickupDate) { setError("Data di ritiro obbligatoria."); return false; }
            if (!pickupTime) { setError("Ora di ritiro obbligatoria."); return false; }
        } else if (type.id === TransportType.PrivateTransfer) {
            if (!depLocation) { setError("Luogo di partenza obbligatorio."); return false; }
            // Aggiungi altre regole specifiche se necessario
        } else {
            // Voli, Treni, ecc.
            if (!depLocation) { setError("Luogo di partenza obbligatorio."); return false; }
            if (!depDate) { setError("Data di partenza obbligatoria."); return false; }
            // Se vuoi rendere l'ora obbligatoria:
            if (!depTime) { setError("Ora di partenza obbligatoria."); return false; }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;
        if (!trip?.id) return;

        setIsSubmitting(true);
        setError(null);

        // Helper per rimuovere campi undefined (Firestore non accetta undefined)
        const removeUndefined = (obj: Transport) => {
            const newObj = { ...obj };
            Object.keys(newObj).forEach((key) => {
                if (newObj[key as keyof Transport] === undefined) {
                    delete newObj[key as keyof Transport];
                }
            });
            return newObj;
        };

        const removeUndefinedStopover = (obj: Stopover) => {
            const newObj = { ...obj };
            Object.keys(newObj).forEach((key) => {
                if (newObj[key as keyof Stopover] === undefined) {
                    delete newObj[key as keyof Stopover];
                }
            });
            return newObj;
        };

        try {
            // 1. Costruzione Payload
            // Creiamo un oggetto "raw" con possibili undefined
            const rawTransport: Transport = {
                id: isNew ? generateUUID() : transportId!,
                title,
                type: type?.id as TransportType,
                carrier: carrier || undefined,
                referenceNumber: referenceNumber || undefined,
                gateOrPlatform: gateOrPlatform || undefined,
                bookingReference: bookingReference || undefined,

                // Public Transport / Transfer logic
                depLocation: depLocation || null,
                depDate: combineDateTimeToTimestamp(depDate, depTime),
                depTime: depTime || undefined,
                tripDuration: tripDuration || undefined,
                arrivalDate: combineDateTimeToTimestamp(arrivalDate, arrivalTime),
                arrivalTime: arrivalTime || undefined,

                driverName: driverName || undefined,
                driverPhoneNumber: driverPhoneNumber || undefined,
                vehicleDescription: vehicleDescription || undefined,

                // Rental logic
                rentalCompany: rentalCompany || undefined,
                carModel: carModel || undefined,
                hasDifferentDropOff,
                pickupLocation: pickupLocation || null,
                pickupDate: combineDateTimeToTimestamp(pickupDate, pickupTime),
                pickupTime: pickupTime || undefined,

                dropOffLocation: dropOffLocation || null,
                dropOffDate: combineDateTimeToTimestamp(dropOffDate, dropOffTime),
                dropOffTime: dropOffTime || undefined,

                dropOffNotes: dropOffNotes || undefined,
                // Puliamo anche i singoli stopovers
                stopovers: stopovers.map(s => removeUndefinedStopover(s)) || [],
                additionalContents: additionalContents || undefined,
            };

            // Rimuoviamo i campi undefined dall'oggetto principale
            const newTransport = removeUndefined(rawTransport) as Transport;

            // 2. Aggiornamento Firebase
            // Recuperiamo l'array corrente
            const currentTransports = trip.transports || [];
            let updatedTransports: Transport[];

            if (isNew) {
                updatedTransports = [...currentTransports, newTransport];
            } else {
                updatedTransports = currentTransports.map(t =>
                    t.id === transportId ? newTransport : t
                );
            }

            const tripRef = doc(db, EntityKeys.tripsKey, trip.id);
            await updateDoc(tripRef, {
                transports: updatedTransports
            });

            // 3. Post-submit UI
            if (isNew) {
                router.back();
            } else {
                setIsReadOnly(true);
            }

        } catch (err) {
            console.error("Errore salvataggio trasporto:", err);
            setError("Si è verificato un errore durante il salvataggio.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Gestione UI ---

    const handleCancel = () => {
        if (isNew) { router.back(); }
        else { populateForm(); setIsReadOnly(true); setError(null); }
    };

    const dateOptions = useMemo(() => {
        if (!trip?.startDate || !trip?.endDate) { return []; }
        return generateDateOptions(trip.startDate.toDate(), trip.endDate.toDate());
    }, [trip?.startDate, trip?.endDate]);

    const findDateOption = (date: Date | undefined) => {
        if (!date) { return null; }
        return selectDateOption(date, dateOptions);
    };

    const updateStopover = (id: string, fields: Partial<Stopover>) => {
        setStopovers(stopovers.map(s => s.id === id ? { ...s, ...fields } : s));
    };

    const handleRemoveStopover = (id: string) => setStopovers(stopovers.filter(s => s.id !== id));

    const menuItems: ContextMenuItem[] = [
        {
            label: 'Indicazioni Partenza',
            icon: <FaMap />,
            onClick: () => { if (depLocation?.address) window.open(mapNavigationUrl(depLocation.address), '_blank'); }
        }
    ];

    if (isOwner && !isNew) {
        menuItems.push(
            {
                label: isReadOnly ? 'Modifica' : 'Annulla',
                icon: isReadOnly ? <FaPen /> : <FaTimes />,
                onClick: () => {
                    if (!isReadOnly) handleCancel(); // Se stiamo annullando la modifica
                    else setIsReadOnly(false);
                }
            }
        );
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

    return (
        <div className="space-y-8 pb-24">
            <PageTitle
                title={isNew ? "Nuovo Trasporto" : isReadOnly ? "Dettagli Trasporto" : "Modifica Trasporto"}
                subtitle={isNew ? "Inserisci i dettagli del trasporto." : "Visualizza o aggiorna i dettagli del trasporto."}
            >
                {!isNew && <ContextMenu items={menuItems} />}
            </PageTitle>

            {/* Visualizzazione Errori */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>

                <FormSection title="Informazioni di Base" >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <Input
                            id="title"
                            label="Titolo"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            readOnly={isReadOnly}
                            required
                            placeholder="Es. Volo per Roma"
                        />
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
                </FormSection>

                {/* ... Sezioni esistenti mantenute, assicurati di passare i value corretti ... */}
                {/* Esempio sezione Public Transport */}
                {
                    isPublicTransportType && (
                        <>
                            <FormSection title="Dettagli Biglietto" >
                                {/* ... Inputs Carrier, RefNumber etc ... */}
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
                                        label="Numero Volo/Mezzo"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                        readOnly={isReadOnly}
                                        placeholder="Es. FR123"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <Input
                                        id="bookingReference"
                                        label="Riferimento Prenotazione"
                                        value={bookingReference}
                                        onChange={(e) => setBookingReference(e.target.value)}
                                        readOnly={isReadOnly}
                                    />
                                    <Input
                                        id="gateOrPlatform"
                                        label={type?.id === TransportType.Flight ? 'Gate' : 'Binario/Molo'}
                                        value={gateOrPlatform}
                                        onChange={(e) => setGateOrPlatform(e.target.value)}
                                        readOnly={isReadOnly}
                                    />
                                </div>

                                <div className="w-full gap-6 mb-8">
                                    <SearchLocation
                                        label={`Luogo di Partenza`}
                                        value={depLocation} onSelect={setDepLocation}
                                        readOnly={isReadOnly}
                                        required={!isReadOnly} // Mostra asterisco solo in edit
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <Dropdown
                                        label={`Data di Partenza`}
                                        items={dateOptions}
                                        selected={findDateOption(depDate)}
                                        onSelect={(val) => setDepDate(val?.date)}
                                        readOnly={isReadOnly}
                                        required
                                        optionValue="id"
                                        optionLabel="name"
                                    />
                                    <TimeInput
                                        label={`Ora di Partenza`}
                                        value={depTime}
                                        onChange={setDepTime}
                                        readOnly={isReadOnly}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <Dropdown
                                        label={`Data di Arrivo`}
                                        items={dateOptions}
                                        selected={findDateOption(arrivalDate)}
                                        onSelect={(val) => setArrivalDate(val?.date)}
                                        readOnly={isReadOnly}
                                        required
                                        optionValue="id"
                                        optionLabel="name"
                                    />
                                    <TimeInput
                                        label={`Ora di Arrivo`}
                                        value={arrivalTime}
                                        onChange={setArrivalTime}
                                        readOnly={isReadOnly}
                                        required
                                    />
                                    <DurationInput
                                        id="tripDuration"
                                        label={`Durata Viaggio`}
                                        value={tripDuration}
                                        onChange={setTripDuration}
                                        readOnly={isReadOnly}
                                        required
                                    />
                                </div>
                            </FormSection>

                            {/* Sezione Scali (Lasciata invariata come logica UI) */}
                            <FormSection title="Scali/Cambi" className="relative" >
                                {/* ... Codice scali invariato ... */}
                                {
                                    !isReadOnly && (
                                        <Button variant="secondary" size={'sm'} className="absolute top-0 right-4" onClick={(e) => {
                                            e.preventDefault(); // Prevenire submit form
                                            setStopovers([...stopovers, new StopoverInstance()]);
                                        }}>
                                            <FaPlus className="mr-2" />
                                            Aggiungi
                                        </Button>
                                    )
                                }
                                {stopovers.map((stopover, index) => (
                                    <div key={stopover.id || index} className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 ${index < stopovers.length - 1 ? 'border-b' : ''} border-gray-50 dark:border-gray-700 pb-6 relative`}>
                                        <Input
                                            id={`stopoverStart_${index}`}
                                            label="Luogo di Scalo"
                                            value={stopover.stopoverPlace}
                                            onChange={(e) => { updateStopover(stopover.id, { stopoverPlace: e.target.value }); }}
                                            readOnly={isReadOnly}
                                        />
                                        <TimeInput
                                            label="Ora Arrivo"
                                            value={stopover.arrivalTime}
                                            onChange={(e) => { updateStopover(stopover.id, { arrivalTime: e }); }}
                                            readOnly={isReadOnly}
                                        />
                                        <TimeInput
                                            label="Ora Partenza"
                                            value={stopover.departureTime}
                                            onChange={(e) => { updateStopover(stopover.id, { departureTime: e }); }}
                                            readOnly={isReadOnly}
                                        />
                                        <DurationInput
                                            id={`stopoverDuration_${index}`}
                                            label="Durata Scalo"
                                            value={stopover.duration}
                                            onChange={(e) => { updateStopover(stopover.id, { duration: e }); }}
                                            readOnly={isReadOnly}
                                        />

                                        <Input
                                            id={`stopoverStart_${index}`}
                                            label="Numero Mezzo di Ripartenza"
                                            value={stopover.transportNumber || ''}
                                            onChange={(e) => { updateStopover(stopover.id, { transportNumber: e.target.value }); }}
                                            readOnly={isReadOnly}
                                        />
                                        <Input
                                            id={`stopoverStart_${index}`}
                                            label="Gate di Ripartenza"
                                            value={stopover.gateOrPlatform || ''}
                                            onChange={(e) => { updateStopover(stopover.id, { gateOrPlatform: e.target.value }); }}
                                            readOnly={isReadOnly}
                                        />
                                        {/* ... Resto dei campi scalo ... */}
                                        {!isReadOnly && (
                                            <div className="md:col-span-3 flex justify-end">
                                                <Button size="sm" variant="secondary" onClick={(e) => {
                                                    e.preventDefault();
                                                    handleRemoveStopover(stopover.id)
                                                }}>
                                                    <FaTrash className="mr-2" /> Rimuovi
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </FormSection>
                        </>
                    )
                }

                {/* Sezione Noleggio Auto */}
                {
                    type?.id === TransportType.CarRental && (
                        <FormSection title="Dettagli Noleggio Auto" >
                            <div className="w-full gap-6 mb-8">
                                <SearchLocation
                                    label={`Luogo di Ritiro`}
                                    value={pickupLocation} onSelect={setPickupLocation}
                                    readOnly={isReadOnly}
                                    required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <Dropdown
                                    label={`Data di Ritiro`}
                                    items={dateOptions}
                                    selected={findDateOption(pickupDate)}
                                    onSelect={(val) => setPickupDate(val?.date)}
                                    readOnly={isReadOnly}
                                    required
                                    optionValue="id"
                                    optionLabel="name"
                                />
                                <TimeInput
                                    label={`Ora di Ritiro`}
                                    value={pickupTime}
                                    onChange={setPickupTime}
                                    readOnly={isReadOnly}
                                    required
                                />
                            </div>
                            {/* ... Resto dei campi noleggio, assicurati di usare onChange corretti ... */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <Dropdown
                                    label={`Data di Consegna`}
                                    items={dateOptions}
                                    selected={findDateOption(dropOffDate)}
                                    onSelect={(val) => setDropOffDate(val?.date)}
                                    readOnly={isReadOnly}
                                    required
                                    optionValue="id"
                                    optionLabel="name"
                                />
                                <TimeInput
                                    label={`Ora di Consegna`}
                                    value={dropOffTime}
                                    onChange={setDropOffTime}
                                    readOnly={isReadOnly}
                                    required
                                />
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
                                <Checkbox
                                    id="diff-drop"
                                    checked={hasDifferentDropOff}
                                    onChange={(c: boolean) => !isReadOnly && setHasDifferentDropOff(c)}
                                >
                                    <span className="font-medium">Riconsegna in luogo diverso</span>
                                </Checkbox>
                            </div>

                            {hasDifferentDropOff && (
                                <div className="w-full gap-6 mb-6">
                                    <SearchLocation
                                        label={`Luogo di Riconsegna`}
                                        value={dropOffLocation} onSelect={setDropOffLocation}
                                        readOnly={isReadOnly}
                                        required />
                                </div>
                            )}
                            <div className="mb-6">
                                <Textarea
                                    id="dropOffNotes"
                                    label={`Note`}
                                    value={dropOffNotes}
                                    onChange={(e) => setDropOffNotes(e.target.value)}
                                    readOnly={isReadOnly}
                                />
                            </div>
                        </FormSection>
                    )
                }

                {/* Sezione Trasferimento Privato */}
                {
                    type?.id === TransportType.PrivateTransfer && (
                        <FormSection title="Dettagli Trasferimento Privato" >
                            <div className="w-full gap-6 mb-8">
                                <SearchLocation
                                    label={`Luogo di Partenza`}
                                    value={depLocation} onSelect={setDepLocation}
                                    readOnly={isReadOnly}
                                    required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <Dropdown
                                    label={`Data di Partenza`}
                                    items={dateOptions}
                                    selected={findDateOption(depDate)}
                                    onSelect={(val) => setDepDate(val?.date)}
                                    readOnly={isReadOnly}
                                    required
                                    optionValue="id"
                                    optionLabel="name"
                                />
                                <TimeInput
                                    label={`Ora di Partenza`}
                                    value={depTime}
                                    onChange={setDepTime}
                                    readOnly={isReadOnly}
                                    required
                                />
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
                                    label="Telefono"
                                    value={driverPhoneNumber}
                                    onChange={(e) => setDriverPhoneNumber(e.target.value)}
                                    readOnly={isReadOnly}
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
                        </FormSection>
                    )
                }
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

                {/* Pulsanti Azione */}
                {
                    !isReadOnly && (
                        <ActionStickyBar
                            handleCancel={handleCancel}
                            isSubmitting={isSubmitting} // Collegato allo stato loading
                            isNew={isNew}
                        // Rimuovi handleSave da qui se ActionStickyBar ha un pulsante di tipo submit interno
                        // Altrimenti passa: onSave={handleSubmit}
                        />
                    )
                }
            </form>
        </div >
    );
}