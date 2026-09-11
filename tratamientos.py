# routers/tratamientos.py - CRUD completo de tratamientos (SIN id_cita)

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db

router = APIRouter(prefix="/tratamientos", tags=["Tratamientos"])


@router.get("/", response_model=List[schemas.TratamientoOut])
def get_tratamientos(db: Session = Depends(get_db)):
    """Obtener todos los tratamientos del catálogo"""
    return db.query(models.Tratamiento).all()


@router.get("/{id}", response_model=schemas.TratamientoOut)
def get_tratamiento(id: int, db: Session = Depends(get_db)):
    """Obtener un tratamiento por ID"""
    tratamiento = db.query(models.Tratamiento).filter(models.Tratamiento.id_tratamiento == id).first()
    if not tratamiento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tratamiento no encontrado"
        )
    return tratamiento


@router.post("/", response_model=schemas.TratamientoOut, status_code=status.HTTP_201_CREATED)
def create_tratamiento(data: schemas.TratamientoCreate, request: Request, db: Session = Depends(get_db)):
    if request.headers.get("x-user-role", "").lower().replace("ó", "o") == "odontologo":
        raise HTTPException(status_code=403, detail="El odontólogo no puede crear tratamientos desde el catálogo")
    try:
        datos = data.model_dump()

        print("\n========================================")
        print("📥 DATOS RECIBIDOS:")
        print(datos)
        print("========================================")

        nuevo = models.Tratamiento(**datos)

        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)

        print("✅ TRATAMIENTO CREADO:")
        print({
            "id": nuevo.id_tratamiento,
            "nombre": nuevo.nombre,
            "descripcion": nuevo.descripcion,
            "costo": nuevo.costo
        })
        print("========================================\n")

        return nuevo

    except Exception as e:
        db.rollback()

        print("\n========================================")
        print("❌ ERROR REAL AL CREAR TRATAMIENTO")
        print("TIPO:", type(e).__name__)
        print("ERROR:", str(e))
        print("========================================\n")

        raise HTTPException(
            status_code=500,
            detail=f"Error real al crear tratamiento: {str(e)}"
        )

@router.put("/{id}", response_model=schemas.TratamientoOut)
def update_tratamiento(id: int, data: schemas.TratamientoUpdate, request: Request, db: Session = Depends(get_db)):
    """
    Actualizar un tratamiento existente en el catálogo.
    Ya no recibe id_cita.
    """
    tratamiento = db.query(models.Tratamiento).filter(models.Tratamiento.id_tratamiento == id).first()
    if not tratamiento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tratamiento no encontrado"
        )
    
    update_data = data.model_dump(exclude_unset=True)

    # El odontólogo puede modificar los datos del tratamiento, pero nunca su precio.
    if request.headers.get("x-user-role", "").lower().replace("ó", "o") == "odontologo":
        update_data.pop("costo", None)
    
    for key, value in update_data.items():
        setattr(tratamiento, key, value)
    
    db.commit()
    db.refresh(tratamiento)
    return tratamiento


@router.delete("/{id}")
def delete_tratamiento(id: int, request: Request, db: Session = Depends(get_db)):
    """Eliminar un tratamiento del catálogo"""
    if request.headers.get("x-user-role", "").lower().replace("ó", "o") == "odontologo":
        raise HTTPException(status_code=403, detail="El odontólogo no puede eliminar tratamientos")
    tratamiento = db.query(models.Tratamiento).filter(models.Tratamiento.id_tratamiento == id).first()
    if not tratamiento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tratamiento no encontrado"
        )
    
    db.delete(tratamiento)
    db.commit()
    return {"mensaje": "Tratamiento eliminado correctamente", "id_tratamiento": id}