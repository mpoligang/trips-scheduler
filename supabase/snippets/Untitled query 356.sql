CREATE POLICY "Accesso allegati per partecipanti e proprietari"
ON storage.objects
FOR SELECT -- Applica il controllo alla lettura/download
TO authenticated
USING (
  bucket_id = 'attachments' -- Sostituisci con il nome reale del tuo bucket
  AND (
    EXISTS (
      SELECT 1 FROM public.attachments a
      JOIN public.trips t ON a.trip_id = t.id
      LEFT JOIN public.trip_participants p ON a.trip_id = p.trip_id
      WHERE 
        -- Il file nello storage corrisponde al record nel DB (usando il path)
        a.storage_path = storage.objects.name
        AND (
          -- L'utente è il proprietario del viaggio
          t.owner_id = auth.uid() 
          OR 
          -- L'utente è un partecipante del viaggio
          p.user_id = auth.uid()
        )
    )
  )
);