'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaPen, FaMap, FaUndo } from 'react-icons/fa';
import toast from 'react-hot-toast';

import { useTrip } from '@/context/tripContext';
import { appRoutes } from '@/utils/appRoutes';
import { Location } from '@/models/Location';
import { upsertRecommendedAction } from '@/actions/recommended-actions';

import ContextMenu from '@/components/actions/context-menu';
import PageTitle from '../generics/page-title';
import SearchLocation from '../inputs/search-location';
import Dropdown from '../inputs/dropdown';
import Input from '../inputs/input';
import ActionStickyBar from '../actions/action-sticky-bar';
import FormSection from '../generics/form-section';
import RichTextInput from '../inputs/rich-text-editor';
import { hasRealContent } from '@/utils/fileSizeUtils';
import { CATEGORY_OPTIONS } from '@/utils/recommended.utils';
import { openLatLngLink } from '@/utils/open-link.utils';

// Lista delle categorie consigliate


export default function RecommendedForm() {
    const router = useRouter();
    const params = useParams();

    const { trip, recommended, refreshData, isOwner } = useTrip();

    const tripId = params.tripId as string;
    const recommendedId = params.id as string;
    const isNew = recommendedId === 'new';

    // Stati del Form
    const [isReadOnly, setIsReadOnly] = useState(!isNew);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [title, setTitle] = useState('');
    const [location, setLocation] = useState<Location | null>(null);
    const [destination, setDestination] = useState<{ id: string; name: string } | null>(null);
    const [category, setCategory] = useState<{ id: string; name: string } | null>(null);
    const [additionalContent, setAdditionalContent] = useState<string>('');

    // Popolamento dati in caso di modifica
    const populateForm = useCallback(() => {
        const item = recommended?.find(r => r.id === recommendedId);
        if (item) {
            setTitle(item.title);
            setAdditionalContent(item.additional_content || ''); // Mappato dal DB
            setLocation({
                address: item.address || '',
                lat: item.lat || 0,
                lng: item.lng || 0
            });

            if (item.destination) {
                setDestination({ id: item.destination, name: item.destination });
            }

            if (item.category) {
                const catOption = CATEGORY_OPTIONS.find(c => c.id === item.category || c.name === item.category);
                setCategory(catOption || { id: item.category, name: item.category });
            }
        }
    }, [recommended, recommendedId]);

    useEffect(() => {
        if (!isNew) populateForm();
    }, [populateForm, isNew]);

    const handleCancel = () => {
        if (isNew) router.back();
        else {
            populateForm();
            setIsReadOnly(true);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validazione
        if (!title || !destination || !location || !category) {
            toast.error("Compila tutti i campi obbligatori (Titolo, Destinazione, Categoria, Indirizzo).");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading(isNew ? "Aggiungendo ai consigliati..." : "Aggiornando suggerimento...");

        try {
            const result = await upsertRecommendedAction({
                id: isNew ? undefined : recommendedId,
                trip_id: tripId,
                title,
                destination: destination.name,
                location: location.address,
                lat: location.lat,
                lng: location.lng,
                category: category.id,
                additionalContent,
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            toast.success(isNew ? "Suggerimento salvato!" : "Suggerimento aggiornato!", { id: toastId });

            await refreshData(true);

            if (isNew) {
                router.push(appRoutes.recommended(tripId));
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

    return (
        <div className="space-y-8 pb-24">
            <PageTitle
                title={isNew ? 'Consiglia un Luogo' : isReadOnly ? 'Dettagli Suggerimento' : 'Modifica Suggerimento'}
                subtitle={isNew ? "Aggiungi un punto di interesse che i partecipanti dovrebbero vedere." : "Gestisci le informazioni del luogo consigliato."}
            >
                {!isNew && isOwner && (
                    <ContextMenu items={[
                        {
                            label: isReadOnly ? 'Modifica' : 'Annulla',
                            icon: isReadOnly ? <FaPen /> : <FaUndo />,
                            onClick: () => isReadOnly ? setIsReadOnly(false) : handleCancel()
                        },
                        {
                            label: 'Indicazioni',
                            icon: <FaMap />,
                            onClick: () => {
                                if (location?.lat && location?.lng) {
                                    openLatLngLink(location.lat, location.lng);
                                }
                            }
                        }
                    ]} />
                )}
            </PageTitle>

            <form onSubmit={handleSubmit} className="space-y-4">
                <FormSection title='Informazioni Essenziali'>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            id='recommended-title'
                            label="Nome del luogo"
                            placeholder="Es: Ramen Ichiraku, Museo Ghibli..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            readOnly={isReadOnly}
                        />
                        <Dropdown
                            label="Categoria"
                            items={CATEGORY_OPTIONS}
                            selected={category}
                            onSelect={setCategory}
                            optionValue='id'
                            optionLabel="name"
                            required
                            readOnly={isReadOnly}
                        />
                    </div>
                </FormSection>

                <FormSection title='Posizione'>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Dropdown
                            label="Destinazione del viaggio"
                            items={destinationOptions}
                            selected={destination}
                            onSelect={setDestination}
                            optionValue='id'
                            optionLabel="name"
                            required
                            readOnly={isReadOnly}
                        />
                        <SearchLocation
                            value={location}
                            onSelect={setLocation}
                            label="Indirizzo esatto"
                            readOnly={isReadOnly}
                            required
                        />
                    </div>
                </FormSection>

                {(!isReadOnly || hasRealContent(additionalContent)) && (
                    <FormSection title='Perché visitarlo? (Descrizione e Note)'>
                        <RichTextInput
                            value={additionalContent}
                            onChange={setAdditionalContent}
                            readOnly={isReadOnly}
                        />
                    </FormSection>
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