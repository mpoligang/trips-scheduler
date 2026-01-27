drop extension if exists "pg_net";


  create table "public"."accommodations" (
    "id" uuid not null default gen_random_uuid(),
    "trip_id" uuid not null,
    "name" text not null,
    "destination" text,
    "address" text,
    "lat" double precision,
    "lng" double precision,
    "start_date" timestamp with time zone not null,
    "end_date" timestamp with time zone not null,
    "cost" numeric(10,2) default 0,
    "currency" text default 'EUR'::text,
    "link" text,
    "notes" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."accommodations" enable row level security;


  create table "public"."attachments" (
    "id" uuid not null default gen_random_uuid(),
    "trip_id" uuid not null,
    "stage_id" uuid,
    "accommodation_id" uuid,
    "transport_id" uuid,
    "name" text not null,
    "url" text not null,
    "storage_path" text,
    "size_in_bytes" bigint default 0,
    "file_type" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."attachments" enable row level security;


  create table "public"."plans" (
    "id" text not null,
    "name" text not null,
    "storage_limit_bytes" bigint not null,
    "max_file_size_bytes" bigint not null,
    "max_trips" integer,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."plans" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "first_name" text,
    "last_name" text,
    "email" text,
    "plan" text not null default 'free'::text,
    "expiration_plan_date" timestamp with time zone,
    "total_trips_created" integer default 0,
    "total_storage_used_in_bytes" bigint default 0,
    "updated_at" timestamp with time zone default now(),
    "username" text
      );


alter table "public"."profiles" enable row level security;


  create table "public"."stages" (
    "id" uuid not null default gen_random_uuid(),
    "trip_id" uuid not null,
    "name" text not null,
    "destination" text,
    "address" text,
    "lat" double precision,
    "lng" double precision,
    "arrival_date" timestamp with time zone not null,
    "notes" text,
    "position" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."stages" enable row level security;


  create table "public"."transports" (
    "id" uuid not null default gen_random_uuid(),
    "trip_id" uuid not null,
    "title" text not null,
    "notes" text,
    "type" text not null,
    "dep_date" timestamp with time zone,
    "arr_date" timestamp with time zone,
    "position" integer default 0,
    "details" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "dep_address" text,
    "dep_lat" double precision,
    "dep_lng" double precision,
    "destination" text
      );


alter table "public"."transports" enable row level security;


  create table "public"."trip_participants" (
    "trip_id" uuid not null,
    "user_id" uuid not null,
    "joined_at" timestamp with time zone default now()
      );


alter table "public"."trip_participants" enable row level security;


  create table "public"."trips" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "name" text not null,
    "start_date" date not null,
    "end_date" date not null,
    "destinations" text[] default '{}'::text[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."trips" enable row level security;

CREATE UNIQUE INDEX accommodations_pkey ON public.accommodations USING btree (id);

CREATE UNIQUE INDEX attachments_pkey ON public.attachments USING btree (id);

CREATE INDEX idx_accommodations_trip_id ON public.accommodations USING btree (trip_id);

CREATE INDEX idx_attachments_trip_id ON public.attachments USING btree (trip_id);

CREATE INDEX idx_participants_lookup ON public.trip_participants USING btree (trip_id, user_id);

CREATE INDEX idx_profiles_username ON public.profiles USING btree (username);

CREATE INDEX idx_stages_trip_id ON public.stages USING btree (trip_id);

CREATE INDEX idx_transports_trip_id ON public.transports USING btree (trip_id);

CREATE INDEX idx_trips_owner_id ON public.trips USING btree (owner_id);

CREATE UNIQUE INDEX plans_pkey ON public.plans USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE UNIQUE INDEX stages_pkey ON public.stages USING btree (id);

CREATE UNIQUE INDEX transports_pkey ON public.transports USING btree (id);

CREATE UNIQUE INDEX trip_participants_pkey ON public.trip_participants USING btree (trip_id, user_id);

CREATE UNIQUE INDEX trips_pkey ON public.trips USING btree (id);

alter table "public"."accommodations" add constraint "accommodations_pkey" PRIMARY KEY using index "accommodations_pkey";

alter table "public"."attachments" add constraint "attachments_pkey" PRIMARY KEY using index "attachments_pkey";

alter table "public"."plans" add constraint "plans_pkey" PRIMARY KEY using index "plans_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."stages" add constraint "stages_pkey" PRIMARY KEY using index "stages_pkey";

alter table "public"."transports" add constraint "transports_pkey" PRIMARY KEY using index "transports_pkey";

alter table "public"."trip_participants" add constraint "trip_participants_pkey" PRIMARY KEY using index "trip_participants_pkey";

alter table "public"."trips" add constraint "trips_pkey" PRIMARY KEY using index "trips_pkey";

alter table "public"."accommodations" add constraint "accommodations_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE not valid;

alter table "public"."accommodations" validate constraint "accommodations_trip_id_fkey";

alter table "public"."attachments" add constraint "attachments_accommodation_id_fkey" FOREIGN KEY (accommodation_id) REFERENCES public.accommodations(id) ON DELETE CASCADE not valid;

alter table "public"."attachments" validate constraint "attachments_accommodation_id_fkey";

alter table "public"."attachments" add constraint "attachments_stage_id_fkey" FOREIGN KEY (stage_id) REFERENCES public.stages(id) ON DELETE CASCADE not valid;

alter table "public"."attachments" validate constraint "attachments_stage_id_fkey";

alter table "public"."attachments" add constraint "attachments_transport_id_fkey" FOREIGN KEY (transport_id) REFERENCES public.transports(id) ON DELETE CASCADE not valid;

alter table "public"."attachments" validate constraint "attachments_transport_id_fkey";

alter table "public"."attachments" add constraint "attachments_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE not valid;

alter table "public"."attachments" validate constraint "attachments_trip_id_fkey";

alter table "public"."attachments" add constraint "linked_resource_check" CHECK ((((((stage_id IS NOT NULL))::integer + ((accommodation_id IS NOT NULL))::integer) + ((transport_id IS NOT NULL))::integer) = 1)) not valid;

alter table "public"."attachments" validate constraint "linked_resource_check";

alter table "public"."profiles" add constraint "check_expiration_consistency" CHECK ((((plan = 'free'::text) AND (expiration_plan_date IS NULL)) OR (plan <> 'free'::text))) not valid;

alter table "public"."profiles" validate constraint "check_expiration_consistency";

alter table "public"."profiles" add constraint "fk_profile_plan" FOREIGN KEY (plan) REFERENCES public.plans(id) not valid;

alter table "public"."profiles" validate constraint "fk_profile_plan";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_plan_check" CHECK ((plan = ANY (ARRAY['free'::text, 'pro'::text, 'premium'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_plan_check";

alter table "public"."profiles" add constraint "profiles_total_storage_used_in_bytes_check" CHECK ((total_storage_used_in_bytes >= 0)) not valid;

alter table "public"."profiles" validate constraint "profiles_total_storage_used_in_bytes_check";

alter table "public"."profiles" add constraint "profiles_total_trips_created_check" CHECK ((total_trips_created >= 0)) not valid;

alter table "public"."profiles" validate constraint "profiles_total_trips_created_check";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."stages" add constraint "stages_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE not valid;

alter table "public"."stages" validate constraint "stages_trip_id_fkey";

alter table "public"."transports" add constraint "transports_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE not valid;

alter table "public"."transports" validate constraint "transports_trip_id_fkey";

alter table "public"."trip_participants" add constraint "trip_participants_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE not valid;

alter table "public"."trip_participants" validate constraint "trip_participants_trip_id_fkey";

alter table "public"."trip_participants" add constraint "trip_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."trip_participants" validate constraint "trip_participants_user_id_fkey";

alter table "public"."trips" add constraint "check_dates" CHECK ((end_date >= start_date)) not valid;

alter table "public"."trips" validate constraint "check_dates";

alter table "public"."trips" add constraint "trips_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."trips" validate constraint "trips_owner_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.can_user_upload(u_id uuid, new_file_size bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_usage BIGINT;
    plan_limit BIGINT;
    expiration_date TIMESTAMP WITH TIME ZONE;
    current_plan_id TEXT;
BEGIN
    -- 1. Recuperiamo utilizzo, limite, data di scadenza e ID del piano
    SELECT 
        p.total_storage_used_in_bytes, 
        pl.storage_limit_bytes, 
        p.expiration_plan_date,
        p.plan
    INTO 
        current_usage, 
        plan_limit, 
        expiration_date,
        current_plan_id
    FROM public.profiles p
    JOIN public.plans pl ON p.plan = pl.id
    WHERE p.id = u_id;

    -- 2. SICUREZZA: Se non trova il piano, blocca
    IF plan_limit IS NULL THEN RETURN FALSE; END IF;

    -- 3. LOGICA SCADENZA: 
    -- Se il piano non è 'free' E la data di scadenza esiste ed è passata -> BLOCCO
    IF current_plan_id <> 'free' AND expiration_date IS NOT NULL AND expiration_date < NOW() THEN
        RETURN FALSE;
    END IF;

    -- 4. LOGICA STORAGE:
    -- Ritorna TRUE solo se c'è spazio sufficiente (sommando il nuovo file)
    RETURN (COALESCE(current_usage, 0) + new_file_size) <= plan_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_is_participant_secure(lookup_trip_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM trip_participants 
    WHERE trip_id = lookup_trip_id 
    AND user_id = auth.uid()
  );
$function$
;

CREATE OR REPLACE FUNCTION public.check_is_trip_owner(t_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.trips
    WHERE id = t_id AND owner_id = auth.uid()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_is_trip_participant(t_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.trip_participants
    WHERE trip_id = t_id AND user_id = auth.uid()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_unique_username(raw_first_name text, raw_last_name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  base_part text;
  final_username text;
  rnd_num integer;
  is_taken boolean;
BEGIN
  -- A. Pulizia input: 
  -- 1. Coalesce: se è null diventa stringa vuota
  -- 2. Lower: tutto minuscolo
  -- 3. Regexp: rimuove tutto ciò che non è lettere o numeri
  raw_first_name := REGEXP_REPLACE(LOWER(COALESCE(raw_first_name, 'user')), '[^a-z0-9]', '', 'g');
  raw_last_name := REGEXP_REPLACE(LOWER(COALESCE(raw_last_name, '')), '[^a-z0-9]', '', 'g');

  -- B. Costruzione base (gestisce casi senza cognome)
  IF length(raw_last_name) > 0 THEN
    base_part := raw_first_name || '_' || raw_last_name;
  ELSE
    base_part := raw_first_name;
  END IF;

  -- Se la stringa base è vuota (es. utente non ha messo nome), usa 'user'
  IF length(base_part) < 1 THEN
    base_part := 'user';
  END IF;

  -- C. Loop per trovare univocità
  LOOP
    -- Genera numero tra 1000 e 9999
    rnd_num := floor(random() * 9000 + 1000)::int;
    final_username := base_part || '_' || rnd_num;

    -- Controlla se esiste
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE username = final_username) INTO is_taken;

    -- Se non è preso, esci dal loop
    EXIT WHEN NOT is_taken;
  END LOOP;

  RETURN final_username;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_private_profile()
 RETURNS TABLE(id uuid, first_name text, last_name text, username text, email text, plan text, expiration_plan_date timestamp with time zone, total_trips_created integer, total_storage_used_in_bytes bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    p.total_storage_used_in_bytes
  FROM public.profiles p
  WHERE p.id = auth.uid(); -- Filtra rigorosamente: restituisce solo i TUOI dati
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    username -- <--- Inseriamo il campo calcolato
  )
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name',
    -- Chiamiamo la funzione generatrice
    generate_unique_username(
      (new.raw_user_meta_data->>'first_name')::text,
      (new.raw_user_meta_data->>'last_name')::text
    )
  );
  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.search_users(search_term text)
 RETURNS TABLE(uid uuid, email text, first_name text, last_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Controllo di sicurezza interno: se non c'è un UID di sessione, non restituire nulla
    IF auth.uid() IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        id as uid, 
        profiles.email, 
        profiles.first_name, 
        profiles.last_name
    FROM profiles
    WHERE 
        (profiles.email ILIKE '%' || search_term || '%' OR 
         profiles.first_name ILIKE '%' || search_term || '%' OR 
         profiles.last_name ILIKE '%' || search_term || '%')
        AND id != auth.uid() -- Esclude chi sta cercando dai risultati
    LIMIT 10;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_trip_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.profiles 
        SET total_trips_created = total_trips_created + 1 
        WHERE id = NEW.owner_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles 
        SET total_trips_created = total_trips_created - 1 
        WHERE id = OLD.owner_id;
    END IF;
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_storage_on_attachment_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_owner_id UUID;
BEGIN
    -- 1. Troviamo l'owner_id del viaggio a cui appartiene l'allegato
    IF (TG_OP = 'INSERT') THEN
        SELECT owner_id INTO v_owner_id FROM trips WHERE id = NEW.trip_id;
        
        -- Aggiorniamo il profilo sommando la dimensione
        UPDATE profiles 
        SET total_storage_used_in_bytes = COALESCE(total_storage_used_in_bytes, 0) + NEW.size_in_bytes
        WHERE id = v_owner_id;
        
    ELSIF (TG_OP = 'DELETE') THEN
        SELECT owner_id INTO v_owner_id FROM trips WHERE id = OLD.trip_id;
        
        -- Sottraiamo la dimensione (evitando di andare sotto zero)
        UPDATE profiles 
        SET total_storage_used_in_bytes = GREATEST(0, COALESCE(total_storage_used_in_bytes, 0) - OLD.size_in_bytes)
        WHERE id = v_owner_id;
    END IF;
    
    RETURN NULL;
END;
$function$
;

grant delete on table "public"."accommodations" to "anon";

grant insert on table "public"."accommodations" to "anon";

grant references on table "public"."accommodations" to "anon";

grant select on table "public"."accommodations" to "anon";

grant trigger on table "public"."accommodations" to "anon";

grant truncate on table "public"."accommodations" to "anon";

grant update on table "public"."accommodations" to "anon";

grant delete on table "public"."accommodations" to "authenticated";

grant insert on table "public"."accommodations" to "authenticated";

grant references on table "public"."accommodations" to "authenticated";

grant select on table "public"."accommodations" to "authenticated";

grant trigger on table "public"."accommodations" to "authenticated";

grant truncate on table "public"."accommodations" to "authenticated";

grant update on table "public"."accommodations" to "authenticated";

grant delete on table "public"."accommodations" to "service_role";

grant insert on table "public"."accommodations" to "service_role";

grant references on table "public"."accommodations" to "service_role";

grant select on table "public"."accommodations" to "service_role";

grant trigger on table "public"."accommodations" to "service_role";

grant truncate on table "public"."accommodations" to "service_role";

grant update on table "public"."accommodations" to "service_role";

grant delete on table "public"."attachments" to "anon";

grant insert on table "public"."attachments" to "anon";

grant references on table "public"."attachments" to "anon";

grant select on table "public"."attachments" to "anon";

grant trigger on table "public"."attachments" to "anon";

grant truncate on table "public"."attachments" to "anon";

grant update on table "public"."attachments" to "anon";

grant delete on table "public"."attachments" to "authenticated";

grant insert on table "public"."attachments" to "authenticated";

grant references on table "public"."attachments" to "authenticated";

grant select on table "public"."attachments" to "authenticated";

grant trigger on table "public"."attachments" to "authenticated";

grant truncate on table "public"."attachments" to "authenticated";

grant update on table "public"."attachments" to "authenticated";

grant delete on table "public"."attachments" to "service_role";

grant insert on table "public"."attachments" to "service_role";

grant references on table "public"."attachments" to "service_role";

grant select on table "public"."attachments" to "service_role";

grant trigger on table "public"."attachments" to "service_role";

grant truncate on table "public"."attachments" to "service_role";

grant update on table "public"."attachments" to "service_role";

grant delete on table "public"."plans" to "anon";

grant insert on table "public"."plans" to "anon";

grant references on table "public"."plans" to "anon";

grant select on table "public"."plans" to "anon";

grant trigger on table "public"."plans" to "anon";

grant truncate on table "public"."plans" to "anon";

grant update on table "public"."plans" to "anon";

grant delete on table "public"."plans" to "authenticated";

grant insert on table "public"."plans" to "authenticated";

grant references on table "public"."plans" to "authenticated";

grant select on table "public"."plans" to "authenticated";

grant trigger on table "public"."plans" to "authenticated";

grant truncate on table "public"."plans" to "authenticated";

grant update on table "public"."plans" to "authenticated";

grant delete on table "public"."plans" to "service_role";

grant insert on table "public"."plans" to "service_role";

grant references on table "public"."plans" to "service_role";

grant select on table "public"."plans" to "service_role";

grant trigger on table "public"."plans" to "service_role";

grant truncate on table "public"."plans" to "service_role";

grant update on table "public"."plans" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."stages" to "anon";

grant insert on table "public"."stages" to "anon";

grant references on table "public"."stages" to "anon";

grant select on table "public"."stages" to "anon";

grant trigger on table "public"."stages" to "anon";

grant truncate on table "public"."stages" to "anon";

grant update on table "public"."stages" to "anon";

grant delete on table "public"."stages" to "authenticated";

grant insert on table "public"."stages" to "authenticated";

grant references on table "public"."stages" to "authenticated";

grant select on table "public"."stages" to "authenticated";

grant trigger on table "public"."stages" to "authenticated";

grant truncate on table "public"."stages" to "authenticated";

grant update on table "public"."stages" to "authenticated";

grant delete on table "public"."stages" to "service_role";

grant insert on table "public"."stages" to "service_role";

grant references on table "public"."stages" to "service_role";

grant select on table "public"."stages" to "service_role";

grant trigger on table "public"."stages" to "service_role";

grant truncate on table "public"."stages" to "service_role";

grant update on table "public"."stages" to "service_role";

grant delete on table "public"."transports" to "anon";

grant insert on table "public"."transports" to "anon";

grant references on table "public"."transports" to "anon";

grant select on table "public"."transports" to "anon";

grant trigger on table "public"."transports" to "anon";

grant truncate on table "public"."transports" to "anon";

grant update on table "public"."transports" to "anon";

grant delete on table "public"."transports" to "authenticated";

grant insert on table "public"."transports" to "authenticated";

grant references on table "public"."transports" to "authenticated";

grant select on table "public"."transports" to "authenticated";

grant trigger on table "public"."transports" to "authenticated";

grant truncate on table "public"."transports" to "authenticated";

grant update on table "public"."transports" to "authenticated";

grant delete on table "public"."transports" to "service_role";

grant insert on table "public"."transports" to "service_role";

grant references on table "public"."transports" to "service_role";

grant select on table "public"."transports" to "service_role";

grant trigger on table "public"."transports" to "service_role";

grant truncate on table "public"."transports" to "service_role";

grant update on table "public"."transports" to "service_role";

grant delete on table "public"."trip_participants" to "anon";

grant insert on table "public"."trip_participants" to "anon";

grant references on table "public"."trip_participants" to "anon";

grant select on table "public"."trip_participants" to "anon";

grant trigger on table "public"."trip_participants" to "anon";

grant truncate on table "public"."trip_participants" to "anon";

grant update on table "public"."trip_participants" to "anon";

grant delete on table "public"."trip_participants" to "authenticated";

grant insert on table "public"."trip_participants" to "authenticated";

grant references on table "public"."trip_participants" to "authenticated";

grant select on table "public"."trip_participants" to "authenticated";

grant trigger on table "public"."trip_participants" to "authenticated";

grant truncate on table "public"."trip_participants" to "authenticated";

grant update on table "public"."trip_participants" to "authenticated";

grant delete on table "public"."trip_participants" to "service_role";

grant insert on table "public"."trip_participants" to "service_role";

grant references on table "public"."trip_participants" to "service_role";

grant select on table "public"."trip_participants" to "service_role";

grant trigger on table "public"."trip_participants" to "service_role";

grant truncate on table "public"."trip_participants" to "service_role";

grant update on table "public"."trip_participants" to "service_role";

grant delete on table "public"."trips" to "anon";

grant insert on table "public"."trips" to "anon";

grant references on table "public"."trips" to "anon";

grant select on table "public"."trips" to "anon";

grant trigger on table "public"."trips" to "anon";

grant truncate on table "public"."trips" to "anon";

grant update on table "public"."trips" to "anon";

grant delete on table "public"."trips" to "authenticated";

grant insert on table "public"."trips" to "authenticated";

grant references on table "public"."trips" to "authenticated";

grant select on table "public"."trips" to "authenticated";

grant trigger on table "public"."trips" to "authenticated";

grant truncate on table "public"."trips" to "authenticated";

grant update on table "public"."trips" to "authenticated";

grant delete on table "public"."trips" to "service_role";

grant insert on table "public"."trips" to "service_role";

grant references on table "public"."trips" to "service_role";

grant select on table "public"."trips" to "service_role";

grant trigger on table "public"."trips" to "service_role";

grant truncate on table "public"."trips" to "service_role";

grant update on table "public"."trips" to "service_role";


  create policy "Accommodations_Owner_Delete"
  on "public"."accommodations"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = accommodations.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Accommodations_Owner_Insert"
  on "public"."accommodations"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = accommodations.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Accommodations_Owner_Update"
  on "public"."accommodations"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = accommodations.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Select_Accommodations"
  on "public"."accommodations"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.trips t
  WHERE ((t.id = accommodations.trip_id) AND ((t.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_participants tp
          WHERE ((tp.trip_id = t.id) AND (tp.user_id = auth.uid())))))))));



  create policy "Owner_Can_Delete_Attachments"
  on "public"."attachments"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = attachments.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Owner_Can_Insert_Attachments"
  on "public"."attachments"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = attachments.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Owner_Can_Update_Attachments"
  on "public"."attachments"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = attachments.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Users can view attachments of their trips"
  on "public"."attachments"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = attachments.trip_id) AND ((trips.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_participants
          WHERE ((trip_participants.trip_id = trips.id) AND (trip_participants.user_id = auth.uid())))))))));



  create policy "Plans are publicly viewable"
  on "public"."plans"
  as permissive
  for select
  to public
using (true);



  create policy "Public_View_Access"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Self_Delete_Access"
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = id));



  create policy "Self_Update_Access"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Select_Stages"
  on "public"."stages"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.trips t
  WHERE ((t.id = stages.trip_id) AND ((t.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_participants tp
          WHERE ((tp.trip_id = t.id) AND (tp.user_id = auth.uid())))))))));



  create policy "Stages_Owner_Delete"
  on "public"."stages"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = stages.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Stages_Owner_Insert"
  on "public"."stages"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = stages.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Stages_Owner_Update"
  on "public"."stages"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = stages.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Select_Transports_Access"
  on "public"."transports"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.trips t
  WHERE ((t.id = transports.trip_id) AND ((t.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.trip_participants tp
          WHERE ((tp.trip_id = t.id) AND (tp.user_id = auth.uid())))))))));



  create policy "Transports_Owner_Delete"
  on "public"."transports"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = transports.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Transports_Owner_Insert"
  on "public"."transports"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = transports.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Transports_Owner_Update"
  on "public"."transports"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = transports.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Gli owner possono gestire i partecipanti"
  on "public"."trip_participants"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = trip_participants.trip_id) AND (trips.owner_id = auth.uid())))));



  create policy "Participants_Visibility_Final"
  on "public"."trip_participants"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.trips
  WHERE ((trips.id = trip_participants.trip_id) AND (trips.owner_id = auth.uid())))) OR public.check_is_participant_secure(trip_id)));



  create policy "Insert_Trips"
  on "public"."trips"
  as permissive
  for insert
  to public
with check ((auth.uid() = owner_id));



  create policy "Select_Trips"
  on "public"."trips"
  as permissive
  for select
  to public
using (((auth.uid() = owner_id) OR public.check_is_trip_participant(id)));



  create policy "Update_Delete_Trips"
  on "public"."trips"
  as permissive
  for all
  to public
using ((auth.uid() = owner_id));


CREATE TRIGGER tr_update_storage_on_attachment AFTER INSERT OR DELETE ON public.attachments FOR EACH ROW EXECUTE FUNCTION public.update_user_storage_on_attachment_change();

CREATE TRIGGER on_trip_change AFTER INSERT OR DELETE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_trip_count();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Access Attachments"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'attachments'::text));



  create policy "Delete Own Attachments"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'attachments'::text) AND (auth.uid() = owner)));



  create policy "Secure Upload"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'attachments'::text) AND public.can_user_upload(auth.uid(), ((metadata ->> 'size'::text))::bigint)));



  create policy "Upload Policy"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'attachments'::text) AND (((metadata ->> 'mimetype'::text) ~~* 'image/%'::text) OR ((metadata ->> 'mimetype'::text) = 'application/pdf'::text) OR ((metadata ->> 'mimetype'::text) IS NULL)) AND public.can_user_upload(auth.uid(), COALESCE(((metadata ->> 'size'::text))::bigint, (0)::bigint))));



