from fastapi import FastAPI, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text
import os

from app.database import get_db, SessionLocal
from app.api.v1 import customers_router, telemetry_router, health_router, customer_router
from app.api.v1.auth import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup: Reset all is_online flags to False
    # This ensures accurate online status tracking
    db = SessionLocal()
    try:
        db.execute(text("""
            UPDATE users 
            SET is_online = FALSE
            WHERE is_online = TRUE
        """))
        db.commit()
    except Exception as e:
        db.rollback()
    finally:
        db.close()
    
    yield
    
    # Shutdown: Cleanup
    pass

app = FastAPI(
    title="Starlink Partner Dashboard", 
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware - Environment-aware
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Include routers
app.include_router(customers_router, prefix="/api/v1", tags=["customers"])
app.include_router(telemetry_router, prefix="/api/v1/telemetry", tags=["telemetry"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(health_router, prefix="/api/v1/health", tags=["health"])
app.include_router(customer_router, prefix="/api/v1/customer", tags=["customer"])

# Import WebSocket manager and endpoint
from app.websocket_manager import manager
from app.utils.jwt import verify_token
from datetime import datetime, timezone
import logging
import json

logger = logging.getLogger(__name__)

@app.websocket("/api/v1/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, token: str = None):
    """
    WebSocket endpoint for real-time updates.
    Clients connect with their user_id and auth token.
    """
    # Verify token
    if not token:
        await websocket.close(code=4001, reason="Missing authentication token")
        return
    
    payload = verify_token(token)
    if payload is None:
        await websocket.close(code=4002, reason="Invalid or expired token")
        return
    
    # Verify user_id matches token
    if payload.get("user_id") != user_id:
        await websocket.close(code=4003, reason="User ID mismatch")
        return
    
    is_admin = payload.get("is_admin", False)
    
    # Connect
    await manager.connect(websocket, user_id=user_id, is_admin=is_admin)
    
    try:
        # Send welcome message
        await manager.send_personal_message({
            "type": "connection_established",
            "user_id": user_id,
            "is_admin": is_admin,
            "message": "WebSocket connection established"
        }, websocket)
        
        # Keep connection alive and handle incoming messages
        while True:
            # Wait for messages from client (ping/pong or other)
            data = await websocket.receive_text()
            
            # Handle ping/pong
            try:
                message = json.loads(data)
                if message.get("type") == "ping":
                    await manager.send_personal_message({
                        "type": "pong",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }, websocket)
            except json.JSONDecodeError:
                pass  # Ignore invalid messages
                
    except Exception as e:
        manager.disconnect(websocket, user_id=user_id, is_admin=is_admin)

@app.get("/health")
async def health_check():
    return {"status": "ok"}