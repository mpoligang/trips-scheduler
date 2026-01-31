import { describe, it, expect } from 'vitest';
import { UserData } from '@/models/UserData';
import { Expense } from '@/models/Expenses';
import { calculateBalances, calculateSettlements } from '../utils/finance-logic';

describe('Test di Stress Splitwise', () => {
    // 1. Mock dei Partecipanti
    const users: Partial<UserData>[] = [
        { id: '1', first_name: 'Alice', last_name: 'A', },
        { id: '2', first_name: 'Bob', last_name: 'B', },
        { id: '3', first_name: 'Charlie', last_name: 'C', },
        { id: '4', first_name: 'David', last_name: 'D', },
        { id: '5', first_name: 'Eve', last_name: 'E', },
    ];

    it('Dovrebbe calcolare correttamente un giro complesso di debiti', () => {
        const expenses: Expense[] = [
            // Spesa 1: Alice paga 100€ per tutti e 5 (20€ a testa)
            {
                id: 'e1',
                paid_by: '1',
                amount: 100,
                expense_splits: users.map(u => ({ user_id: u.id, amount: 20 }))
            } as any,
            // Spesa 2: Bob paga 60€ solo per Charlie e David (30€ a testa)
            {
                id: 'e2',
                paid_by: '2',
                amount: 60,
                expense_splits: [
                    { user_id: '3', amount: 30 },
                    { user_id: '4', amount: 30 }
                ]
            } as any,
            // Spesa 3: Arrotondamento malefico! David paga 10€ per Alice, Bob e Charlie
            // 10 / 3 = 3.333... usiamo gli split reali 3.34, 3.33, 3.33
            {
                id: 'e3',
                paid_by: '4',
                amount: 10,
                expense_splits: [
                    { user_id: '1', amount: 3.34 },
                    { user_id: '2', amount: 3.33 },
                    { user_id: '3', amount: 3.33 }
                ]
            } as any
        ];

        // --- TEST BILANCI ---
        const balances = calculateBalances(users as UserData[], expenses);

        /* CALCOLI ATTESI:
           Alice: +100 (pagati) - 20 (suo E1) - 3.34 (suo E3) = +76.66
           Bob:   +60 (pagati) - 20 (suo E1) - 3.33 (suo E3) = +36.67
           Charlie: -20 (E1) - 30 (E2) - 3.33 (E3) = -53.33
           David: +10 (pagati) - 20 (suo E1) - 30 (suo E2) = -40.00
           Eve: -20 (E1) = -20.00
        */

        expect(balances['1']).toBe(76.66);
        expect(balances['2']).toBe(36.67);
        expect(balances['3']).toBe(-53.33);
        expect(balances['4']).toBe(-40.00);
        expect(balances['5']).toBe(-20.00);

        // --- TEST PAREGGI (OTTIMIZZAZIONE) ---
        const settlements = calculateSettlements(balances, users as UserData[]);

        // La somma dei pareggi deve essere uguale alla somma dei debiti (113.33)
        const totalSettled = settlements.reduce((acc, s) => acc + s.amount, 0);
        expect(Math.round(totalSettled * 100) / 100).toBe(113.33);

        // Verifica una transazione specifica
        // Charlie è il debitore più grande (-53.33), Alice la creditrice più grande (+76.66)
        // L'algoritmo dovrebbe far pagare Charlie ad Alice.
        expect(settlements[0].from.id).toBe('3');
        expect(settlements[0].to.id).toBe('1');
        expect(settlements[0].amount).toBe(53.33);
    });
});