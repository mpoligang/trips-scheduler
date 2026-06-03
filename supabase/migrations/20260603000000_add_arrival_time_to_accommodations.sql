-- Aggiunge il campo "orario di arrivo" agli alloggi.
-- Memorizzato come testo nel formato HH:mm (es. "14:30"), coerente con il TimeInput del form.
alter table "public"."accommodations"
    add column "arrival_time" text;
