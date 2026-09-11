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


router = APIRouter(
    prefix="/pacientes",
    tags=["Pacientes"]
)


# ============================================================
# GET - OBTENER TODOS LOS PACIENTES
# ============================================================

@router.get(
    "/",
    response_model=List[schemas.PacienteOut]
)
def get_pacientes(
    db: Session = Depends(get_db)
):
    """
    Obtener únicamente los pacientes que:
    - Tienen un usuario asociado.
    - El usuario tiene rol Paciente.
    - El usuario está Activo.

    Esto evita mostrar pacientes que quedaron sin usuario
    después de una eliminación.
    """

    try:

        pacientes = (
            db.query(models.Paciente)
            .join(
                models.usuario_paciente,
                models.usuario_paciente.c.id_paciente
                == models.Paciente.id_paciente
            )
            .join(
                models.Usuario,
                models.Usuario.id_usuario
                == models.usuario_paciente.c.id_usuario
            )
            .filter(
                models.Usuario.rol == "Paciente",
                models.Usuario.estado == "Activo"
            )
            .distinct()
            .all()
        )

        return pacientes

    except Exception as e:

        print(
            f"❌ Error al obtener pacientes: {str(e)}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener pacientes: {str(e)}"
        )


# ============================================================
# GET - OBTENER PACIENTE POR ID
# ============================================================

@router.get(
    "/{id}",
    response_model=schemas.PacienteOut
)
def get_paciente(
    id: int,
    db: Session = Depends(get_db)
):
    """
    Obtener un paciente por su ID.
    """

    paciente = (
        db.query(models.Paciente)
        .filter(
            models.Paciente.id_paciente == id
        )
        .first()
    )

    if not paciente:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )

    return paciente


# ============================================================
# GET - BUSCAR PACIENTE POR DOCUMENTO
# ============================================================

@router.get(
    "/documento/{documento}",
    response_model=schemas.PacienteOut
)
def get_paciente_by_documento(
    documento: str,
    db: Session = Depends(get_db)
):
    """
    Obtener un paciente utilizando su número de documento.
    """

    paciente = (
        db.query(models.Paciente)
        .filter(
            models.Paciente.documento == documento
        )
        .first()
    )

    if not paciente:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )

    return paciente


# ============================================================
# POST - CREAR PACIENTE
# ============================================================

@router.post(
    "/",
    response_model=schemas.PacienteOut,
    status_code=status.HTTP_201_CREATED
)
def create_paciente(
    data: schemas.PacienteCreate,
    db: Session = Depends(get_db)
):
    """
    Crear un nuevo paciente.
    """

    # --------------------------------------------------------
    # Verificar documento
    # --------------------------------------------------------

    paciente_existente = (
        db.query(models.Paciente)
        .filter(
            models.Paciente.documento == data.documento
        )
        .first()
    )

    if paciente_existente:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Documento ya registrado"
        )

    # --------------------------------------------------------
    # Crear paciente
    # --------------------------------------------------------

    nuevo_paciente = models.Paciente(
        **data.model_dump()
    )

    try:

        db.add(nuevo_paciente)

        db.commit()

        db.refresh(nuevo_paciente)

        return nuevo_paciente

    except Exception as e:

        db.rollback()

        print(
            f"❌ Error al crear paciente: {str(e)}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear paciente: {str(e)}"
        )


# ============================================================
# PUT - ACTUALIZAR PACIENTE
# ============================================================

@router.put(
    "/{id}",
    response_model=schemas.PacienteOut
)
def update_paciente(
    id: int,
    data: schemas.PacienteUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualizar un paciente existente.

    Solo se modifican los campos enviados.
    """

    # --------------------------------------------------------
    # Buscar paciente
    # --------------------------------------------------------

    paciente = (
        db.query(models.Paciente)
        .filter(
            models.Paciente.id_paciente == id
        )
        .first()
    )

    if not paciente:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )

    # --------------------------------------------------------
    # Obtener solamente los campos enviados
    # --------------------------------------------------------

    update_data = data.model_dump(
        exclude_unset=True
    )

    # --------------------------------------------------------
    # Verificar documento
    # --------------------------------------------------------

    if "documento" in update_data:

        otro_paciente = (
            db.query(models.Paciente)
            .filter(
                models.Paciente.documento
                == update_data["documento"],

                models.Paciente.id_paciente != id
            )
            .first()
        )

        if otro_paciente:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Documento ya registrado por otro paciente"
            )

    # --------------------------------------------------------
    # Actualizar contraseña en texto plano
    # --------------------------------------------------------

    if "contrasena_plano" in update_data:

        contrasena = update_data[
            "contrasena_plano"
        ]

        if contrasena:

            if len(contrasena) < 6:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="La contraseña debe tener al menos 6 caracteres"
                )

    # --------------------------------------------------------
    # Aplicar cambios
    # --------------------------------------------------------

    try:

        for key, value in update_data.items():

            setattr(
                paciente,
                key,
                value
            )

        db.commit()

        db.refresh(paciente)

        return paciente

    except Exception as e:

        db.rollback()

        print(
            f"❌ Error al actualizar paciente: {str(e)}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar paciente: {str(e)}"
        )


# ============================================================
# DELETE - ELIMINAR PACIENTE
# ============================================================

@router.delete(
    "/{id}"
)
def delete_paciente(
    id: int,
    db: Session = Depends(get_db)
):
    """
    Eliminar un paciente y toda su información relacionada.

    Se eliminan:
    - Relación usuario_paciente
    - Paciente
    - Citas
    - Historias clínicas
    - Servicios
    - Recordatorios de sus citas
    - Pagos de sus citas
    - Facturas relacionadas
    - Relaciones cita_tratamiento
    """

    # --------------------------------------------------------
    # Buscar paciente
    # --------------------------------------------------------

    paciente = (
        db.query(models.Paciente)
        .filter(
            models.Paciente.id_paciente == id
        )
        .first()
    )

    if not paciente:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paciente no encontrado"
        )

    try:

        # ====================================================
        # 1. ELIMINAR RELACIONES USUARIO - PACIENTE
        # ====================================================

        db.execute(
            models.usuario_paciente.delete().where(
                models.usuario_paciente.c.id_paciente == id
            )
        )

        # ====================================================
        # 2. ELIMINAR PACIENTE
        #
        # Las relaciones ORM de Paciente tienen:
        #
        # cascade="all, delete-orphan"
        #
        # para historias, citas y servicios.
        # ====================================================

        db.delete(paciente)

        # ====================================================
        # 3. GUARDAR CAMBIOS
        # ====================================================

        db.commit()

        return {
            "mensaje": "Paciente eliminado correctamente",
            "id_paciente": id
        }

    except Exception as e:

        db.rollback()

        print(
            f"❌ Error al eliminar paciente: {str(e)}"
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar paciente: {str(e)}"
        )