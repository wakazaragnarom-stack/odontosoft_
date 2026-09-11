# ============================================================
# CITAS.PY - CRUD COMPLETO DE CITAS (CON NOTIFICACIONES DE CORREO)
# ============================================================
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    BackgroundTasks
)

from sqlalchemy.orm import (
    Session,
    selectinload
)

from typing import List

import models
import schemas
from database import get_db
from notifications import NotificationService


router = APIRouter(
    prefix="/citas",
    tags=["Citas"]
)


# ============================================================
# OBTENER TODAS LAS CITAS
# ============================================================

@router.get(
    "/",
    response_model=List[schemas.CitaOut]
)
def get_citas(
    db: Session = Depends(get_db)
):
    citas = (
        db.query(models.Cita)
        .options(
            selectinload(models.Cita.tratamientos),
            selectinload(models.Cita.odontologo)
        )
        .all()
    )
    return citas


# ============================================================
# OBTENER UNA CITA
# ============================================================

@router.get(
    "/{id}",
    response_model=schemas.CitaOut
)
def get_cita(
    id: int,
    db: Session = Depends(get_db)
):
    cita = (
        db.query(models.Cita)
        .options(
            selectinload(models.Cita.tratamientos),
            selectinload(models.Cita.odontologo)
        )
        .filter(models.Cita.id_cita == id)
        .first()
    )

    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )

    return cita


# ============================================================
# CITAS POR PACIENTE
# ============================================================

@router.get(
    "/paciente/{paciente_id}",
    response_model=List[schemas.CitaOut]
)
def get_citas_por_paciente(
    paciente_id: int,
    db: Session = Depends(get_db)
):
    citas = (
        db.query(models.Cita)
        .options(
            selectinload(models.Cita.tratamientos),
            selectinload(models.Cita.odontologo)
        )
        .filter(models.Cita.id_paciente == paciente_id)
        .all()
    )
    return citas


# ============================================================
# CITAS POR ODONTÓLOGO
# ============================================================

@router.get(
    "/odontologo/{odontologo_id}",
    response_model=List[schemas.CitaOut]
)
def get_citas_por_odontologo(
    odontologo_id: int,
    db: Session = Depends(get_db)
):
    citas = (
        db.query(models.Cita)
        .options(
            selectinload(models.Cita.tratamientos),
            selectinload(models.Cita.odontologo)
        )
        .filter(models.Cita.id_odontologo == odontologo_id)
        .all()
    )
    return citas


# ============================================================
# CITAS POR CONSULTORIO
# ============================================================

@router.get(
    "/consultorio/{consultorio_id}",
    response_model=List[schemas.CitaOut]
)
def get_citas_por_consultorio(
    consultorio_id: int,
    db: Session = Depends(get_db)
):
    citas = (
        db.query(models.Cita)
        .options(
            selectinload(models.Cita.tratamientos),
            selectinload(models.Cita.odontologo)
        )
        .filter(models.Cita.id_consultorio == consultorio_id)
        .all()
    )
    return citas


# ============================================================
# CREAR CITA (CON ENVÍO DE CORREO)
# ============================================================

@router.post(
    "/",
    response_model=schemas.CitaOut,
    status_code=status.HTTP_201_CREATED
)
def create_cita(
    data: schemas.CitaCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # --------------------------------------------------------
    # VALIDAR PACIENTE
    # --------------------------------------------------------
    paciente = (
        db.query(models.Paciente)
        .filter(models.Paciente.id_paciente == data.id_paciente)
        .first()
    )

    if not paciente:
        raise HTTPException(
            status_code=400,
            detail="El paciente no existe"
        )

    # --------------------------------------------------------
    # VALIDAR ODONTÓLOGO
    # --------------------------------------------------------
    odontologo = (
        db.query(models.Odontologo)
        .filter(models.Odontologo.id_odontologo == data.id_odontologo)
        .first()
    )

    if not odontologo:
        raise HTTPException(
            status_code=400,
            detail="El odontólogo no existe"
        )

    # --------------------------------------------------------
    # VALIDAR CONSULTORIO
    # --------------------------------------------------------
    consultorio = (
        db.query(models.Consultorio)
        .filter(models.Consultorio.id_consultorio == data.id_consultorio)
        .first()
    )

    if not consultorio:
        raise HTTPException(
            status_code=400,
            detail="El consultorio no existe"
        )

    # --------------------------------------------------------
    # CREAR CITA EN BD
    # --------------------------------------------------------
    nueva = models.Cita(**data.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    # --------------------------------------------------------
    # DEVOLVER CITA CON RELACIONES
    # --------------------------------------------------------
    cita_creada = (
        db.query(models.Cita)
        .options(
            selectinload(models.Cita.tratamientos),
            selectinload(models.Cita.odontologo)
        )
        .filter(models.Cita.id_cita == nueva.id_cita)
        .first()
    )


    # --------------------------------------------------------
    # DISPARO AUTOMÁTICO DE NOTIFICACIÓN POR CORREO
    # --------------------------------------------------------
    correo_paciente = getattr(paciente, "correo", getattr(paciente, "email", None))
    nombre_paciente = getattr(paciente, "nombre", "Paciente")

    if correo_paciente:
        fecha_str = str(getattr(cita_creada, "fecha", "Fecha por confirmar"))
        hora_str = str(getattr(cita_creada, "hora", "Hora por confirmar"))

        asunto = "Confirmación de Cita Odontológica - OdontoSoft"
        cuerpo_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
            <h2 style="color: #2b6cb0; text-align: center;">OdontoSoft</h2>
            <hr style="border: none; border-top: 1px solid #eee;">
            <p>Hola <strong>{nombre_paciente}</strong>,</p>
            <p>¡Tu cita odontológica ha sido agendada con éxito!</p>
            <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Fecha:</strong> {fecha_str}</p>
                <p style="margin: 5px 0;"><strong>Hora:</strong> {hora_str}</p>
            </div>
            <p>Por favor preséntate 10 minutos antes de la hora programada.</p>
            <br>
            <p style="font-size: 12px; color: #718096; text-align: center;">Este es un mensaje automático, por favor no respondas a este correo.</p>
        </div>
        """

        background_tasks.add_task(
            NotificationService.send_email,
            correo_paciente,
            asunto,
            cuerpo_html
        )

    # 🟢 ÚNICO RETURN AL FINAL DE LA FUNCIÓN
    return cita_creada


# ============================================================
# ACTUALIZAR CITA
# ============================================================

@router.put(
    "/{id}",
    response_model=schemas.CitaOut
)
def update_cita(
    id: int,
    data: schemas.CitaUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    cita = (
        db.query(models.Cita)
        .options(
            selectinload(models.Cita.tratamientos),
            selectinload(models.Cita.odontologo)
        )
        .filter(models.Cita.id_cita == id)
        .first()
    )

    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )

    update_data = data.model_dump(exclude_unset=True)

    # VALIDAR PACIENTE
    if "id_paciente" in update_data:
        paciente = (
            db.query(models.Paciente)
            .filter(models.Paciente.id_paciente == update_data["id_paciente"])
            .first()
        )
        if not paciente:
            raise HTTPException(status_code=400, detail="El paciente no existe")

    # VALIDAR ODONTÓLOGO
    if "id_odontologo" in update_data:
        odontologo = (
            db.query(models.Odontologo)
            .filter(models.Odontologo.id_odontologo == update_data["id_odontologo"])
            .first()
        )
        if not odontologo:
            raise HTTPException(status_code=400, detail="El odontólogo no existe")

    # VALIDAR CONSULTORIO
    if "id_consultorio" in update_data:
        consultorio = (
            db.query(models.Consultorio)
            .filter(models.Consultorio.id_consultorio == update_data["id_consultorio"])
            .first()
        )
        if not consultorio:
            raise HTTPException(status_code=400, detail="El consultorio no existe")

    # ACTUALIZAR CAMPOS
    for key, value in update_data.items():
        setattr(cita, key, value)

    db.commit()

    # DEVOLVER CITA ACTUALIZADA
    cita_actualizada = (
        db.query(models.Cita)
        .options(
            selectinload(models.Cita.tratamientos),
            selectinload(models.Cita.odontologo)
        )
        .filter(models.Cita.id_cita == id)
        .first()
    )

    # REENVIAR NOTIFICACIÓN SI CAMBIÓ LA CITA
    paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == cita_actualizada.id_paciente).first()
    if paciente:
        correo_paciente = getattr(paciente, "correo", getattr(paciente, "email", None))
        if correo_paciente:
            asunto = "Actualización de Cita - OdontoSoft"
            cuerpo_html = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>OdontoSoft</h2>
                <p>Hola, los datos de tu cita han sido actualizados exitosamente.</p>
                <p><strong>Nueva Fecha:</strong> {cita_actualizada.fecha}</p>
                <p><strong>Nueva Hora:</strong> {cita_actualizada.hora}</p>
            </div>
            """
            background_tasks.add_task(
                NotificationService.send_email,
                correo_paciente,
                asunto,
                cuerpo_html
            )

    return cita_actualizada


# ============================================================
# ELIMINAR CITA
# ============================================================

@router.delete("/{id}")
def delete_cita(
    id: int,
    db: Session = Depends(get_db)
):
    cita = (
        db.query(models.Cita)
        .filter(models.Cita.id_cita == id)
        .first()
    )

    if not cita:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cita no encontrada"
        )

    db.delete(cita)
    db.commit()

    return {
        "mensaje": "Cita eliminada correctamente",
        "id_cita": id
    }


# ============================================================
# OBTENER TRATAMIENTOS DE UNA CITA
# ============================================================

@router.get(
    "/{cita_id}/tratamientos",
    response_model=List[schemas.TratamientoOut]
)
def get_tratamientos_de_cita(
    cita_id: int,
    db: Session = Depends(get_db)
):
    cita = (
        db.query(models.Cita)
        .options(selectinload(models.Cita.tratamientos))
        .filter(models.Cita.id_cita == cita_id)
        .first()
    )

    if not cita:
        raise HTTPException(
            status_code=404,
            detail="Cita no encontrada"
        )

    return cita.tratamientos


# ============================================================
# ASOCIAR TRATAMIENTO A UNA CITA
# ============================================================

@router.post("/{cita_id}/tratamientos/{tratamiento_id}")
def asociar_tratamiento(
    cita_id: int,
    tratamiento_id: int,
    db: Session = Depends(get_db)
):
    cita = db.query(models.Cita).filter(models.Cita.id_cita == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    tratamiento = db.query(models.Tratamiento).filter(models.Tratamiento.id_tratamiento == tratamiento_id).first()
    if not tratamiento:
        raise HTTPException(status_code=404, detail="Tratamiento no encontrado")

    if tratamiento in cita.tratamientos:
        raise HTTPException(status_code=409, detail="El tratamiento ya está asociado a esta cita")

    cita.tratamientos.append(tratamiento)
    db.commit()
    db.refresh(cita)

    return {
        "mensaje": "Tratamiento asociado correctamente",
        "id_cita": cita_id,
        "id_tratamiento": tratamiento_id
    }


# ============================================================
# ACTUALIZAR TRATAMIENTO DE UNA CITA
# ============================================================

@router.put("/{cita_id}/tratamientos/{tratamiento_id}")
def actualizar_tratamiento(
    cita_id: int,
    tratamiento_id: int,
    db: Session = Depends(get_db)
):
    cita = db.query(models.Cita).filter(models.Cita.id_cita == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    tratamiento = db.query(models.Tratamiento).filter(models.Tratamiento.id_tratamiento == tratamiento_id).first()
    if not tratamiento:
        raise HTTPException(status_code=404, detail="Tratamiento no encontrado")

    cita.tratamientos.clear()
    cita.tratamientos.append(tratamiento)

    db.commit()
    db.refresh(cita)

    return {
        "mensaje": "Tratamiento actualizado correctamente",
        "id_cita": cita_id,
        "id_tratamiento": tratamiento_id
    }


# ============================================================
# ELIMINAR TRATAMIENTO DE UNA CITA
# ============================================================

@router.delete("/{cita_id}/tratamientos/{tratamiento_id}")
def eliminar_tratamiento(
    cita_id: int,
    tratamiento_id: int,
    db: Session = Depends(get_db)
):
    cita = db.query(models.Cita).filter(models.Cita.id_cita == cita_id).first()
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")

    tratamiento = db.query(models.Tratamiento).filter(models.Tratamiento.id_tratamiento == tratamiento_id).first()
    if not tratamiento:
        raise HTTPException(status_code=404, detail="Tratamiento no encontrado")

    if tratamiento not in cita.tratamientos:
        raise HTTPException(status_code=404, detail="El tratamiento no está asociado a esta cita")

    cita.tratamientos.remove(tratamiento)
    db.commit()

    return {
        "mensaje": "Tratamiento eliminado de la cita",
        "id_cita": cita_id,
        "id_tratamiento": tratamiento_id
    }