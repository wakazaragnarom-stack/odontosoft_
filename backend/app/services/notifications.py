import os
from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from dotenv import load_dotenv

load_dotenv()

# Configuración de FastMail (Gmail)
mail_config = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", ""),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM=os.getenv("MAIL_FROM", ""),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True
    
)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5500/frontend/html")

class NotificationService:

    @staticmethod
    async def send_email(email_to: str, subject: str, body_html: str):
        """Envía un correo electrónico en formato HTML en segundo plano."""
        message = MessageSchema(
            subject=subject,
            recipients=[email_to],
            body=body_html,
            subtype=MessageType.html
        )
        fm = FastMail(mail_config)
        await fm.send_message(message)

    

    @staticmethod
    async def enviar_recordatorio_24h(
        email_paciente: str,
        nombre_paciente: str,
        fecha_cita: str,
        hora_cita: str,
        doctor_nombre: str
    ) -> bool:
        """Envia un correo de recordatorio 24 horas antes de la cita."""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .header {{ background-color: #f39c12; color: white; text-align: center; padding: 20px; }}
                .content {{ padding: 30px; color: #333333; line-height: 1.6; }}
                .details {{ background-color: #fdf6e7; border-left: 4px solid #f39c12; padding: 15px; margin: 20px 0; border-radius: 4px; }}
                .footer {{ background-color: #f4f6f9; text-align: center; padding: 15px; font-size: 12px; color: #777777; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>⏰ ¡Recordatorio de tu Cita Mañana!</h2>
                </div>
                <div class="content">
                    <p>Hola <strong>{nombre_paciente}</strong>,</p>
                    <p>Te recordamos que tienes una cita odontológica programada para el día de mañana.</p>

                    <div class="details">
                        <p><strong>Fecha:</strong> {fecha_cita}</p>
                        <p><strong>Hora:</strong> {hora_cita}</p>
                        <p><strong>Odontólogo:</strong> {doctor_nombre}</p>
                    </div>

                    <p>Si necesitas reprogramar o cancelar tu cita, por favor contáctanos con anticipación.</p>
                    <p>¡Te esperamos!</p>
                </div>
                <div class="footer">
                    <p>OdontoSoft - Sistema de Gestión Odontológica</p>
                </div>
            </div>
        </body>
        </html>
        """

        message = MessageSchema(
            subject="⏰ Recordatorio: Tu cita odontológica es mañana",
            recipients=[email_paciente],
            body=html_content,
            subtype=MessageType.html
        )

        try:
            fm = FastMail(mail_config)
            await fm.send_message(message)
            return True
        except Exception as e:
            print(f"Error al enviar correo de recordatorio 24h: {e}")
            return False

    @staticmethod
    async def enviar_reset_password(
        email_destino: str,
        nombre_usuario: str,
        token: str
    ) -> bool:
        """Envía el correo con el enlace para restablecer la contraseña."""

        reset_link = f"{FRONTEND_URL}/reset-password.html?token={token}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; background: #ffffff; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            .header {{ background-color: #2c7be5; color: white; text-align: center; padding: 20px; }}
            .content {{ padding: 30px; color: #333333; line-height: 1.6; }}
            .btn {{ display: inline-block; background-color: #2c7be5; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin: 20px 0; }}
            .footer {{ background-color: #f4f6f9; text-align: center; padding: 15px; font-size: 12px; color: #777777; }}
            .aviso {{ font-size: 13px; color: #999999; margin-top: 20px; }}
        </style>
        </head>
        <body>
        <div class="container">
            <div class="header">
                <h2>🔐 Restablecer tu contraseña</h2>
            </div>
            <div class="content">
                <p>Hola <strong>{nombre_usuario}</strong>,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en OdontoSoft.</p>
                <p style="text-align:center;">
                    <a class="btn" href="{reset_link}">Restablecer contraseña</a>
                </p>
                <p class="aviso">Este enlace expira en 15 minutos. Si tú no solicitaste este cambio, puedes ignorar este correo con tranquilidad; tu contraseña actual seguirá funcionando.</p>
            </div>
            <div class="footer">
                <p>OdontoSoft - Sistema de Gestión Odontológica</p>
            </div>
        </div>
        </body>
        </html>
        """

        message = MessageSchema(
            subject="🔐 Restablece tu contraseña de OdontoSoft",
            recipients=[email_destino],
            body=html_content,
            subtype=MessageType.html
        )

        try:
            fm = FastMail(mail_config)
            await fm.send_message(message)
            return True
        except Exception as e:
            print(f"Error al enviar correo de restablecimiento: {e}")
            return False