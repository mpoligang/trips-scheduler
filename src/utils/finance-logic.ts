
import { Expense } from "@/models/Expenses";
import { UserData } from "@/models/UserData";

// Calcola i saldi netti (Saldo = Pagato - Debito)
export function calculateBalances(participants: UserData[], expenses: Expense[]) {
    const balances: Record<string, number> = {};
    for (const p of participants) {
        balances[p.id] = 0;
    }

    for (const exp of expenses) {
        // Credito per chi paga
        if (balances[exp.paid_by] !== undefined) {
            balances[exp.paid_by] += Number(exp.amount);
        }
        // Debito per chi partecipa
        for (const split of exp.expense_splits) {
            if (balances[split.user_id] !== undefined) {
                balances[split.user_id] -= Number(split.amount);
            }
        }
    }

    return balances;
}

// Algoritmo Greedy per minimizzare le transazioni
export function calculateSettlements(balances: Record<string, number>, participants: UserData[]) {
    const results: { from: UserData; to: UserData; amount: number }[] = [];

    const activeBalances = Object.entries(balances)
        .map(([id, bal]) => ({ id, balance: bal }))
        .filter(b => Math.abs(b.balance) > 0.01);

    const debtors = activeBalances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
    const creditors = activeBalances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);

    let d = 0, c = 0;
    while (d < debtors.length && c < creditors.length) {
        const debt = Math.abs(debtors[d].balance);
        const credit = creditors[c].balance;
        const amount = Math.min(debt, credit);

        // Cerchiamo i profili corrispondenti agli ID
        const debtorProfile = participants.find(p => p.id === debtors[d].id);
        const creditorProfile = participants.find(p => p.id === creditors[c].id);

        if (debtorProfile && creditorProfile) {
            results.push({
                from: debtorProfile, // Restituisci tutto il profilo
                to: creditorProfile,   // Restituisci tutto il profilo
                amount: Number(amount.toFixed(2))
            });
        }

        debtors[d].balance += amount;
        creditors[c].balance -= amount;

        if (Math.abs(debtors[d].balance) < 0.01) d++;
        if (Math.abs(creditors[c].balance) < 0.01) c++;
    }

    return results;
}