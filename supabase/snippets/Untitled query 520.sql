-- Nota: In PostgreSQL, se cambi le colonne restituite, 
-- è necessario eliminare e ricreare la funzione per evitare conflitti di firma.
DROP FUNCTION IF EXISTS get_my_private_profile();

CREATE OR REPLACE FUNCTION get_my_private_profile()
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  username text,
  email text,
  plan text,
  expiration_plan_date timestamp with time zone,
  total_trips_created integer,
  total_storage_used_in_bytes bigint,
  ai_api_key text, -- Nuovo campo aggiunto
  ai_model text    -- Nuovo campo aggiunto
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Esegue con i permessi del creatore per accedere ai dati sensibili
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.username,
    p.email, 
    p.plan, 
    p.expiration_plan_date,
    p.total_trips_created,
    p.total_storage_used_in_bytes,
    p.ai_api_key, -- Recupera la chiave API
    p.ai_model    -- Recupera il modello preferito
  FROM public.profiles p
  WHERE p.id = auth.uid(); -- Filtra rigorosamente: restituisce solo i dati dell'utente loggato
END;
$$;