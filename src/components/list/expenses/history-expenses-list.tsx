import { deleteExpenseAction } from "@/actions/expenses-actions";
import Button from "@/components/actions/button";
import EmptyData from "@/components/cards/empty-data";
import DialogComponent from "@/components/modals/confirm-modal";
import { useTrip } from "@/context/tripContext";
import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";

export default function HistoryExpensesList() {

    const { expenses } = useTrip();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedExpenseId, setSelectedExpenseId] = useState<{ trip_id: string, expense_id: string }>({ trip_id: '', expense_id: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteExpense = async () => {
        if (!selectedExpenseId) return;
        setIsDeleting(true);

        const response = await deleteExpenseAction(selectedExpenseId);
        if (!response.success) {
            // Gestisci l'errore (ad esempio mostra una notifica)
            setIsDeleting(false);
            return;
        }
        // Logica per eliminare la spesa usando selectedExpenseId
        // ...
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
    }



    return (
        <div className="space-y-4">

            <DialogComponent
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Conferma Eliminazione"
                onConfirm={handleDeleteExpense}
                isLoading={isDeleting}
            >
                <p>Sei sicuro di voler eliminare questa spesa? Questa azione non può essere annullata.</p>
            </DialogComponent>

            {
                expenses.length == 0 ? (
                    <EmptyData title="Nessuna spesa registrata ancora." subtitle="Aggiungi una nuova spesa per iniziare." />
                ) : (
                    expenses.map((expense) => (
                        <li key={expense.id} className="list-none">
                            <div
                                className="w-full flex flex-row items-center justify-between p-4 bg-gray-700/50 rounded-2xl gap-4 border border-transparent hover:border-gray-600 transition-all duration-300"
                            >
                                <div className="flex-1 min-w-0  flex md:flex-row flex-col md:items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-500/20 transition-transform group-hover:scale-110">
                                            <FiShoppingCart />
                                        </div>
                                        <div className="flex flex-col items-start ml-4">
                                            <p className="font-bold text-white  leading-tight  text-lg">
                                                {expense.description}
                                            </p>
                                            <div className=" text-gray-400 text-[14px]">
                                                <p className="text-white mb-0"><span className="font-semibold">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(expense.amount)}</span></p>
                                                pagato da <span className="text-white">{expense.profiles?.first_name} {expense.profiles?.last_name}</span> diviso in <span className="text-white">{expense.expense_splits.length}</span> parti</div>

                                            {/*  */}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end  md:mt-0 mt-4  pt-4 md:pt-0">
                                        <Button variant="secondary" size="sm" onClick={() => {
                                            setSelectedExpenseId({ trip_id: expense.trip_id, expense_id: expense.id });
                                            setIsDeleteModalOpen(true);
                                        }}>
                                            <FaTrash className="mr-2" />
                                            Rimuovi
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))
                )}
        </div>
    );
}
