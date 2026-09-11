from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models, schemas
from database import get_db

router = APIRouter(prefix="/historias-clinicas-detalladas", tags=["Historias Clínicas Detalladas"])

@router.get("/paciente/{paciente_id}", response_model=schemas.HistoriaClinicaDetalladaOut)
def get_historia_detallada(paciente_id: int, db: Session = Depends(get_db)):
    paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    h = db.query(models.HistoriaClinicaDetallada).filter(models.HistoriaClinicaDetallada.id_paciente == paciente_id).first()
    if not h:
        h = models.HistoriaClinicaDetallada(id_paciente=paciente_id, datos_clinicos={}, fecha_actualizacion=datetime.now())
        db.add(h); db.commit(); db.refresh(h)
    return h

@router.put("/paciente/{paciente_id}", response_model=schemas.HistoriaClinicaDetalladaOut)
def save_historia_detallada(paciente_id: int, data: schemas.HistoriaClinicaDetalladaCreate, db: Session = Depends(get_db)):
    if paciente_id != data.id_paciente:
        raise HTTPException(status_code=400, detail="El paciente no coincide con la información enviada")
    paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    h = db.query(models.HistoriaClinicaDetallada).filter(models.HistoriaClinicaDetallada.id_paciente == paciente_id).first()
    if not h:
        h = models.HistoriaClinicaDetallada(id_paciente=paciente_id)
        db.add(h)
    h.datos_clinicos = data.datos_clinicos
    h.fecha_actualizacion = datetime.now()
    db.commit(); db.refresh(h)
    return h
