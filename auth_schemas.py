from pydantic import BaseModel


class SecureLoginResponse(BaseModel):
    id_usuario: int
    correo: str
    rol: str
    estado: str
    mensaje: str
    access_token: str
    token_type: str = "bearer"
    expires_at: int
