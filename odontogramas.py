from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db
from security import require_patient_resource

router = APIRouter(prefix="/odontogramas", tags=["Odontogramas"])

@router.get("/paciente/{paciente_id}", response_model=schemas.OdontogramaOut)
def get_odontograma(
    paciente_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(require_patient_resource("paciente_id")),
):
    paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    o = db.query(models.Odontograma).filter(models.Odontograma.id_paciente == paciente_id).first()
    if not o:
        if user["role"] == "patient":
            return schemas.OdontogramaOut(id_paciente=paciente_id, dientes={}, id_odontograma=0, fecha_actualizacion=datetime.now())
        o = models.Odontograma(id_paciente=paciente_id, dientes={}, fecha_actualizacion=datetime.now())
        db.add(o); db.commit(); db.refresh(o)
    return o

@router.put("/paciente/{paciente_id}", response_model=schemas.OdontogramaOut)
def save_odontograma(
    paciente_id: int,
    data: schemas.OdontogramaCreate,
    db: Session = Depends(get_db),
    _user: dict = Depends(require_patient_resource("paciente_id")),
):
    if paciente_id != data.id_paciente:
        raise HTTPException(status_code=400, detail="El paciente no coincide con la información enviada")
    paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    o = db.query(models.Odontograma).filter(models.Odontograma.id_paciente == paciente_id).first()
    if not o:
        o = models.Odontograma(id_paciente=paciente_id)
        db.add(o)
    o.dientes = data.dientes
    o.fecha_actualizacion = datetime.now()
    db.commit(); db.refresh(o)
    return o
