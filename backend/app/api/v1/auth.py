# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import StarlinkAuth
from app.database import User
from app.utils.password import verify_password
from app.utils.jwt import create_access_token, verify_token
from app.database import SessionLocal
import httpx
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# Pydantic models for request/response
class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    message: str
    user_id: int
    email: str
    is_admin: bool


class UserResponse(BaseModel):
    user_id: int
    email: str
    enterprise_name: str
    is_admin: bool


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, response: Response):
    """
    Authenticate customer and return JWT token in HTTP-only cookie.
    """
    db = SessionLocal()
    try:
        # Look up user by email
        user = db.query(User).filter(User.email == request.email).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not verify_password(request.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create JWT token
        token_data = {
            "user_id": user.id,
            "email": user.email,
            "is_admin": user.is_admin
        }
        access_token = create_access_token(data=token_data)
        
        # Set HTTP-only cookie with secure flags
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="strict",
            max_age=86400  # 24 hours
        )
        
        return LoginResponse(
            message="Login successful",
            user_id=user.id,
            email=user.email,
            is_admin=user.is_admin
        )
    finally:
        db.close()


def get_current_user(
    request: Request,
    access_token: Optional[str] = Cookie(None)
) -> User:
    """
    Dependency to get current authenticated user from JWT token.
    Tries to get token from Authorization header first, then from cookie.
    """
    token = None
    
    # Try to get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    
    # If not in header, try cookie
    if not token and access_token:
        token = access_token
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    finally:
        db.close()


def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to get current admin user. Checks is_admin flag.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's information.
    """
    return UserResponse(
        user_id=current_user.id,
        email=current_user.email,
        enterprise_name=current_user.enterprise_name,
        is_admin=current_user.is_admin
    )

@router.get("/kms-test")
async def kms_test():
    """
    Test KMS connection only - fetch Starlink credentials from Azure Key Vault.
    Logs: Vault request sent, response, credentials length.
    """
    from app.services.kms_service import get_kms_service
    from app.services.auth_service import StarlinkAuth
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        kms = await get_kms_service()
        client_id = await kms.get_secret("starlink-provider-client-id")
        client_secret = await kms.get_secret("starlink-provider-client-secret")
        
        logger.info("KMS test: Vault connection successful")
        logger.info(f"KMS test: client_id length={len(client_id) if client_id else 0}")
        logger.info(f"KMS test: client_secret length={len(client_secret) if client_secret else 0}")
        
        if client_id and client_secret:
            logger.info("KMS test: Both credentials fetched successfully")
            auth = StarlinkAuth()
            headers = await auth.get_auth_header()  # Triggers token but don't call Starlink
            return {"status": "success", "kms_working": True, "secrets_loaded": True}
        else:
            raise ValueError("Missing one or both secrets")
    except Exception as e:
        logger.error(f"KMS test failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"KMS test failed: {str(e)}")


@router.get("/test-connection")
async def test_connection():
    try:
        # Instantiate StarlinkAuth without arguments – it will load credentials from KMS
        auth = StarlinkAuth()
        
        # Get headers (this will trigger token retrieval)
        headers = await auth.get_auth_header()
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://starlink.com/api/public/v2/account",
                headers=headers,
                timeout=10
            )
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Starlink API error")
            
            return response.json()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"KMS not configured. Set VAULT_URL in .env. Error: {str(e)}")
