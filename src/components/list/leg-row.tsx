'use client';

import { ReactNode, useState } from 'react';
import { FaWalking, FaBicycle, FaCar, FaBus, FaSpinner, FaDirections } from 'react-icons/fa';
import toast from 'react-hot-toast';

import { ROUTING_MODES, RoutingMode, RoutingModeEnum, StageLeg } from '@/models/StageLeg';
import { formatDistance, formatDuration, haversineMeters } from '@/utils/geo.utils';
import { openGoogleMapsDirections } from '@/utils/open-link.utils';
import { computeLegAction } from '@/actions/legs-actions';
import { useTrip } from '@/context/tripContext';
import Button from '@/components/actions/button';

const ICON_BY_MODE: Record<RoutingMode, ReactNode> = {
    [RoutingModeEnum.Walking]: <FaWalking className="h-3.5 w-3.5" />,
    [RoutingModeEnum.Cycling]: <FaBicycle className="h-3.5 w-3.5" />,
    [RoutingModeEnum.Driving]: <FaCar className="h-3.5 w-3.5" />,
    [RoutingModeEnum.Transit]: <FaBus className="h-3.5 w-3.5" />,
};

const LABEL_BY_MODE: Record<RoutingMode, string> = {
    [RoutingModeEnum.Walking]: 'A piedi',
    [RoutingModeEnum.Cycling]: 'In bici',
    [RoutingModeEnum.Driving]: 'In auto',
    [RoutingModeEnum.Transit]: 'Mezzi pubblici',
};

interface LegRowProps {
    readonly tripId: string;
    readonly fromStageId: string;
    readonly toStageId: string;
    readonly from: { lat: number; lng: number };
    readonly to: { lat: number; lng: number };
    readonly preferredMode: RoutingMode;
    readonly legsByPairMode: Map<string, StageLeg>;
}

export default function LegRow({
    tripId,
    fromStageId,
    toStageId,
    from,
    to,
    preferredMode,
    legsByPairMode,
}: LegRowProps) {
    const { refreshData } = useTrip();
    const [pendingMode, setPendingMode] = useState<RoutingMode | null>(null);
    // Selezione client-side: sovrascrive il default trip per la sessione corrente.
    // Non viene persistita: al reload si torna a `preferredMode`.
    const [selectedMode, setSelectedMode] = useState<RoutingMode | null>(null);

    const activeMode = pendingMode ?? selectedMode ?? preferredMode;
    const leg = legsByPairMode.get(`${fromStageId}|${toStageId}|${activeMode}`);
    const isAccurate = !!leg;
    const distanceM = leg ? leg.distance_m : haversineMeters(from, to);
    const durationLabel = leg ? formatDuration(leg.duration_s) : null;

    const handleSelectMode = async (mode: RoutingMode) => {
        if (mode === activeMode || pendingMode) return;
        setPendingMode(mode);
        try {
            // Cache hit (modalità già in DB) → 0 call. Cache miss → 1 call Stadia.
            const result = await computeLegAction({ tripId, fromStageId, toStageId, mode });
            if (!result.success) {
                toast.error(result.error || 'Errore nel cambio modalità');
                return;
            }
            await refreshData(true);
            setSelectedMode(mode);
        } finally {
            setPendingMode(null);
        }
    };

    const handleOpenMaps = (e: React.MouseEvent) => {
        e.stopPropagation();
        openGoogleMapsDirections(from, to, activeMode);
    };

    return (
        <div className="flex flex-col gap-2 -ml-[9px] pl-3 py-1.5 text-xs text-gray-400">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                    {ROUTING_MODES.map(m => {
                        const isActive = m === activeMode;
                        const isPending = pendingMode === m;
                        return (
                            <button
                                key={m}
                                type="button"
                                onClick={() => handleSelectMode(m)}
                                disabled={!!pendingMode}
                                title={LABEL_BY_MODE[m]}
                                aria-pressed={isActive}
                                className={`inline-flex items-center justify-center h-6 w-6 rounded-full transition-colors disabled:opacity-50 ${isActive
                                    ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-sm shadow-purple-500/30'
                                    : 'bg-transparent text-gray-500 hover:bg-gray-700/50 hover:text-gray-300'
                                    }`}
                            >
                                {isPending
                                    ? <FaSpinner className="h-3 w-3 animate-spin" />
                                    : ICON_BY_MODE[m]}
                            </button>
                        );
                    })}
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenMaps}
                    title="Apri percorso in Google Maps"
                    className="flex-shrink-0 gap-1.5"
                >
                    <FaDirections className="h-3 w-3" />
                    Indicazioni
                </Button>
            </div>
            <div className="flex items-center gap-2 min-w-0 lowercase">
                {isAccurate && <span className="truncate text-gray-200">
                    {formatDistance(distanceM)}
                    {durationLabel && <span className="text-gray-200"> · {durationLabel}</span>}
                </span>}

            </div>
        </div>
    );
}
