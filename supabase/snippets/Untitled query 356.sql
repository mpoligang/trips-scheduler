-- Rimuovi il vecchio se esiste per sicurezza
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
ALTER TABLE public.recommended 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Opzionale: Creiamo un trigger per aggiornare automaticamente la data 
-- ogni volta che il record viene modificato (best practice)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_updated_at ON public.recommended;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.recommended
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
