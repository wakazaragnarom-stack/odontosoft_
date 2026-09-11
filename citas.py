# ============================================================
# CITAS.PY - CRUD COMPLETO DE CITAS (CON NOTIFICACIONES DE CORREO)
# ============================================================
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, selectinload
from typing import List
import models
import schemas
from database import get_db
from notifications import NotificationService
from security import dentist_id_for_user, require_appointment_resource, require_patient_resource, require_roles, require_staff

router = APIRouter(prefix="/citas", tags=["Citas"])

ESTADOS_CITA = {"Pendiente", "Confirmada", "Llegó", "En curso", "Completada", "Cancelada", "No asistió"}
TRANSICIONES_CITA = {
    "Pendiente": {"Confirmada", "Cancelada"},
    "Confirmada": {"Llegó", "Cancelada"},
    "Llegó": {"En curso", "Cancelada"},
    "En curso": {"Completada", "Cancelada"},
    "Completada": set(),
    "Cancelada": set(),
    "No asistió": set(),
}


def _require_dentist_appointment_owner(user: dict, db: Session, appointment: models.Cita) -> None:
    if user["role"] == "dentist" and dentist_id_for_user(db, user) != int(appointment.id_odontologo):
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")


@router.get("/", response_model=List[schemas.CitaOut])
def get_citas(db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    query = db.query(models.Cita).options(selectinload(models.Cita.tratamientos), selectinload(models.Cita.odontologo))
    if user["role"] == "dentist":
        dentist_id = dentist_id_for_user(db, user)
        if dentist_id is None:
            return []
        query = query.filter(models.Cita.id_odontologo == dentist_id)
    return query.all()


@router.get("/{id}", response_model=schemas.CitaOut)
def get_cita(id: int, db: Session = Depends(get_db), _user: dict = Depends(require_appointment_resource("id"))):
    cita = db.query(models.Cita).options(selectinload(models.Cita.tratamientos), selectinload(models.Cita.odontologo)).filter(models.Cita.id_cita == id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return cita


@router.get("/paciente/{paciente_id}", response_model=List[schemas.CitaOut])
def get_citas_por_paciente(paciente_id: int, db: Session = Depends(get_db), _user: dict = Depends(require_patient_resource("paciente_id"))):
    return db.query(models.Cita).options(selectinload(models.Cita.tratamientos), selectinload(models.Cita.odontologo)).filter(models.Cita.id_paciente == paciente_id).all()


@router.get("/odontologo/{odontologo_id}", response_model=List[schemas.CitaOut])
def get_citas_por_odontologo(odontologo_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    if user["role"] == "dentist" and dentist_id_for_user(db, user) != odontologo_id:
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
    return db.query(models.Cita).options(selectinload(models.Cita.tratamientos), selectinload(models.Cita.odontologo)).filter(models.Cita.id_odontologo == odontologo_id).all()


@router.get("/consultorio/{consultorio_id}", response_model=List[schemas.CitaOut])
def get_citas_por_consultorio(consultorio_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    query = db.query(models.Cita).options(selectinload(models.Cita.tratamientos), selectinload(models.Cita.odontologo)).filter(models.Cita.id_consultorio == consultorio_id)
    if user["role"] == "dentist":
        dentist_id = dentist_id_for_user(db, user)
        if dentist_id is None:
            return []
        query = query.filter(models.Cita.id_odontologo == dentist_id)
    return query.all()


@router.post("/", response_model=schemas.CitaOut, status_code=status.HTTP_201_CREATED)
def create_cita(data: schemas.CitaCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == data.id_paciente).first()
    if not paciente:
        raise HTTPException(status_code=400, detail="El paciente no existe")
    odontologo = db.query(models.Odontologo).filter(models.Odontologo.id_odontologo == data.id_odontologo).first()
    if not odontologo:
        raise HTTPException(status_code=400, detail="El odontólogo no existe")
    consultorio = db.query(models.Consultorio).filter(models.Consultorio.id_consultorio == data.id_consultorio).first()
    if not consultorio:
        raise HTTPException(status_code=400, detail="El consultorio no existe")
    if user["role"] == "dentist" and dentist_id_for_user(db, user) != data.id_odontologo:
        raise HTTPException(status_code=403, detail="Un odontólogo solo puede agendar en su propia agenda")
    nueva = models.Cita(**data.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    cita_creada = db.query(models.Cita).options(selectinload(models.Cita.tratamientos), selectinload(models.Cita.odontologo)).filter(models.Cita.id_cita == nueva.id_cita).first()
    correo_paciente = getattr(paciente, "correo", getattr(paciente, "email", None))
    nombre_paciente = getattr(paciente, "nombre", "Paciente")
    if correo_paciente:
        cuerpo_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
            <h2 style="color: #2b6cb0; text-align: center;">OdontoSoft</h2>
            <hr style="border: none; border-top: 1px solid #eee;">
            <p>Hola <strong>{nombre_paciente}</strong>,</p>
            <p>¡Tu cita odontológica ha sido agendada con éxito!</p>
            <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Fecha:</strong> {cita_creada.fecha}</p>
                <p style="margin: 5px 0;"><strong>Hora:</strong> {cita_creada.hora}</p>
            </div>
            <p>Por favor preséntate 10 minutos antes de la hora programada.</p>
        </div>
        """
        background_tasks.add_task(NotificationService.send_email, correo_paciente, "Confirmación de Cita Odontológica - OdontoSoft", cuerpo_html)
    return cita_creada


@router.put("/{id}", response_model=schemas.CitaOut)
def update_cita(id: int, data: schemas.CitaUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    cita = db.query(models.Cita).options(selectinload(models.Cita.tratamientos), selectinload(models.Cita.odontologo)).filter(models.Cita.id_cita == id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    _require_dentist_appointment_owner(user, db, cita)
    update_data = data.model_dump(exclude_unset=True)
    if "id_paciente" in update_data and not db.query(models.Paciente).filter(models.Paciente.id_paciente == update_data["id_paciente"]).first():
        raise HTTPException(status_code=400, detail="El paciente no existe")
    if "id_odontologo" in update_data and not db.query(models.Odontologo).filter(models.Odontologo.id_odontologo == update_data["id_odontologo"]).first():
        raise HTTPException(status_code=400, detail="El odontólogo no existe")
    if "id_consultorio" in update_data and not db.query(models.Consultorio).filter(models.Consultorio.id_consultorio == update_data["id_consultorio"]).first():
        raise HTTPException(status_code=400, detail="El consultorio no existe")
    if user["role"] == "dentist" and "id_odontologo" in update_data and dentist_id_for_user(db, user) != int(update_data["id_odontologo"]):
        raise HTTPException(status_code=403, detail="No puedes reasignar una cita a otro odontólogo")
    for key, value in update_data.items():
        setattr(cita, key, value)
    db.commit()
    cita_actualizada = db.query(models.Cita).options(selectinload(models.Cita.tratamientos), selectinload(models.Cita.odontologo)).filter(models.Cita.id_cita == id).first()
    paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == cita_actualizada.id_paciente).first()
    correo_paciente = getattr(paciente, "correo", getattr(paciente, "email", None)) if paciente else None
    if correo_paciente:
        cuerpo_html = f"""<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>OdontoSoft</h2><p>Los datos de tu cita han sido actualizados.</p><p><strong>Nueva Fecha:</strong> {cita_actualizada.fecha}</p><p><strong>Nueva Hora:</strong> {cita_actualizada.hora}</p></div>"""
        background_tasks.add_task(NotificationService.send_email, correo_paciente, "Actualización de Cita - OdontoSoft", cuerpo_html)
    return cita_actualizada


@router.patch("/{id}/estado", response_model=schemas.CitaOut)
def update_estado_cita(id: int, payload: dict, db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    cita = db.query(models.Cita).options(selectinload(models.Cita.tratamientos), selectinload(models.Cita.odontologo)).filter(models.Cita.id_cita == id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    _require_dentist_appointment_owner(user, db, cita)
    nuevo_estado = str(payload.get("estado", "")).strip()
    if nuevo_estado not in ESTADOS_CITA:
        raise HTTPException(status_code=400, detail="Estado de cita no válido")
    if nuevo_estado != cita.estado and nuevo_estado not in TRANSICIONES_CITA.get(str(cita.estado), set()):
        raise HTTPException(status_code=409, detail="Transición de estado no permitida")
    cita.estado = nuevo_estado
    db.commit()
    db.refresh(cita)
    return cita


@router.delete("/{id}")
def delete_cita(id: int, db: Session = Depends(get_db), user: dict = Depends(require_roles("superadmin", "clinic_admin"))):
    cita = db.query(models.Cita).filter(models.Cita.id_cita == id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    db.delete(cita)
    db.commit()
    return {"mensaje": "Cita eliminada correctamente", "id_cita": id}


@router.get("/{cita_id}/tratamientos", response_model=List[schemas.TratamientoOut])
def get_tratamientos_de_cita(cita_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    cita = db.query(models.Cita).options(selectinload(models.Cita.tratamientos)).filter(models.Cita.id_cita == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    _require_dentist_appointment_owner(user, db, cita)
    return cita.tratamientos


@router.post("/{cita_id}/tratamientos/{tratamiento_id}")
def asociar_tratamiento(cita_id: int, tratamiento_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    cita = db.query(models.Cita).filter(models.Cita.id_cita == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    _require_dentist_appointment_owner(user, db, cita)
    tratamiento = db.query(models.Tratamiento).filter(models.Tratamiento.id_tratamiento == tratamiento_id).first()
    if not tratamiento:
        raise HTTPException(status_code=404, detail="Tratamiento no encontrado")
    if tratamiento in cita.tratamientos:
        raise HTTPException(status_code=409, detail="El tratamiento ya está asociado a esta cita")
    cita.tratamientos.append(tratamiento)
    db.commit()
    db.refresh(cita)
    return {"mensaje": "Tratamiento asociado correctamente", "id_cita": cita_id, "id_tratamiento": tratamiento_id}


@router.put("/{cita_id}/tratamientos/{tratamiento_id}")
def actualizar_tratamiento(cita_id: int, tratamiento_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    cita = db.query(models.Cita).filter(models.Cita.id_cita == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    _require_dentist_appointment_owner(user, db, cita)
    tratamiento = db.query(models.Tratamiento).filter(models.Tratamiento.id_tratamiento == tratamiento_id).first()
    if not tratamiento:
        raise HTTPException(status_code=404, detail="Tratamiento no encontrado")
    cita.tratamientos.clear()
    cita.tratamientos.append(tratamiento)
    db.commit()
    db.refresh(cita)
    return {"mensaje": "Tratamiento actualizado correctamente", "id_cita": cita_id, "id_tratamiento": tratamiento_id}


@router.delete("/{cita_id}/tratamientos/{tratamiento_id}")
def eliminar_tratamiento(cita_id: int, tratamiento_id: int, db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    cita = db.query(models.Cita).filter(models.Cita.id_cita == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    _require_dentist_appointment_owner(user, db, cita)
    tratamiento = db.query(models.Tratamiento).filter(models.Tratamiento.id_tratamiento == tratamiento_id).first()
    if not tratamiento:
        raise HTTPException(status_code=404, detail="Tratamiento no encontrado")
    if tratamiento not in cita.tratamientos:
        raise HTTPException(status_code=404, detail="El tratamiento no está asociado a esta cita")
    cita.tratamientos.remove(tratamiento)
    db.commit()
    return {"mensaje": "Tratamiento eliminado de la cita", "id_cita": cita_id, "id_tratamiento": tratamiento_id}
