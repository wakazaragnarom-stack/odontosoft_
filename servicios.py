from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
from security import dentist_patient_ids, require_roles, user_patient_ids

router = APIRouter(prefix="/servicios", tags=["Servicios"])


@router.get("/", response_model=List[schemas.ServicioOut])
def get_servicios(
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("superadmin", "clinic_admin", "dentist", "patient")),
):
    query = db.query(models.Servicio)
    if user["role"] == "patient":
        patient_ids = user_patient_ids(db, int(user["sub"]))
        if not patient_ids:
            return []
        query = query.filter(models.Servicio.paciente_id.in_(patient_ids))
    elif user["role"] == "dentist":
        patient_ids = dentist_patient_ids(db, user)
        if not patient_ids:
            return []
        query = query.filter(models.Servicio.paciente_id.in_(patient_ids))
    return query.all()


@router.get("/{id}", response_model=schemas.ServicioOut)
def get_servicio(
    id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("superadmin", "clinic_admin", "dentist", "patient")),
):
    s = db.query(models.Servicio).filter(models.Servicio.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    if user["role"] == "patient" and s.paciente_id not in user_patient_ids(db, int(user["sub"])):
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
    if user["role"] == "dentist" and s.paciente_id not in dentist_patient_ids(db, user):
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
    return s


@router.get("/paciente/{paciente_id}", response_model=List[schemas.ServicioOut])
def get_servicios_por_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("superadmin", "clinic_admin", "dentist", "patient")),
):
    if user["role"] == "patient" and paciente_id not in user_patient_ids(db, int(user["sub"])):
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
    if user["role"] == "dentist" and paciente_id not in dentist_patient_ids(db, user):
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
    return db.query(models.Servicio).filter(models.Servicio.paciente_id == paciente_id).all()


@router.post("/", response_model=schemas.ServicioOut, status_code=201)
def create_servicio(
    data: schemas.ServicioCreate,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_roles("superadmin", "clinic_admin", "dentist")),
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=400, detail="El paciente no existe")
    nuevo = models.Servicio(**data.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id}", response_model=schemas.ServicioOut)
def update_servicio(
    id: int,
    data: schemas.ServicioUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_roles("superadmin", "clinic_admin", "dentist")),
):
    s = db.query(models.Servicio).filter(models.Servicio.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    if user["role"] == "dentist" and s.paciente_id not in dentist_patient_ids(db, user):
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
    update_data = data.model_dump(exclude_unset=True)
    if "paciente_id" in update_data:
        paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == update_data["paciente_id"]).first()
        if not paciente:
            raise HTTPException(status_code=400, detail="El paciente no existe")
        if user["role"] == "dentist" and update_data["paciente_id"] not in dentist_patient_ids(db, user):
            raise HTTPException(status_code=403, detail="No puedes reasignar el servicio a otro paciente")
    for key, value in update_data.items():
        setattr(s, key, value)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{id}")
def delete_servicio(
    id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_roles("superadmin", "clinic_admin")),
):
    s = db.query(models.Servicio).filter(models.Servicio.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    db.delete(s)
    db.commit()
    return {"mensaje": "Servicio eliminado correctamente"}
