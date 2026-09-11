# routers/password_reset.py - Restablecimiento de contraseña con token seguro

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from utils import hash_password, generar_token_seguro
from notifications import NotificationService

router = APIRouter(prefix="/auth", tags=["Restablecimiento de Contraseña"])

TOKEN_EXPIRA_MINUTOS = 15


# ── SOLICITAR RESTABLECIMIENTO ───────────────────────────────────────────────

@router.post("/solicitar-reset", response_model=schemas.MensajeResponse)
async def solicitar_reset(
    data: schemas.SolicitarResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Solicita el envío de un correo con el enlace para restablecer
    la contraseña. Siempre responde con el mismo mensaje genérico,
    exista o no el correo, para no revelar qué cuentas están registradas.
    """

    mensaje_generico = schemas.MensajeResponse(
        mensaje="Si el correo está registrado, recibirás un enlace de "
                "recuperación en los próximos minutos."
    )

    usuario = db.query(models.Usuario).filter(
        models.Usuario.correo == data.correo
    ).first()

    if not usuario:
        # No revelamos si el correo existe o no
        return mensaje_generico

    # Invalidar cualquier token anterior que siga activo
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.id_usuario == usuario.id_usuario,
        models.PasswordResetToken.usado == False
    ).update({"usado": True})

    token = generar_token_seguro()

    nuevo_token = models.PasswordResetToken(
        token=token,
        id_usuario=usuario.id_usuario,
        fecha_creacion=datetime.utcnow(),
        fecha_expiracion=datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRA_MINUTOS),
        usado=False
    )

    db.add(nuevo_token)
    db.commit()

    nombre_usuario = usuario.nombre or usuario.correo

    # Enviar el correo en segundo plano para no bloquear la respuesta
    background_tasks.add_task(
        NotificationService.enviar_reset_password,
        usuario.correo,
        nombre_usuario,
        token
    )

    return mensaje_generico


# ── CONFIRMAR RESTABLECIMIENTO ───────────────────────────────────────────────

@router.post("/reset-password", response_model=schemas.MensajeResponse)
def reset_password(
    data: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Valida el token recibido por correo y actualiza la contraseña."""

    registro = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == data.token
    ).first()

    if not registro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de restablecimiento no es válido."
        )

    if registro.usado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este enlace ya fue utilizado. Solicita uno nuevo."
        )

    if registro.fecha_expiracion < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace ha expirado. Solicita uno nuevo."
        )

    usuario = db.query(models.Usuario).filter(
        models.Usuario.id_usuario == registro.id_usuario
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    usuario.contrasena = hash_password(data.nueva_contrasena)
    registro.usado = True

    db.commit()

    return schemas.MensajeResponse(
        mensaje="Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión."
    )
