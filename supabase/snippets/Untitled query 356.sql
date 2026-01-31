-- Rimuovi la vecchia policy se esistente
drop policy if exists "Users can insert splits" on public.expense_splits;

-- Crea la nuova policy specifica per l'INSERT
create policy "Users can insert splits if they are participants"
on public.expense_splits for insert
with check (
  exists (
    select 1 from public.expenses e
    where e.id = expense_id
    and public.check_is_trip_participant(e.trip_id)
  )
);

-- Assicurati che anche la SELECT sia robusta
drop policy if exists "Users can view splits of their trips" on public.expense_splits;

create policy "Users can view splits of their trips"
on public.expense_splits for select
using (
  exists (
    select 1 from public.expenses e
    where e.id = expense_splits.expense_id
    and public.check_is_trip_participant(e.trip_id)
  )
);