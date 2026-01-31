-- 1. Permetti l'eliminazione delle spese ai partecipanti del viaggio
create policy "Users can delete expenses of their trips"
on public.expenses for delete
using ( public.check_is_trip_participant(trip_id) );

-- 2. Assicurati che gli split vengano cancellati automaticamente (Cascade)
-- Riesegui questo per sicurezza se non l'hai fatto prima
alter table public.expense_splits
drop constraint if exists expense_splits_expense_id_fkey,
add constraint expense_splits_expense_id_fkey
   foreign key (expense_id)
   references expenses(id)
   on delete cascade;