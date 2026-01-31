'use client';

import { useMemo } from "react";
import { useTrip } from "@/context/tripContext";
import EmptyData from "@/components/cards/empty-data";
import { calculateBalances, calculateSettlements } from "@/utils/finance-logic"; // Assicurati che il percorso sia corretto
import { UserData } from "@/models/UserData";

export default function SettlementList() {
    const { expenses, participants } = useTrip();

    const settlements = useMemo(() => {
        const memberBalances = calculateBalances(participants as UserData[], expenses);
        return calculateSettlements(memberBalances, participants as UserData[]);
    }, [expenses, participants]);

    const receivedSummary = useMemo(() => {
        const summary: Record<string, { profile: any, total: number, sources: string[] }> = {};

        settlements.forEach(s => {
            const creditorId = s.to.id;
            if (!summary[creditorId]) {
                summary[creditorId] = { profile: s.to, total: 0, sources: [] };
            }
            summary[creditorId].total += s.amount;
            summary[creditorId].sources.push(
                `${s.from.first_name} (${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(s.amount)})`
            );
        });

        return Object.values(summary);
    }, [settlements]);

    if (expenses.length === 0 || settlements.length === 0) {
        return <EmptyData title="Tutti in pari!" subtitle="Non ci sono debiti da saldare al momento." />;
    }

    return (
        <>
            {/* Sezione DEBITI (Tua grafica originale) */}
            <div className="space-y-4">
                {settlements.map((settlement, index) => (
                    <div
                        key={index}
                        className="w-full flex md:flex-row flex-col md:items-center justify-between p-4 bg-gray-700/50 rounded-2xl border border-transparent hover:border-gray-600 transition-all duration-300"
                    >
                        <div className="flex items-center">
                            <div className="flex h-10 w-10 shrink-0 uppercase items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white text-sm font-medium select-none tracking-tighter">
                                {settlement.from.first_name?.charAt(0)}{settlement.from.last_name?.charAt(0)}
                            </div>
                            <div className="flex flex-col ml-4">
                                <div className="flex-1 min-w-0 ">
                                    <p className="font-bold text-white text-lg leading-tight truncate">
                                        {settlement.from.first_name} {settlement.from.last_name}
                                    </p>
                                </div>
                                <div className="text-gray-400 text-[14px] ">
                                    Ha un debito di <span className="text-rose-400 font-semibold">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(settlement.amount)} </span>
                                    con <span className="text-white">{settlement.to.first_name} {settlement.to.last_name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Nuova Sezione CREDITI (Tua grafica originale) */}
            <div className="space-y-4 mt-4">
                {receivedSummary.map((item, index) => (
                    <div
                        key={index}
                        className="w-full flex md:flex-row flex-col md:items-center justify-between p-4 bg-gray-700/50 rounded-2xl border border-transparent hover:border-gray-600 transition-all duration-300"
                    >
                        <div className="flex items-center">
                            <div className="flex h-10 w-10 shrink-0 uppercase items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white text-sm font-medium select-none tracking-tighter">
                                {item.profile.first_name?.charAt(0)}{item.profile.last_name?.charAt(0)}
                            </div>
                            <div className="flex flex-col ml-4">
                                <div className="flex-1 min-w-0 ">
                                    <p className="font-bold text-white text-lg leading-tight truncate">
                                        {item.profile.first_name} {item.profile.last_name}
                                    </p>
                                </div>
                                <div className="text-gray-400 text-[14px] ">
                                    Ha un credito totale di <span className="text-emerald-400 font-semibold">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(item.total)} </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}