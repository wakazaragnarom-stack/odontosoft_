-- Ejecutar una sola vez en la base de datos de OdontoSoft.
BEGIN;
ALTER TABLE public.cita ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS ix_cita_google_calendar_event_id
    ON public.cita (google_calendar_event_id)
    WHERE google_calendar_event_id IS NOT NULL;
COMMIT;
