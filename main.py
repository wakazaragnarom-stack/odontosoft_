"""API principal de OdontoSoft.

PostgreSQL es la fuente de verdad; esta aplicación no crea ni migra tablas al iniciar.
"""

import logging
import os
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.middleware.trustedhost import TrustedHostMiddleware

from database import SessionLocal
from security import JWTAuthMiddleware

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"), format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("odontosoft.api")


def _csv_env(name: str, default: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, default).split(",") if value.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("OdontoSoft API iniciada")
    yield
    logger.info("OdontoSoft API detenida")


app = FastAPI(
    title="OdontoSoft API",
    description="API REST odontológica sobre PostgreSQL",
    version="3.0.0",
    debug=os.getenv("APP_ENV", "development").lower() != "production",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

cors_origins = _csv_env(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

allowed_hosts = _csv_env("ALLOWED_HOSTS", "")
if allowed_hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

app.add_middleware(JWTAuthMiddleware)


@app.middleware("http")
async def request_logging(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    request.state.request_id = request_id
    started = time.perf_counter()
    response = await call_next(request)
    elapsed = time.perf_counter() - started
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{elapsed:.4f}"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if request.url.path.startswith("/auth/"):
        response.headers["Cache-Control"] = "no-store"
    logger.info("%s %s -> %s (%.4fs) request_id=%s", request.method, request.url.path, response.status_code, elapsed, request_id)
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "Error de validación", "errors": exc.errors()})


@app.exception_handler(IntegrityError)
async def integrity_exception_handler(request: Request, exc: IntegrityError):
    logger.warning("Conflicto de integridad en %s %s", request.method, request.url.path)
    return JSONResponse(status_code=409, content={"detail": "La operación entra en conflicto con datos existentes"})


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.exception("Error de base de datos en %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Error al procesar la operación de base de datos"})


@app.get("/", tags=["Root"])
async def root():
    return {"sistema": "OdontoSoft API", "version": app.version, "estado": "Activo", "base_datos": "PostgreSQL", "documentacion": "/docs"}


@app.get("/health", tags=["Health"])
async def health_check():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "services": {"api": "running", "database": "connected"}}
    finally:
        db.close()


@app.get("/info", tags=["Info"])
async def system_info():
    return {"sistema": "OdontoSoft", "version": app.version, "framework": "FastAPI", "base_datos": "PostgreSQL"}


import auth
import usuarios
import pacientes
import odontologos
import consultorios
import historias_clinicas
import citas
import tratamientos
import recordatorios
import pagos
import facturas
import roles
import proveedores
import servicios
import historias_clinicas_detalladas
import odontogramas
import password_reset

for module in (
    auth,
    usuarios,
    pacientes,
    odontologos,
    consultorios,
    historias_clinicas,
    citas,
    tratamientos,
    recordatorios,
    pagos,
    facturas,
    roles,
    proveedores,
    servicios,
    historias_clinicas_detalladas,
    odontogramas,
    password_reset,
):
    app.include_router(module.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=False)
