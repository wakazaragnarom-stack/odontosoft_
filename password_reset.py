"""Recuperación de contraseña usando exclusivamente PostgreSQL."""

from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from notifications import NotificationService
from utils import generar_token_seguro, hash_password

router = APIRouter(prefix="/auth", tags=["Restablecimiento de Contraseña"])
TOKEN_EXPIRA_MINUTOS = 15
MENSAJE_GENERICO = "Si el correo está registrado, recibirás un enlace de recuperación en los próximos minutos."


@router.post("/solicitar-reset", response_model=schemas.MensajeResponse)
async def solicitar_reset(data: schemas.SolicitarResetRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = str(data.correo).strip().lower()
    usuario = db.query(models.Usuario).filter(models.Usuario.correo == email).first()
    if not usuario:
        return schemas.MensajeResponse(mensaje=MENSAJE_GENERICO)

    now = datetime.utcnow()
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.id_usuario == usuario.id_usuario,
        models.PasswordResetToken.usado.is_(False),
    ).update({"usado": True}, synchronize_session=False)

    token = generar_token_seguro()
    db.add(models.PasswordResetToken(
        token=token,
        id_usuario=usuario.id_usuario,
        fecha_creacion=now,
        fecha_expiracion=now + timedelta(minutes=TOKEN_EXPIRA_MINUTOS),
        usado=False,
    ))
    db.commit()

    background_tasks.add_task(
        NotificationService.enviar_reset_password,
        usuario.correo,
        usuario.nombre or usuario.correo,
        token,
    )
    return schemas.MensajeResponse(mensaje=MENSAJE_GENERICO)


@router.post("/reset-password", response_model=schemas.MensajeResponse)
def reset_password(data: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    registro = db.query(models.PasswordResetToken).filter(models.PasswordResetToken.token == data.token).first()
    if not registro or registro.usado or registro.fecha_expiracion < now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El enlace de restablecimiento no es válido o ha expirado.")

    # Consumo atómico del token: dos solicitudes concurrentes no pueden reutilizarlo.
    changed = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.id_token == registro.id_token,
        models.PasswordResetToken.usado.is_(False),
        models.PasswordResetToken.fecha_expiracion >= now,
    ).update({"usado": True}, synchronize_session=False)
    if changed != 1:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El enlace ya fue utilizado o ha expirado.")

    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == registro.id_usuario).first()
    if not usuario:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    usuario.contrasena = hash_password(data.nueva_contrasena)
    db.commit()
    return schemas.MensajeResponse(mensaje="Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.")
