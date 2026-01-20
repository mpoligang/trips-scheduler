'use client';

import { useState } from 'react';
import { FaPlus, FaPlane, FaTrain, FaBus, FaShip, FaCar, FaRocket } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Transport } from '@/models/Transport';
import Button from '@/components/actions/button';
import DetailItemCard from '@/components/cards/detail-item-card';
import EmptyData from '@/components/cards/empty-data';
import DialogComponent from '@/components/modals/confirm-modal';
import { appRoutes } from '@/utils/appRoutes';
import { EntityKeys } from '@/utils/entityKeys';
import PageTitle from '../generics/page-title';

interface TransportsListProps {
    readonly tripId: string;
    readonly transports?: Transport[];
    isOwner: boolean;
}

// Funzione helper per formattare le date per le intestazioni (es. "Lunedì 15 Gennaio")
const formatDateForGroup = (dateString: string): string => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long', day: 'numeric', month: 'long',
    });
};

export default function TransportsList({ tripId, transports = [], isOwner }: Readonly<TransportsListProps>) {
    const router = useRouter();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const toDelete = transports.find(t => t.id === deleteId);

    const getIcon = (type: string) => {
        switch (type) {
            case 'Aereo': return <FaPlane />;
            case 'Treno': return <FaTrain />;
            case 'Autobus': case 'Navetta': return <FaBus />;
            case 'Traghetto': return <FaShip />;
            case 'Noleggio Auto': case 'Noleggio con conducente': return <FaCar />;
            default: return <FaRocket />;
        }
    };

    const handleConfirmDelete = async () => {
        if (!toDelete) return;
        setIsDeleting(true);
        try {
            const docRef = doc(db, EntityKeys.tripsKey, tripId);
            await updateDoc(docRef, { transports: arrayRemove(toDelete) });
        } catch (e) { console.error(e); }
        finally { setIsDeleting(false); setDeleteId(null); }
    };

    // LOGICA DI RAGGRUPPAMENTO PER DATA
    const groupedTransports = transports.reduce((acc, transport) => {
        // Converte il Timestamp di Firestore in una stringa YYYY-MM-DD per raggruppare
        let dateKey = '';
        if (transport.depDate && typeof transport.depDate.toDate === 'function') {
            const date = transport.depDate.toDate();
            dateKey = date.toISOString().split('T')[0];
        } else {
            // Fallback se la data non è valida o non è un Timestamp
            return acc;
        }

        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(transport);
        return acc;
    }, {} as Record<string, Transport[]>);

    const sortedDates = Object.keys(groupedTransports).sort();
    const hasTransports = sortedDates.length > 0;

    return (
        <div>
            <DialogComponent
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title="Elimina Trasporto"
                confirmText="Elimina"
            >
                <p>Sei sicuro di voler eliminare il trasporto <strong>{toDelete?.title}</strong>?</p>
            </DialogComponent>

            <PageTitle title="I tuoi Trasporti" subtitle="Gestisci i voli, treni e altri spostamenti del tuo viaggio.">
                {
                    isOwner && (<>
                        <Button variant="secondary" size="sm" onClick={() => router.push(appRoutes.transportDetails(tripId, 'new'))}>
                            <FaPlus className="mr-2" /> Aggiungi
                        </Button>
                    </>)
                }
            </PageTitle>
            {hasTransports ? (
                <div className="space-y-6">
                    {sortedDates.map(date => (
                        <div key={date}>
                            {/* Intestazione della data */}
                            <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300 mb-3  pb-2 capitalize">
                                {formatDateForGroup(date)}
                            </h4>

                            <ul className="space-y-4">
                                {groupedTransports[date]
                                    .map(t => (
                                        <DetailItemCard
                                            key={t.id}
                                            icon={getIcon(t.type)}
                                            title={t.title}
                                            directionsUrl="#" // Opzionale
                                            detailUrl={appRoutes.transportDetails(tripId, t.id)}
                                            onDelete={() => setDeleteId(t.id)}
                                            isOwner={isOwner}
                                        />
                                    ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyData title="Nessun trasporto" subtitle="Aggiungi voli, treni o noleggi." />
            )}
        </div>
    );
}