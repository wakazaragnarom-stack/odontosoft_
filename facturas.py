from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from security import require_patient_resource, require_roles, user_patient_ids

router = APIRouter(prefix="/facturas", tags=["Facturas"])
STAFF = Depends(require_roles("superadmin", "clinic_admin"))


def _patient_invoice_ids(db: Session, user: dict) -> set[int]:
    patient_ids = user_patient_ids(db, int(user["sub"]))
    if not patient_ids:
        return set()
    rows = (
        db.query(models.Factura.id_factura)
        .join(models.Pago, models.Pago.id_pago == models.Factura.id_pago)
        .join(models.Cita, models.Cita.id_cita == models.Pago.id_cita)
        .filter(models.Cita.id_paciente.in_(patient_ids))
        .all()
    )
    return {int(row[0]) for row in rows}


@router.get("/", response_model=List[schemas.FacturaOut])
def get_facturas(db: Session = Depends(get_db), user: dict = Depends(require_roles("superadmin", "clinic_admin", "patient"))):
    query = db.query(models.Factura)
    if user["role"] == "patient":
        ids = _patient_invoice_ids(db, user)
        if not ids:
            return []
        query = query.filter(models.Factura.id_factura.in_(ids))
    return query.all()


@router.get("/{id}", response_model=schemas.FacturaOut)
def get_factura(id: int, db: Session = Depends(get_db), user: dict = Depends(require_roles("superadmin", "clinic_admin", "patient"))):
    f = db.query(models.Factura).filter(models.Factura.id_factura == id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if user["role"] == "patient" and id not in _patient_invoice_ids(db, user):
        raise HTTPException(status_code=403, detail="No tienes permisos para acceder a este recurso")
    return f


@router.post("/", response_model=schemas.FacturaOut, status_code=201)
def create_factura(data: schemas.FacturaCreate, db: Session = Depends(get_db), _user: dict = STAFF):
    pago = db.query(models.Pago).filter(models.Pago.id_pago == data.id_pago).first()
    if not pago:
        raise HTTPException(status_code=400, detail="El pago no existe")
    if db.query(models.Factura).filter(models.Factura.id_pago == data.id_pago).first():
        raise HTTPException(status_code=409, detail="El pago ya tiene una factura asociada")
    nuevo = models.Factura(**data.model_dump())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.put("/{id}", response_model=schemas.FacturaOut)
def update_factura(id: int, data: schemas.FacturaCreate, db: Session = Depends(get_db), _user: dict = STAFF):
    f = db.query(models.Factura).filter(models.Factura.id_factura == id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    pago = db.query(models.Pago).filter(models.Pago.id_pago == data.id_pago).first()
    if not pago:
        raise HTTPException(status_code=400, detail="El pago no existe")
    duplicate = db.query(models.Factura).filter(models.Factura.id_pago == data.id_pago, models.Factura.id_factura != id).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="El pago ya tiene otra factura asociada")
    for k, v in data.model_dump().items():
        setattr(f, k, v)
    db.commit()
    db.refresh(f)
    return f


@router.delete("/{id}")
def delete_factura(id: int, db: Session = Depends(get_db), _user: dict = STAFF):
    f = db.query(models.Factura).filter(models.Factura.id_factura == id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    db.delete(f)
    db.commit()
    return {"mensaje": "Factura eliminada correctamente"}
