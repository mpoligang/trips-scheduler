'use client';

import { Trip } from "@/models/Trip";
import { useRouter } from "next/navigation";
import { FaPen, FaTrash, FaEllipsisH } from "react-icons/fa";
import ContextMenu, { ContextMenuItem } from "../actions/context-menu";
import { appRoutes } from "@/utils/appRoutes";
import Badge from "../generics/badge";

interface TripCardProps {
    readonly trip: Trip;
    isOwner: boolean;
    readonly onDelete: () => void;
}

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Data da definire';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data non valida';
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' });
};

export default function TripCard({ trip, onDelete, isOwner }: TripCardProps) {
    const router = useRouter();

    const menuItems: ContextMenuItem[] = [
        {
            label: 'Modifica',
            icon: <FaPen className="text-xs" />,
            onClick: () => router.push(appRoutes.settings(trip.id as string)),
        },
        {
            label: 'Elimina',
            icon: <FaTrash className="text-xs" />,
            onClick: onDelete,
        },
    ];

    return (
        <div
            onClick={() => router.push(appRoutes.stages(trip.id as string))}
            className="group cursor-pointer flex flex-col space-y-3"
        >
            <div className="relative  w-full rounded-2xl bg-gray-800 p-4">
                <div className="group-hover:scale-105 transition-transform duration-500 ease-out" />
                <div className="flex flex-col px-1">
                    <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-white text-base truncate pr-2">
                            {trip.name}
                        </h3>
                        {isOwner && (
                            <div onClick={(e) => e.stopPropagation()} >
                                <ContextMenu items={menuItems} />
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-gray-400">
                        {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
                    </p>

                    <hr className="my-4 border-gray-700"></hr>
                    <div className="relative flex -space-x-3">
                        {trip.trip_participants?.slice(0, 4).map((participant) => (
                            <div
                                key={participant.user_id}
                                className="group/avatar relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white text-[11px] select-none uppercase border-2 border-gray-800"
                            >
                                {participant.profiles.first_name?.[0]}{participant.profiles.last_name?.[0]}

                                {/* Tooltip locale all'avatar */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/avatar:block z-50">
                                    <div className="relative bg-gray-900 text-white text-[10px] whitespace-nowrap px-2 py-1 rounded shadow-xl border border-gray-700">
                                        {participant.profiles.first_name} {participant.profiles.last_name}
                                        {/* Freccetta del tooltip */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {trip.trip_participants && trip.trip_participants.length > 4 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-[10px] text-white border-2 border-gray-800">
                                +{trip.trip_participants.length - 4}
                            </div>
                        )}
                    </div>


                </div>
            </div>
        </div>
    );
}