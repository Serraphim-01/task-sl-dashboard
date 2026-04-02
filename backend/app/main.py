from fastapi import FastAPI
from app.api.v1 import customers, telemetry, auth, account

app = FastAPI(title="Starlink Partner Dashboard", version="1.0.0")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["customers"])
app.include_router(telemetry.router, prefix="/api/v1/telemetry", tags=["telemetry"])

app.include_router(account.router, prefix="/api/v1", tags=["account"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}