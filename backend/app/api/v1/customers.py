from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.database import User
from app.utils.password import hash_password
from app.services.kms_service import get_kms_service
from app.database import SessionLocal
from app.api.v1.auth import get_current_admin_user
import re
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class CreateCustomerRequest(BaseModel):
    email: str
    enterprise_name: str
    starlink_client_id: str
    starlink_client_secret: str
    password: str
    confirm_password: str


class CreateCustomerResponse(BaseModel):
    message: str
    user_id: int
    email: str


@router.post("/admin/customers", response_model=CreateCustomerResponse)
async def create_customer(
    request: CreateCustomerRequest,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to create a new customer.
    Stores Starlink credentials in Azure Key Vault and user info in database.
    """
    db = SessionLocal()
    try:
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, request.email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Validate password strength
        if len(request.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        
        if not re.search(r'[A-Z]', request.password):
            raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', request.password):
            raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
        
        if not re.search(r'[0-9]', request.password):
            raise HTTPException(status_code=400, detail="Password must contain at least one digit")
        
        # Check if passwords match
        if request.password != request.confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match")
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password
        hashed_password = hash_password(request.password)
        
        # Generate unique secret names for Key Vault
        client_id_secret_name = f"customer-{request.email.replace('@', '-').replace('.', '-')}-client-id"
        client_secret_secret_name = f"customer-{request.email.replace('@', '-').replace('.', '-')}-client-secret"
        
        # Store credentials in Azure Key Vault
        kms = await get_kms_service()
        
        success_id = await kms.set_secret(client_id_secret_name, request.starlink_client_id)
        if not success_id:
            raise HTTPException(status_code=500, detail="Failed to store Client ID in Key Vault")
        
        success_secret = await kms.set_secret(client_secret_secret_name, request.starlink_client_secret)
        if not success_secret:
            raise HTTPException(status_code=500, detail="Failed to store Client Secret in Key Vault")
        
        logger.info(f"Successfully stored credentials in Key Vault for customer: {request.email}")
        
        # Create user record in database
        new_user = User(
            email=request.email,
            hashed_password=hashed_password,
            kms_client_id_secret_name=client_id_secret_name,
            kms_client_secret_secret_name=client_secret_secret_name,
            enterprise_name=request.enterprise_name,
            is_admin=False
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"Created new customer user: {request.email} (ID: {new_user.id})")
        
        return CreateCustomerResponse(
            message="Customer created successfully",
            user_id=new_user.id,
            email=new_user.email
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating customer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        db.close()

