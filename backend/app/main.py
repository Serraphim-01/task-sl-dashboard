from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.database import get_db
from app.api.v1 import customers_router, telemetry_router, health_router   
from app.api.v1.auth import router as auth_router

app = FastAPI(title="Starlink Partner Dashboard", version="1.0.0")

# CORS middleware (already present)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(customers_router, prefix="/api/v1/customers", tags=["customers"], dependencies=[Depends(get_db)])
app.include_router(telemetry_router, prefix="/api/v1/telemetry", tags=["telemetry"], dependencies=[Depends(get_db)])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(health_router, prefix="/api/v1/health", tags=["health"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}