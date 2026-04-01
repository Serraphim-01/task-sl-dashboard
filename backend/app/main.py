from fastapi import FastAPI
from app.api.v1 import customers, telemetry, auth

app = FastAPI(title="Starlink Partner Dashboard", version="1.0.0")

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["customers"])
app.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["telemetry"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}