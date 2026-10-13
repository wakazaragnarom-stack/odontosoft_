"""Google Calendar opcional para la agenda compartida de la clínica."""
import logging
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)
TIMEZONE = ZoneInfo(os.getenv("GOOGLE_CALENDAR_TIMEZONE", "America/Bogota"))


def _service():
    credentials_file = os.getenv("GOOGLE_CALENDAR_CREDENTIALS_FILE", "").strip()
    calendar_id = os.getenv("GOOGLE_CALENDAR_ID", "").strip()
    if not credentials_file or not calendar_id:
        return None, None
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        credentials = service_account.Credentials.from_service_account_file(
            credentials_file, scopes=["https://www.googleapis.com/auth/calendar"]
        )
        return build("calendar", "v3", credentials=credentials, cache_discovery=False), calendar_id
    except Exception:
        logger.exception("No fue posible inicializar Google Calendar")
        return None, None


def _body(cita, odontologo, paciente, consultorio):
    start = datetime.combine(cita.fecha, cita.hora).replace(tzinfo=TIMEZONE)
    end = start + timedelta(minutes=max(5, int(os.getenv("GOOGLE_CALENDAR_APPOINTMENT_MINUTES", "30"))))
    body = {
        "summary": f"Cita odontológica — {odontologo.nombre} {odontologo.apellido}",
        "description": (
            f"Paciente: {paciente.nombre} {getattr(paciente, 'apellido', '')}\n"
            f"Estado: {cita.estado or 'Pendiente'}\n"
            "Consulta la información clínica únicamente en OdontoSoft."
        ),
        "start": {"dateTime": start.isoformat(), "timeZone": str(TIMEZONE)},
        "end": {"dateTime": end.isoformat(), "timeZone": str(TIMEZONE)},
        "extendedProperties": {"private": {"odontosoft_cita_id": str(cita.id_cita)}},
    }
    if getattr(consultorio, "nombre", None):
        body["location"] = consultorio.nombre
    return body


def create_event(cita, odontologo, paciente, consultorio):
    service, calendar_id = _service()
    if service is None:
        return None
    try:
        return service.events().insert(
            calendarId=calendar_id, body=_body(cita, odontologo, paciente, consultorio),
            sendUpdates="none",
        ).execute().get("id")
    except Exception:
        logger.exception("Error creando evento de Calendar para cita %s", cita.id_cita)
        return None


def update_event(event_id, cita, odontologo, paciente, consultorio):
    service, calendar_id = _service()
    if service is None or not event_id:
        return None
    try:
        return service.events().update(
            calendarId=calendar_id, eventId=event_id,
            body=_body(cita, odontologo, paciente, consultorio), sendUpdates="none",
        ).execute().get("id")
    except Exception:
        logger.exception("Error actualizando evento de Calendar para cita %s", cita.id_cita)
        return None


def delete_event(event_id):
    service, calendar_id = _service()
    if service is None or not event_id:
        return False
    try:
        service.events().delete(calendarId=calendar_id, eventId=event_id, sendUpdates="none").execute()
        return True
    except Exception:
        logger.exception("Error eliminando evento de Google Calendar")
        return False
