from typing import Optional
from pydantic import BaseModel


class SecureLoginResponse(BaseModel):
    id_usuario: int
    id_paciente: Optional[int] = None
    id_odontologo: Optional[int] = None
    correo: str
    nombre: Optional[str] = None
    rol: str
    estado: str
    mensaje: str
    access_token: str
    token_type: str = "bearer"
    expires_at: int
