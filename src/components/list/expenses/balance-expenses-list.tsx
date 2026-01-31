'use client';

import { useMemo } from "react";
import { useTrip } from "@/context/tripContext";
import EmptyData from "@/components/cards/empty-data";
import { calculateBalances } from "@/utils/finance-logic";
import { UserData } from "@/models/UserData";

export default function BalanceList() {
    const { expenses, participants } = useTrip();

    const balances = useMemo(() => {
        const memberBalances = calculateBalances(participants as UserData[], expenses);
        return participants.map(p => ({
            profile: p,
            netBalance: memberBalances[p.id!] || 0
        })).sort((a, b) => b.netBalance - a.netBalance);
    }, [expenses, participants]);

    if (expenses.length === 0) {
        return <EmptyData title="Nessun bilancio disponibile." subtitle="I saldi verranno calcolati dopo la prima spesa." />;
    }

    return (
        <div className="space-y-4">
            {balances.map(({ profile, netBalance }) => {
                const isCreditor = netBalance > 0;
                const isNeutral = netBalance === 0;

                const textClass = `${isNeutral ? 'text-gray-400' : isCreditor ? 'text-emerald-400' : 'text-rose-400'} font-semibold`;

                return (
                    <div
                        key={profile.id}
                        className="w-full flex md:flex-row flex-col md:items-center justify-between p-4 bg-gray-700/50 rounded-2xl border border-transparent hover:border-gray-600 transition-all duration-300 gap-2"
                    >
                        <div className="flex items-center flex-1 min-w-0">
                            {/* Avatar: Iniziali unite senza spazio */}
                            <div className="flex h-10 w-10 shrink-0 uppercase items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 text-white text-sm font-medium select-none tracking-tighter">
                                {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
                            </div>

                            <div className="ml-4 flex-1 min-w-0">
                                <p className="font-bold text-white text-lg truncate">
                                    {profile.first_name} {profile.last_name}
                                </p>
                                <p className="text-gray-400 text-[14px]">
                                    {isNeutral ? 'In Pareggio' : isCreditor ? 'Deve ricevere' : 'Deve dare'}{" "}
                                    <span className={"whitespace-nowrap " + textClass}>
                                        {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })
                                            .format(netBalance)
                                            .toString()
                                            .replace('-', '')}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}