'use client';

import Button from "@/components/actions/button";
import FirstLevelTripTemplate from "@/components/containers/first-level-trip-template";
import PageTitle from "@/components/generics/page-title";
import Input from "@/components/inputs/input";
import DialogComponent from "@/components/modals/confirm-modal";
import Tabs from "@/components/navigations/tabs";
import { appRoutes } from "@/utils/appRoutes";
import { useState } from "react";
import Dropdown from "@/components/inputs/dropdown";
import { FaPlus } from "react-icons/fa";
import { useTrip } from "@/context/tripContext";
import Checkbox from "@/components/inputs/checkbox";
import MultiSelect from "@/components/inputs/multiselect";
import { createExpenseAction } from "@/actions/expenses-actions";
import { toast } from "react-hot-toast";
import HistoryExpensesList from "@/components/list/expenses/history-expenses-list";
import BalanceList from "@/components/list/expenses/balance-expenses-list";
import SettlementList from "@/components/list/expenses/settlement-expenses-list";


export default function TripExpensesPage() {

    const { trip } = useTrip();
    const [isOpenAddExpenseModal, setIsOpenAddExpenseModal] = useState<boolean>(false);

    return (
        <FirstLevelTripTemplate breadcrumb={
            [
                {
                    label: 'I miei viaggi',
                    href: appRoutes.home,
                },
                {
                    label: trip?.name || 'Dettagli Viaggio',
                    href: appRoutes.tripDetails(trip?.id as string),
                },
                {
                    label: 'Spese',
                    href: '#',
                }
            ]}>
            <PageTitle title="Spese del Viaggio" subtitle="Gestisci e suddividi le spese del tuo viaggio" >
                <Button variant="secondary" size="sm" onClick={() => setIsOpenAddExpenseModal(true)}><FaPlus className="mr-2" />
                    Aggiungi</Button>
            </PageTitle>

            <AddExpenseModal isOpen={isOpenAddExpenseModal} setIsOpen={setIsOpenAddExpenseModal} />

            <Tabs tabs={[
                {
                    label: 'Cronologia',
                    content: <HistoryExpensesList />,
                },
                {
                    label: 'Bilancio',
                    content: <BalanceList />,
                },
                {
                    label: 'Pareggio',
                    content: <SettlementList />,
                },
            ]} />
        </FirstLevelTripTemplate>
    );
}

interface AddExpenseModalProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const AddExpenseModal = ({ isOpen, setIsOpen }: AddExpenseModalProps) => {
    const { trip, refreshData } = useTrip();
    const [description, setDescription] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [paidBy, setPaidBy] = useState<{ id: string; name: string } | null>(null);
    const [paidForAllMembers, setPaidForAllMembers] = useState<boolean>(true);
    const [selectedMembers, setSelectedMembers] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const partecipants = trip?.trip_participants?.map(participant => ({
        id: participant.profiles.id,
        name: `${participant.profiles.first_name} ${participant.profiles.last_name}`
    })) || [];



    const handleSubmit = async () => {
        if (!description || !amount || !paidBy) {
            toast.error("Compila tutti i campi obbligatori");
            return;
        }

        setIsLoading(true);
        try {
            // Determiniamo chi deve dividere la spesa
            // Se "Tutti", usiamo tutti i membri del viaggio
            // Se "Specifici", usiamo quelli selezionati + chi ha pagato (logica standard Splitwise)
            const participantIds = paidForAllMembers
                ? partecipants.map(m => m.id)
                : [...selectedMembers.map(m => m.id)];

            // Assicuriamoci che chi ha pagato sia incluso nella divisione se non lo è già
            if (!participantIds.includes(paidBy.id)) {
                participantIds.push(paidBy.id);
            }

            await createExpenseAction({
                trip_id: trip?.id as string,
                description,
                amount,
                paid_by: paidBy.id,
                split_type: paidForAllMembers ? 'all' : 'specific',
                participant_ids: participantIds as string[],
            });

            toast.success("Spesa aggiunta correttamente!");
            setIsOpen(false);
            await refreshData();
            // Qui potresti voler fare un router.refresh() per aggiornare le tab
        } catch (error) {
            console.error(error);
            toast.error("Errore durante il salvataggio");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <DialogComponent
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            title="Aggiungi Spesa"
            isLoading={isLoading}
            onConfirm={handleSubmit}
        >
            <div className="space-y-6 flex flex-col">
                <Input
                    id="description"
                    label="Descrizione"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />

                <Input
                    id="amount"
                    label="Importo"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    required
                />

                <Dropdown
                    label="Pagato da"
                    selected={paidBy}
                    optionLabel="name"
                    optionValue="id"
                    items={partecipants}
                    onSelect={(val) => {
                        const selected = val as { id: string; name: string };
                        setPaidBy(selected);
                        // Rimuoviamo chi paga dalla lista di chi "riceve" il debito se necessario
                        setSelectedMembers(prev => prev.filter(m => m.id !== selected.id));
                    }}
                    required
                />

                <Checkbox
                    id="paidForAllMembers"
                    checked={paidForAllMembers}
                    onChange={(checked) => {
                        setPaidForAllMembers(checked);
                        if (checked) setSelectedMembers([]); // Reset se seleziona "tutti"
                    }}
                >
                    Pagato per tutti i membri
                </Checkbox>

                {!paidForAllMembers && (
                    <MultiSelect
                        label="Per chi hai pagato?"
                        selected={selectedMembers}
                        optionLabel="name"
                        optionValue="id"
                        required
                        items={partecipants.filter(m => m.id !== paidBy?.id)}
                        onSelect={(items) => setSelectedMembers(items as { id: string; name: string }[])}
                    />
                )}
            </div>
        </DialogComponent>
    );
}