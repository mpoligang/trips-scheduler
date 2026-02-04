-- 1. TABELLA GENITORE: La richiesta di ricerca
create table public.ai_search_requests (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  
  -- Contesto del Viaggio
  trip_id uuid not null references trips(id) on delete cascade,
  
  -- POLIMORFISMO: Da dove è partita la ricerca? (Sposti qui il vincolo)
  stage_id uuid references stages(id) on delete cascade,
  accommodation_id uuid references accommodations(id) on delete cascade,
  transport_id uuid references transports(id) on delete cascade,
  
  -- Metadati della ricerca (Cosa ha chiesto l'utente?)
  search_params jsonb, -- es: { "radius": "1km", "interests": ["vegan", "museums"] }
  
  constraint ai_requests_pkey primary key (id),
  
  -- Check Constraint: La ricerca deve partire da UNA sola entità
  constraint ai_requests_anchor_check check (
    (
      (
        (
          ((stage_id is not null))::integer + ((accommodation_id is not null))::integer
        ) + ((transport_id is not null))::integer
      ) = 1
    )
  )
);

-- 2. TABELLA FIGLIA: I risultati suggeriti
create table public.ai_suggestions (
  id uuid not null default gen_random_uuid (),
  
  -- Collegamento alla Richiesta Genitore
  request_id uuid not null references ai_search_requests(id) on delete cascade,
  
  -- Denormalizzazione utile per RLS veloce (opzionale ma consigliata)
  trip_id uuid not null references trips(id) on delete cascade,
  
  -- Dati del Luogo
  name text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  notes text, -- HTML
  
  -- Metadati specifici del risultato
  category_tags text[],
  
  created_at timestamp with time zone null default now(),
  constraint ai_suggestions_pkey primary key (id)
);

-- INDICI
create index idx_ai_requests_trip_id on public.ai_search_requests(trip_id);
create index idx_ai_requests_stage_id on public.ai_search_requests(stage_id);
create index idx_ai_suggestions_request_id on public.ai_suggestions(request_id);

-- Abilita RLS
ALTER TABLE public.ai_search_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy per le RICHIESTE (Genitore)
CREATE POLICY "Participants can manage requests"
ON public.ai_search_requests
USING (public.check_is_trip_participant(trip_id))
WITH CHECK (public.check_is_trip_participant(trip_id));

-- Policy per i SUGGERIMENTI (Figli)
CREATE POLICY "Participants can manage suggestions"
ON public.ai_suggestions
USING (public.check_is_trip_participant(trip_id))
WITH CHECK (public.check_is_trip_participant(trip_id));