import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from notifications import NotificationService

async def enviar_recordatorios_manana():
    db: Session = SessionLocal()
    try:
        # 1. Calcular la fecha de mañana
        manana = (datetime.now() + timedelta(days=1)).date()
        print(f"🔍 Buscando citas para la fecha: {manana}")

        # 2. Consultar citas programadas para mañana
        citas = db.query(models.Cita).filter(
            models.Cita.fecha == manana,
            models.Cita.estado.in_(["En Espera", "Pendiente", "Confirmada"])
        ).all()

        if not citas:
            print("ℹ️ No hay citas programadas para mañana.")
            return

        print(f"📋 Se encontraron {len(citas)} cita(s) para mañana. Procesando recordatorios...")

        # 3. Recorrer citas y enviar correo
        for cita in citas:
            paciente = db.query(models.Paciente).filter(models.Paciente.id_paciente == cita.id_paciente).first()
            odontologo = db.query(models.Odontologo).filter(models.Odontologo.id_odontologo == cita.id_odontologo).first()

            if paciente:
                # Soporte por si la columna se llama correo o email
                correo_paciente = getattr(paciente, "correo", getattr(paciente, "email", None))

                if correo_paciente:
                    nombre_paciente = f"{paciente.nombre} {paciente.apellido}"
                    nombre_doctor = f"Dr. {odontologo.nombre} {odontologo.apellido}" if odontologo else "Atención Odontológica"
                    
                    exito = await NotificationService.enviar_recordatorio_24h(
                        email_paciente=correo_paciente,
                        nombre_paciente=nombre_paciente,
                        fecha_cita=str(cita.fecha),
                        hora_cita=str(cita.hora),
                        doctor_nombre=nombre_doctor
                    )

                    if exito:
                        print(f"✅ Recordatorio enviado a {correo_paciente}")
                    else:
                        print(f"❌ Error enviando correo a {correo_paciente}")
                else:
                    print(f"⚠️ El paciente ID {paciente.id_paciente} no tiene un correo registrado.")

    except Exception as e:
        print(f"❌ Error ejecutando tarea de recordatorios: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(enviar_recordatorios_manana())