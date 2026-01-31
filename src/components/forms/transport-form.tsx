'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaMap, FaPen, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

import { useTrip } from "@/context/tripContext";
import PageTitle from "../generics/page-title";
import ContextMenu, { ContextMenuItem } from "../actions/context-menu";
import FormSection from "../generics/form-section";
import Input from "../inputs/input";
import Dropdown from "../inputs/dropdown";
import SearchLocation from "../inputs/search-location";
import TimeInput from "../inputs/time-input";
import Checkbox from "../inputs/checkbox";
import Textarea from "../inputs/textarea";
import DurationInput from "../inputs/duration-input";
import RichTextInput from '../inputs/rich-text-editor';
import ActionStickyBar from "../actions/action-sticky-bar";
import Button from "../actions/button";

import { Location } from "@/models/Location";
import { TransportDetails, StopoverV2, StopoverInstanceV2, TransportType } from "@/models/Transport";
import { generateDateOptions, selectDateOption } from "@/utils/dateTripUtils";
import { appRoutes, mapNavigationUrl } from "@/utils/appRoutes";
import { hasRealContent } from '@/utils/fileSizeUtils';
import { AttachmentList } from '../cards/attachment-manager';
import { upsertTransportAction } from '@/actions/transport-actions';
import { id } from 'date-fns/locale';

export default function TransportForm() {
    const { trip, transports, isOwner, refreshData } = useTrip();
    const params = useParams();
    const router = useRouter();

    const transportId = Array.isArray(params.id) ? params.id[0] : params.id;
    const tripId = params.tripId as string;
    const isNew = transportId === 'new';
    const attachments = transports?.find(t => t.id === transportId)?.attachments || [];

    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Stato error rimosso in favore di toast

    // --- State Form (TUTTI MANTENUTI) ---
    const [title, setTitle] = useState('');
    const [type, setType] = useState<{ id: string; name: string } | null>({ id: TransportType.Flight, name: TransportType.Flight });
    const [carrier, setCarrier] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [gateOrPlatform, setGateOrPlatform] = useState('');
    const [bookingReference, setBookingReference] = useState('');
    const [depLocation, setDepLocation] = useState<Location | null>(null);
    const [depDate, setDepDate] = useState<Date | undefined>();
    const [depTime, setDepTime] = useState('');
    const [tripDuration, setTripDuration] = useState('');
    const [destination, setDestination] = useState('');
    const [arrivalDate, setArrivalDate] = useState<Date | undefined>();
    const [arrivalTime, setArrivalTime] = useState('');
    const [driverName, setDriverName] = useState('');
    const [driverPhoneNumber, setDriverPhoneNumber] = useState('');
    const [vehicleDescription, setVehicleDescription] = useState('');
    const [rentalCompany, setRentalCompany] = useState('');
    const [carModel, setCarModel] = useState('');
    const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
    const [pickupDate, setPickupDate] = useState<Date | undefined>();
    const [pickupTime, setPickupTime] = useState('');
    const [hasDifferentDropOff, setHasDifferentDropOff] = useState(false);
    const [dropOffLocation, setDropOffLocation] = useState<Location | null>(null);
    const [dropOffDate, setDropOffDate] = useState<Date | undefined>();
    const [dropOffTime, setDropOffTime] = useState('');
    const [dropOffNotes, setDropOffNotes] = useState('');
    const [stopovers, setStopovers] = useState<StopoverV2[]>([]);
    const [additionalContents, setAdditionalContents] = useState('');

    // --- Helpers (TUTTI MANTENUTI) ---
    const isPublicTransportType = useMemo(() => [
        TransportType.Flight, TransportType.Train, TransportType.Bus,
        TransportType.Shuttle, TransportType.Ferry
    ].includes(type?.id as TransportType), [type]);

    const combineToISO = (date: Date | undefined, time: string) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const timePart = time || "00:00";
        return `${year}-${month}-${day}T${timePart}:00`;
    };

    const splitISO = (iso: string | null | undefined) => {
        if (!iso) return { d: undefined, t: '' };
        const dateObj = new Date(iso);
        if (isNaN(dateObj.getTime())) return { d: undefined, t: '' };
        return {
            d: dateObj,
            t: iso.includes('T') || iso.includes(' ')
                ? iso.split(/[T ]/)[1].substring(0, 5)
                : "00:00"
        };
    };

    const validateForm = (): boolean => {
        if (!title.trim()) { toast.error("Il titolo è obbligatorio."); return false; }
        if (!type) { toast.error("Il tipo di trasporto è obbligatorio."); return false; }

        if (type.id === TransportType.CarRental) {
            if (!pickupLocation) { toast.error("Il luogo di ritiro è obbligatorio."); return false; }
            if (!pickupDate) { toast.error("La data di ritiro è obbligatoria."); return false; }
            if (!pickupTime) { toast.error("L'ora di ritiro è obbligatoria."); return false; }
            if (!rentalCompany.trim()) { toast.error("L'agenzia di noleggio è obbligatoria."); return false; }
            if (hasDifferentDropOff && !dropOffLocation) { toast.error("Il luogo di riconsegna è obbligatorio."); return false; }
        } else if (type.id === TransportType.PrivateTransfer) {
            if (!depLocation) { toast.error("Il luogo di partenza è obbligatorio."); return false; }
            if (!depDate) { toast.error("La data di partenza è obbligatoria."); return false; }
            if (!depTime) { toast.error("L'ora di partenza è obbligatoria."); return false; }
        } else {
            if (!depLocation) { toast.error("Il luogo di partenza è obbligatorio."); return false; }
            if (!depDate) { toast.error("La data di partenza è obbligatoria."); return false; }
            if (!depTime) { toast.error("L'ora di partenza è obbligatoria."); return false; }
            if (!arrivalDate) { toast.error("La data di arrivo è obbligatoria."); return false; }
            if (!arrivalTime) { toast.error("L'ora di arrivo è obbligatoria."); return false; }
        }
        return true;
    };

    const updateStopover = (id: string, fields: Partial<StopoverV2>) => {
        setStopovers(stopovers.map(s => s.id === id ? { ...s, ...fields } : s));
    };
    const handleAddStopover = (e: React.MouseEvent) => {
        e.preventDefault();
        setStopovers([...stopovers, new StopoverInstanceV2()]);
    };
    const handleRemoveStopover = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setStopovers(stopovers.filter(s => s.id !== id));
    };

    const populateForm = useCallback(() => {
        const transport = transports?.find(t => t.id === transportId);
        if (transport) {
            setTitle(transport.title || '');
            setType({ id: transport.type, name: transport.type });
            setAdditionalContents(transport.notes || '');
            setDestination(transport.destination || '');
            const dep = splitISO(transport.dep_date);
            setDepDate(dep.d); setDepTime(dep.t);
            setDepLocation({ address: transport.dep_address || '', lat: transport.dep_lat || 0, lng: transport.dep_lng || 0 });
            const arr = splitISO(transport.arr_date);
            setArrivalDate(arr.d); setArrivalTime(arr.t);

            const d = transport.details as TransportDetails;
            if (d) {
                setCarrier(d.carrier || '');
                setReferenceNumber(d.reference_number || '');
                setGateOrPlatform(d.gate_or_platform || '');
                setBookingReference(d.booking_reference || '');
                setTripDuration(d.trip_duration || '');
                setDriverName(d.driver_name || '');
                setDriverPhoneNumber(d.driver_phone_number || '');
                setVehicleDescription(d.vehicle_description || '');
                setRentalCompany(d.rental_company || '');
                setCarModel(d.car_model || '');
                setStopovers(d.stopovers || []);
                const pickup = splitISO(d.pickup_date);
                setPickupDate(pickup.d); setPickupTime(pickup.t);
                setPickupLocation(d.pickup_location || null);
                setHasDifferentDropOff(d.has_different_drop_off || false);
                const drop = splitISO(d.drop_off_date);
                setDropOffDate(drop.d); setDropOffTime(drop.t);
                setDropOffLocation(d.drop_off_location || null);
                setDropOffNotes(d.drop_off_notes || '');
            }
        }
    }, [transports, transportId]);

    useEffect(() => { if (!isNew) populateForm(); }, [populateForm, isNew]);

    // --- Submit (RI-ESTESO CON LOGICA DETTAGLIATA) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        const toastId = toast.loading("Salvataggio...");

        let detailsPayload: TransportDetails = {};

        if (isPublicTransportType) {
            detailsPayload = {
                carrier,
                reference_number: referenceNumber,
                booking_reference: bookingReference,
                gate_or_platform: gateOrPlatform,
                trip_duration: tripDuration,
                stopovers
            };
        } else if (type?.id === TransportType.CarRental) {
            detailsPayload = {
                rental_company: rentalCompany,
                car_model: carModel,
                pickup_location: pickupLocation,
                pickup_date: combineToISO(pickupDate, pickupTime) || undefined,
                has_different_drop_off: hasDifferentDropOff,
                drop_off_location: dropOffLocation,
                drop_off_date: combineToISO(dropOffDate, dropOffTime) || undefined,
                drop_off_notes: dropOffNotes,
            };
        } else if (type?.id === TransportType.PrivateTransfer) {
            detailsPayload = {
                driver_name: driverName,
                driver_phone_number: driverPhoneNumber,
                vehicle_description: vehicleDescription,
            };
        }

        const transportPayload = {
            id: isNew ? 'new' : transportId as string,
            trip_id: tripId,
            title,
            type: type?.id || TransportType.Other,
            notes: additionalContents,
            destination,
            dep_date: combineToISO(depDate, depTime),
            dep_address: depLocation?.address || null,
            dep_lat: depLocation?.lat || null,
            dep_lng: depLocation?.lng || null,
            arr_date: combineToISO(arrivalDate, arrivalTime),
            details: detailsPayload,
        };

        try {
            const res = await upsertTransportAction(transportPayload);
            if (!res.success) throw new Error(res.error);

            toast.success("Trasporto salvato!", { id: toastId });
            await refreshData(true);
            if (isNew) router.push(appRoutes.transports(tripId));
            else setIsReadOnly(true);
        } catch (err: any) {
            toast.error(err.message || "Impossibile salvare", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (isNew) router.back();
        else { populateForm(); setIsReadOnly(true); }
    };

    const dateOptions = useMemo(() => {
        if (!trip?.start_date || !trip?.end_date) return [];
        return generateDateOptions(new Date(trip.start_date), new Date(trip.end_date));
    }, [trip?.start_date, trip?.end_date]);

    const menuItems: ContextMenuItem[] = [
        {
            label: 'Indicazioni Partenza',
            icon: <FaMap />,
            onClick: () => { if (depLocation?.address) window.open(mapNavigationUrl(depLocation.address), '_blank'); }
        }
    ];

    if (isOwner && !isNew) {
        menuItems.push({
            label: isReadOnly ? 'Modifica' : 'Annulla',
            icon: isReadOnly ? <FaPen /> : <FaTimes />,
            onClick: () => isReadOnly ? setIsReadOnly(false) : handleCancel()
        });
    }

    // --- JSX (INVARIATO, rimosso solo l'errore statico) ---
    return (
        <div className="space-y-8 pb-24">
            <PageTitle
                title={isNew ? "Nuovo Trasporto" : isReadOnly ? "Dettagli Trasporto" : "Modifica Trasporto"}
                subtitle={isNew ? "Inserisci i dettagli." : "Visualizza o aggiorna i dettagli."}
            >
                {!isNew && <ContextMenu items={menuItems} />}
            </PageTitle>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <FormSection title="Informazioni di Base">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <Input
                            id="tr-title"
                            label="Titolo"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            readOnly={isReadOnly}
                            required
                        />
                        <Dropdown
                            label="Tipo di Mezzo"
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

                {isPublicTransportType && (
                    <>
                        <FormSection title="Dettagli Biglietto e Viaggio">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <Input id="tr-carrier" label="Compagnia" value={carrier} onChange={(e) => setCarrier(e.target.value)} readOnly={isReadOnly} />
                                <Input id="tr-ref" label="Numero Mezzo" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} readOnly={isReadOnly} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <Input id="tr-booking" label="Codice Prenotazione" value={bookingReference} onChange={(e) => setBookingReference(e.target.value)} readOnly={isReadOnly} />
                                <Input id="tr-gate" label="Gate/Binario/Molo/Piattaforma" value={gateOrPlatform} onChange={(e) => setGateOrPlatform(e.target.value)} readOnly={isReadOnly} />
                            </div>
                            <div className="space-y-6">
                                <SearchLocation id="tr-loc-dep" label="Luogo di Partenza" value={depLocation} onSelect={setDepLocation} readOnly={isReadOnly} required={!isReadOnly} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Dropdown label="Data Partenza" items={dateOptions} selected={depDate ? selectDateOption(depDate, dateOptions) : null} onSelect={(val) => setDepDate(val?.date)} readOnly={isReadOnly} required optionValue="id" optionLabel="name" />
                                    <TimeInput id="tr-time-dep" label="Ora Partenza" value={depTime} onChange={setDepTime} readOnly={isReadOnly} required />
                                </div>
                                <Input id="tr-destination" label="Destinazione" value={destination} onChange={(e) => setDestination(e.target.value)} readOnly={isReadOnly} placeholder="Città o Stazione d'arrivo" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Dropdown label="Data Arrivo" items={dateOptions} selected={arrivalDate ? selectDateOption(arrivalDate, dateOptions) : null} onSelect={(val) => setArrivalDate(val?.date)} readOnly={isReadOnly} required optionValue="id" optionLabel="name" />
                                    <TimeInput id="tr-time-arr" label="Ora Arrivo" value={arrivalTime} onChange={setArrivalTime} readOnly={isReadOnly} required />
                                </div>
                            </div>
                            <div className="mt-6 md:w-1/2">
                                <DurationInput id="tr-duration" label="Durata Complessiva" value={tripDuration} onChange={setTripDuration} readOnly={isReadOnly} />
                            </div>
                        </FormSection>

                        {(!isReadOnly || stopovers.length > 0) && (
                            <FormSection title="Scali / Cambi" className="relative">
                                {!isReadOnly && (
                                    <Button variant="secondary" size="sm" className="absolute top-0 right-4" onClick={handleAddStopover}>
                                        <FaPlus className="mr-2" /> Aggiungi
                                    </Button>
                                )}
                                {stopovers.map((stopover, index) => (
                                    <div key={stopover.id || index} className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 ${index < stopovers.length - 1 ? 'border-b' : ''} border-gray-700 pb-6 relative`}>
                                        <Input id={`stopover-${stopover.id}-place`} label="Luogo di Scalo" value={stopover.stopover_place} onChange={(e) => updateStopover(stopover.id, { stopover_place: e.target.value })} readOnly={isReadOnly} />
                                        <TimeInput id={`stopover-${stopover.id}-arrival`} label="Ora Arrivo" value={stopover.arrival_time} onChange={(e) => updateStopover(stopover.id, { arrival_time: e })} readOnly={isReadOnly} />
                                        <TimeInput id={`stopover-${stopover.id}-departure`} label="Ora Partenza" value={stopover.departure_time} onChange={(e) => updateStopover(stopover.id, { departure_time: e })} readOnly={isReadOnly} />
                                        <DurationInput id={`stopover-${stopover.id}-duration`} label="Durata Scalo" value={stopover.duration} onChange={(e) => updateStopover(stopover.id, { duration: e })} readOnly={isReadOnly} />
                                        <Input id={`stopover-${stopover.id}-transport`} label="Mezzo Ripartenza" value={stopover.transport_number || ''} onChange={(e) => updateStopover(stopover.id, { transport_number: e.target.value })} readOnly={isReadOnly} />
                                        <Input id={`stopover-${stopover.id}-gate`} label="Gate Ripartenza" value={stopover.gate_or_platform || ''} onChange={(e) => updateStopover(stopover.id, { gate_or_platform: e.target.value })} readOnly={isReadOnly} />
                                        {!isReadOnly && (
                                            <div className="md:col-span-3 flex justify-end">
                                                <Button size="sm" variant="secondary" onClick={(e) => handleRemoveStopover(e, stopover.id)}>
                                                    <FaTrash className="mr-2" /> Rimuovi
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </FormSection>
                        )}
                    </>
                )}

                {type?.id === TransportType.CarRental && (
                    <FormSection title="Dettagli Noleggio Auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <Input id="rn-company" label="Compagnia" value={rentalCompany} onChange={(e) => setRentalCompany(e.target.value)} readOnly={isReadOnly} required />
                            <Input id="rn-model" label="Modello Auto" value={carModel} onChange={(e) => setCarModel(e.target.value)} readOnly={isReadOnly} />
                        </div>
                        <div className="space-y-6">
                            <SearchLocation label="Luogo di Ritiro" value={pickupLocation} onSelect={setPickupLocation} readOnly={isReadOnly} required />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Dropdown label="Data Ritiro" items={dateOptions} selected={pickupDate ? selectDateOption(pickupDate, dateOptions) : null} onSelect={(val) => setPickupDate(val?.date)} readOnly={isReadOnly} required optionValue="id" optionLabel="name" />
                                <TimeInput label="Ora Ritiro" value={pickupTime} onChange={setPickupTime} readOnly={isReadOnly} required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Dropdown label="Data Consegna" items={dateOptions} selected={dropOffDate ? selectDateOption(dropOffDate, dateOptions) : null} onSelect={(val) => setDropOffDate(val?.date)} readOnly={isReadOnly} required optionValue="id" optionLabel="name" />
                                <TimeInput label="Ora Consegna" value={dropOffTime} onChange={setDropOffTime} readOnly={isReadOnly} required />
                            </div>
                            <Checkbox id="diff-drop" checked={hasDifferentDropOff} onChange={(c) => !isReadOnly && setHasDifferentDropOff(c)}>
                                <span className="font-medium">Riconsegna in luogo diverso</span>
                            </Checkbox>
                            {hasDifferentDropOff && <SearchLocation label="Luogo di Riconsegna" value={dropOffLocation} onSelect={setDropOffLocation} readOnly={isReadOnly} required={hasDifferentDropOff} />}
                            <Textarea id="drop-notes" label="Note Riconsegna" value={dropOffNotes} onChange={(e) => setDropOffNotes(e.target.value)} readOnly={isReadOnly} />
                        </div>
                    </FormSection>
                )}

                {type?.id === TransportType.PrivateTransfer && (
                    <FormSection title="Dettagli Trasferimento Privato">
                        <SearchLocation label="Luogo di Partenza" value={depLocation} onSelect={setDepLocation} readOnly={isReadOnly} required />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                            <Dropdown label="Data Partenza" items={dateOptions} selected={depDate ? selectDateOption(depDate, dateOptions) : null} onSelect={(val) => setDepDate(val?.date)} readOnly={isReadOnly} required optionValue="id" optionLabel="name" />
                            <TimeInput label="Ora Partenza" value={depTime} onChange={setDepTime} readOnly={isReadOnly} required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input id='driver-name' label="Nome Autista" value={driverName} onChange={(e) => setDriverName(e.target.value)} readOnly={isReadOnly} />
                            <Input id='driver-phone' label="Telefono" value={driverPhoneNumber} onChange={(e) => setDriverPhoneNumber(e.target.value)} readOnly={isReadOnly} />
                        </div>
                        <div className="mt-6">
                            <Input id='vehicle-description' label="Veicolo" value={vehicleDescription} onChange={(e) => setVehicleDescription(e.target.value)} readOnly={isReadOnly} placeholder="Modello/Targa" />
                        </div>
                    </FormSection>
                )}

                {(!isReadOnly || hasRealContent(additionalContents)) && (
                    <FormSection title="Contenuti Aggiuntivi">
                        <RichTextInput value={additionalContents} onChange={setAdditionalContents} readOnly={isReadOnly} />
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