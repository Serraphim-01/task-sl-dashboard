# backend/app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.auth_service import StarlinkAuth
from app.database import User
from app.utils.password import verify_password, hash_password
from app.utils.jwt import create_access_token, verify_token
from app.database import SessionLocal
from app.websocket_manager import manager
import httpx
import json
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

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
    must_change_password: bool


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class ChangePasswordResponse(BaseModel):
    message: str


class ForgotPasswordStatusRequest(BaseModel):
    email: str


class ForgotPasswordStatusResponse(BaseModel):
    status: str  # "active", "inactive", "unactivated", "not_found"
    message: str
    can_reset: bool


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, response: Response):
    """
    Authenticate customer and return JWT token in HTTP-only cookie.
    Handles both activated users and first-time password setup for unactivated users.
    Admin users are blocked from using this endpoint.
    """
    db = SessionLocal()
    try:
        # Look up user by email
        user = db.query(User).filter(User.email == request.email).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Block admin users from customer login
        if user.is_admin:
            raise HTTPException(
                status_code=403, 
                detail="Admin accounts cannot log in through the customer portal. Please use the Admin Login portal instead."
            )
        
        # Check if user is unactivated (no password set yet)
        if not user.hashed_password:
            # This is a first-time login - the password provided will be set as their initial password
            if len(request.password) < 8:
                raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
            
            if not any(c.isupper() for c in request.password):
                raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
            
            if not any(c.islower() for c in request.password):
                raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
            
            if not any(c.isdigit() for c in request.password):
                raise HTTPException(status_code=400, detail="Password must contain at least one digit")
            
            # Set the password for the first time
            user.hashed_password = hash_password(request.password)
            user.is_active = True
            user.is_online = True  # User is now online
            user.must_change_password = False
            user.last_login_at = datetime.now(timezone.utc)
            db.commit()
            
            logger.info(f"First-time login - Password set for user: {user.email}")
        else:
            # Regular login - verify password
            if not verify_password(request.password, user.hashed_password):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            # Update last login timestamp and set user as online
            user.last_login_at = datetime.now(timezone.utc)
            user.is_online = True  # User is now online
            db.commit()
        
        # Create JWT token
        token_data = {
            "user_id": user.id,
            "email": user.email,
            "is_admin": user.is_admin,
            "must_change_password": user.must_change_password
        }
        access_token = create_access_token(data=token_data)
        
        # Broadcast status change to admins via WebSocket
        await manager.broadcast_user_status_change(
            user_id=user.id,
            email=user.email,
            is_online=True,
            status="Active"
        )
        
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
        is_admin=current_user.is_admin,
        must_change_password=current_user.must_change_password
    )


@router.post("/change-password", response_model=ChangePasswordResponse)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Allow users to change their password.
    For first-time login, current_password can be empty if must_change_password is True.
    """
    db = SessionLocal()
    try:
        # Validate new password strength
        if len(request.new_password) < 8:
            raise HTTPException(status_code=400, detail="New password must be at least 8 characters long")
        
        if not any(c.isupper() for c in request.new_password):
            raise HTTPException(status_code=400, detail="New password must contain at least one uppercase letter")
        
        if not any(c.islower() for c in request.new_password):
            raise HTTPException(status_code=400, detail="New password must contain at least one lowercase letter")
        
        if not any(c.isdigit() for c in request.new_password):
            raise HTTPException(status_code=400, detail="New password must contain at least one digit")
        
        # Check if passwords match
        if request.new_password != request.confirm_password:
            raise HTTPException(status_code=400, detail="New passwords do not match")
        
        # For first-time password set (unactivated users), skip current password check
        if current_user.must_change_password or not current_user.hashed_password:
            # This is first-time password setup
            pass
        else:
            # Regular password change - verify current password
            if not verify_password(request.current_password, current_user.hashed_password):
                raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Hash and set new password
        current_user.hashed_password = hash_password(request.new_password)
        current_user.must_change_password = False
        current_user.is_active = True
        db.commit()
        
        logger.info(f"Password changed successfully for user: {current_user.email}")
        
        return ChangePasswordResponse(
            message="Password changed successfully"
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error changing password: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        db.close()


@router.post("/logout")
async def logout(
    response: Response,
    current_user: User = Depends(get_current_user)
):
    """
    Logout user by clearing the HTTP-only cookie and setting is_online to false.
    """
    db = SessionLocal()
    try:
        # Set user as offline
        current_user.is_online = False
        db.commit()
        
        # Broadcast status change to admins via WebSocket
        status = "Inactive" if current_user.is_active else "Unactivated"
        await manager.broadcast_user_status_change(
            user_id=current_user.id,
            email=current_user.email,
            is_online=False,
            status=status
        )
        
        logger.info(f"User logged out: {current_user.email}")
    except Exception as e:
        logger.error(f"Error during logout: {str(e)}")
        db.rollback()
    finally:
        db.close()
    
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="strict"
    )
    return {"message": "Logged out successfully"}


@router.post("/forgot-password/status", response_model=ForgotPasswordStatusResponse)
async def check_forgot_password_status(request: ForgotPasswordStatusRequest):
    """
    Check user status for forgot password flow.
    Returns whether user can reset password based on their account status.
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == request.email).first()
        
        if not user:
            return ForgotPasswordStatusResponse(
                status="not_found",
                message="No account found with this email. Please contact your administrator.",
                can_reset=False
            )
        
        # Determine user status
        if not user.hashed_password:
            # Unactivated - no password set yet
            return ForgotPasswordStatusResponse(
                status="unactivated",
                message="This account is not activated. Please use First Login to set your password.",
                can_reset=False
            )
        elif user.is_active and user.last_login_at:
            # Active user
            return ForgotPasswordStatusResponse(
                status="active",
                message="Account is active. You can proceed to reset your password.",
                can_reset=True
            )
        else:
            # Inactive user (has password but not recently logged in)
            return ForgotPasswordStatusResponse(
                status="inactive",
                message="Account is inactive. You can proceed to reset your password.",
                can_reset=True
            )
            
    except Exception as e:
        logger.error(f"Error checking forgot password status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        db.close()

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


@router.get("/ws-token")
async def get_websocket_token(current_user: User = Depends(get_current_user)):
    """
    Get a WebSocket token for the authenticated user.
    This endpoint returns the JWT token that can be used for WebSocket connections.
    """
    from app.utils.jwt import create_access_token
    
    token_data = {
        "user_id": current_user.id,
        "email": current_user.email,
        "is_admin": current_user.is_admin,
        "must_change_password": current_user.must_change_password
    }
    access_token = create_access_token(data=token_data)
    
    return {
        "token": access_token,
        "user_id": current_user.id,
        "is_admin": current_user.is_admin
    }
