from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from security import dentist_patient_ids, require_patient_resource, require_roles, require_staff

router = APIRouter(prefix="/historias-clinicas", tags=["Historias Clínicas"])

@router.get("/", response_model=List[schemas.HistoriaClinicaOut])
def get_historias(db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    query = db.query(models.HistoriaClinica)
    if user["role"] == "dentist":
        patient_ids = dentist_patient_ids(db, user)
        if not patient_ids:
            return []
        query = query.filter(models.HistoriaClinica.id_paciente.in_(patient_ids))
    return query.all()

@router.get("/paciente/{paciente_id}", response_model=List[schemas.HistoriaClinicaOut])
def get_historias_por_paciente(
    paciente_id: int,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_patient_resource("paciente_id")),
):
    return db.query(models.HistoriaClinica).filter(models.HistoriaClinica.id_paciente == paciente_id).all()

@router.get("/{id}", response_model=schemas.HistoriaClinicaOut)
def get_historia(
    id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_staff()),
):
    h = db.query(models.HistoriaClinica).filter(models.HistoriaClinica.id_historia == id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Historia clínica no encontrada")
    if user["role"] == "dentist" and h.id_paciente not in dentist_patient_ids(db, user):
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
    return h

@router.post("/", response_model=schemas.HistoriaClinicaOut, status_code=201)
def create_historia(data: schemas.HistoriaClinicaCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    if user["role"] == "dentist" and data.id_paciente not in dentist_patient_ids(db, user):
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
    nuevo = models.HistoriaClinica(**data.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.put("/{id}", response_model=schemas.HistoriaClinicaOut)
def update_historia(id: int, data: schemas.HistoriaClinicaCreate, db: Session = Depends(get_db), user: dict = Depends(require_staff())):
    h = db.query(models.HistoriaClinica).filter(models.HistoriaClinica.id_historia == id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Historia clínica no encontrada")
    if user["role"] == "dentist":
        allowed = dentist_patient_ids(db, user)
        if h.id_paciente not in allowed or data.id_paciente not in allowed:
            raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
    for k, v in data.model_dump().items():
        setattr(h, k, v)
    db.commit()
    db.refresh(h)
    return h

@router.delete("/{id}")
def delete_historia(id: int, db: Session = Depends(get_db), _user: dict = Depends(require_roles("superadmin", "clinic_admin"))):
    h = db.query(models.HistoriaClinica).filter(models.HistoriaClinica.id_historia == id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Historia clínica no encontrada")
    db.delete(h)
    db.commit()
    return {"mensaje": "Historia clínica eliminada correctamente"}
