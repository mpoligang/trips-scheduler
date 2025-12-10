'use client';

import { useState } from 'react';
import { FaPlus, FaPlane, FaTrain, FaBus, FaShip, FaCar, FaRocket, FaExclamationTriangle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { app, db } from '@/firebase/config';
import { Transport } from '@/models/Transport';
import Button from '@/components/actions/button';
import DetailItemCard from '@/components/cards/detail-item-card';
import EmptyData from '@/components/cards/empty-data';
import ConfirmationModal from '@/components/modals/confirm-modal';
import { appRoutes } from '@/utils/appRoutes';

interface TransportsListProps {
    readonly tripId: string;
    readonly transports?: Transport[];
    isOwner: boolean;
}

export default function TransportsList({ tripId, transports = [], isOwner }: Readonly<TransportsListProps>) {
    const router = useRouter();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const getIcon = (type: string) => {
        switch (type) {
            case 'Aereo': return <FaPlane />;
            case 'Treno': return <FaTrain />;
            case 'Autobus': case 'Navetta': return <FaBus />;
            case 'Traghetto': return <FaShip />;
            case 'Noleggio Auto': return <FaCar />;
            default: return <FaRocket />;
        }
    };

    const handleConfirmDelete = async () => {
        const toDelete = transports.find(t => t.id === deleteId);
        if (!toDelete) return;
        setIsDeleting(true);
        try {
            const docRef = doc(db, 'trips', tripId);
            await updateDoc(docRef, { transports: arrayRemove(toDelete) });
        } catch (e) { console.error(e); }
        finally { setIsDeleting(false); setDeleteId(null); }
    };

    return (
        <div>
            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
                title="Elimina Trasporto"
                confirmText="Elimina"
                icon={<FaExclamationTriangle className="text-red-500" />}
            >
                Sei sicuro di voler eliminare questo trasporto?
            </ConfirmationModal>

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">I tuoi Spostamenti</h3>
                <Button variant="secondary" size="sm" onClick={() => router.push(appRoutes.transportDetails(tripId))}>
                    <FaPlus className="mr-2" /> Aggiungi
                </Button>
            </div>

            {transports.length > 0 ? (
                <ul className="space-y-4">
                    {transports.map(t => (
                        <DetailItemCard
                            key={t.id}
                            icon={getIcon(t.type)}
                            title={`${t.title} - ${t.referenceCode || ''}`}
                            directionsUrl="#" // Opzionale
                            detailUrl={appRoutes.transportDetails(tripId, t.id)}
                            onDelete={() => setDeleteId(t.id)}
                            isOwner={isOwner}
                        />
                    ))}
                </ul>
            ) : (
                <EmptyData title="Nessun trasporto" subtitle="Aggiungi voli, treni o noleggi." />
            )}
        </div>
    );
}