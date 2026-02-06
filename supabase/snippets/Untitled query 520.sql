-- 1. Creazione della tabella Recommended
CREATE TABLE public.recommended (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  address text NULL,
  lat double precision NULL,
  lng double precision NULL,
  destination text NULL,
  category text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT recommended_pkey PRIMARY KEY (id),
  CONSTRAINT recommended_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
  CONSTRAINT recommended_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- 2. Abilitazione della Row Level Security
ALTER TABLE public.recommended ENABLE ROW LEVEL SECURITY;

-- 3. POLICY: Lettura (SELECT)
-- Chiunque sia proprietario del viaggio O partecipante può leggere
CREATE POLICY "I partecipanti e l'owner possono visualizzare i consigliati" 
ON public.recommended
FOR SELECT
USING (
  check_is_trip_owner(trip_id) OR check_is_trip_participant(trip_id)
);

-- 4. POLICY: Inserimento (INSERT)
-- Solo l'owner del viaggio può aggiungere luoghi consigliati
CREATE POLICY "Solo l'owner può aggiungere luoghi consigliati" 
ON public.recommended
FOR INSERT
WITH CHECK (
  check_is_trip_owner(trip_id)
);

-- 5. POLICY: Modifica (UPDATE)
-- Solo l'owner del viaggio può modificare
CREATE POLICY "Solo l'owner può modificare i luoghi consigliati" 
ON public.recommended
FOR UPDATE
USING (
  check_is_trip_owner(trip_id)
);

-- 6. POLICY: Eliminazione (DELETE)
-- Solo l'owner del viaggio può eliminare
CREATE POLICY "Solo l'owner può eliminare i luoghi consigliati" 
ON public.recommended
FOR DELETE
USING (
  check_is_trip_owner(trip_id)
);

-- Indici per ottimizzare le ricerche
CREATE INDEX IF NOT EXISTS idx_recommended_trip_id ON public.recommended(trip_id);