# routers/pacientes.py
# ============================================================
# CRUD COMPLETO DE PACIENTES - ODONTOSOFT
# ============================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models
import schemas

from database import get_db
from security import require_patient_resource, require_staff

router = APIRouter(prefix="/pacientes", tags=["Pacientes"])


@router.get("/", response_model=List[schemas.PacienteOut])
def get_pacientes(
    db: Session = Depends(get_db),
    _user: dict = Depends(require_staff()),
):
    try:
        pacientes = (
            db.query(models.Paciente)
            .join(models.usuario_paciente, models.usuario_paciente.c.id_paciente == models.Paciente.id_paciente)
            .join(models.Usuario, models.Usuario.id_usuario == models.usuario_paciente.c.id_usuario)
            .filter(models.Usuario.rol == "Paciente", models.Usuario.estado == "Activo")
            .distinct()
            .all()
        )
        return pacientes
    except Exception as e:
        print(f"❌ Error al obtener pacientes: {str(e)}")
        raise HTTPException(status_code=500, detail="Error al obtener pacientes")


@router.get("/{id}", response_model=schemas.PacienteOut)
def get_paciente(
    id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_patient_resource("id")),
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == id).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")
    return paciente


@router.get("/documento/{documento}", response_model=schemas.PacienteOut)
def get_paciente_by_documento(
    documento: str,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_staff()),
):
    paciente = db.query(models.Paciente).filter(models.Paciente.documento == documento).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")
    return paciente


@router.post("/", response_model=schemas.PacienteOut, status_code=status.HTTP_201_CREATED)
def create_paciente(
    data: schemas.PacienteCreate,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_staff()),
):
    paciente_existente = db.query(models.Paciente).filter(models.Paciente.documento == data.documento).first()
    if paciente_existente:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Documento ya registrado")

    # Nunca persistir una contraseña en texto plano en la tabla paciente.
    payload = data.model_dump(exclude={"contrasena_plano"})
    nuevo_paciente = models.Paciente(**payload)
    try:
        db.add(nuevo_paciente)
        db.commit()
        db.refresh(nuevo_paciente)
        return nuevo_paciente
    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear paciente: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al crear paciente")


@router.put("/{id}", response_model=schemas.PacienteOut)
def update_paciente(
    id: int,
    data: schemas.PacienteUpdate,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_staff()),
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == id).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    # El campo legado sólo era texto plano; no debe volver a persistirse.
    update_data.pop("contrasena_plano", None)

    if "documento" in update_data:
        otro_paciente = (
            db.query(models.Paciente)
            .filter(models.Paciente.documento == update_data["documento"], models.Paciente.id_paciente != id)
            .first()
        )
        if otro_paciente:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Documento ya registrado por otro paciente")

    try:
        for key, value in update_data.items():
            setattr(paciente, key, value)
        db.commit()
        db.refresh(paciente)
        return paciente
    except Exception as e:
        db.rollback()
        print(f"❌ Error al actualizar paciente: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al actualizar paciente")


@router.delete("/{id}")
def delete_paciente(
    id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_staff()),
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == id).first()
    if not paciente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paciente no encontrado")

    try:
        db.execute(models.usuario_paciente.delete().where(models.usuario_paciente.c.id_paciente == id))
        db.delete(paciente)
        db.commit()
        return {"mensaje": "Paciente eliminado correctamente", "id_paciente": id}
    except Exception as e:
        db.rollback()
        print(f"❌ Error al eliminar paciente: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error al eliminar paciente")
