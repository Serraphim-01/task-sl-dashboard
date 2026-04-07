from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.database import User
from app.utils.password import hash_password
from app.services.kms_service import get_kms_service
from app.database import SessionLocal
from app.api.v1.auth import get_current_admin_user
import re
import logging
from typing import List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class CreateCustomerRequest(BaseModel):
    email: str
    enterprise_name: str
    starlink_client_id: str
    starlink_client_secret: str



class CreateCustomerResponse(BaseModel):
    message: str
    user_id: int
    email: str
    status: str  # Will be "Unactivated" initially


class UserListItem(BaseModel):
    user_id: int
    email: str
    enterprise_name: str
    is_admin: bool
    is_active: bool
    is_online: bool
    must_change_password: bool
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    
    @property
    def status(self) -> str:
        """Determine user status based on their state"""
        if not self.is_active and not self.last_login_at:
            return "Unactivated"  # Never logged in, no password set
        elif self.is_online:
            return "Active"  # Currently logged in
        else:
            return "Inactive"  # Logged out or session expired


class UserListResponse(BaseModel):
    users: List[UserListItem]
    total: int


@router.post("/admin/customers", response_model=CreateCustomerResponse)
async def create_customer(
    request: CreateCustomerRequest,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to create a new customer.
    Stores Starlink credentials in Azure Key Vault and user info in database.
    Customer will be created with Unactivated status and must set password on first login.
    """
    db = SessionLocal()
    try:
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, request.email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Check if email already exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
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
        
        # Create user record in database (without password - unactivated)
        new_user = User(
            email=request.email,
            hashed_password=None,  # No password yet - user will set on first login
            kms_client_id_secret_name=client_id_secret_name,
            kms_client_secret_secret_name=client_secret_secret_name,
            enterprise_name=request.enterprise_name,
            is_admin=False,
            is_active=False,  # Inactive until first login
            must_change_password=True  # Must set password on first login
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"Created new customer user: {request.email} (ID: {new_user.id}) - Status: Unactivated")
        
        return CreateCustomerResponse(
            message="Customer created successfully. User must set password on first login.",
            user_id=new_user.id,
            email=new_user.email,
            status="Unactivated"
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


@router.get("/admin/users", response_model=UserListResponse)
async def list_users(current_admin: User = Depends(get_current_admin_user)):
    """
    Admin endpoint to list all users with their status.
    """
    db = SessionLocal()
    try:
        users = db.query(User).all()
        user_list = [
            UserListItem(
                user_id=user.id,
                email=user.email,
                enterprise_name=user.enterprise_name,
                is_admin=user.is_admin,
                is_active=user.is_active,
                is_online=user.is_online,
                must_change_password=user.must_change_password,
                last_login_at=user.last_login_at,
                created_at=user.created_at
            )
            for user in users
        ]
        return UserListResponse(users=user_list, total=len(user_list))
    finally:
        db.close()


@router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: int,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to delete a user from both database and Key Vault.
    """
    db = SessionLocal()
    try:
        # Get the user to delete
        user_to_delete = db.query(User).filter(User.id == user_id).first()
        
        if not user_to_delete:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent admin from deleting themselves
        if user_to_delete.id == current_admin.id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        logger.info(f"Deleting user: {user_to_delete.email} (ID: {user_id})")
        
        # Delete secrets from Key Vault
        kms = await get_kms_service()
        
        try:
            # Note: Azure Key Vault soft-deletes secrets, they can be purged later
            # We'll set them to empty values as a workaround
            await kms.set_secret(user_to_delete.kms_client_id_secret_name, "")
            await kms.set_secret(user_to_delete.kms_client_secret_secret_name, "")
            logger.info(f"Cleared Key Vault secrets for user: {user_to_delete.email}")
        except Exception as e:
            logger.warning(f"Failed to clear Key Vault secrets: {e}")
            # Continue with DB deletion even if KMS fails
        
        # Delete user from database
        db.delete(user_to_delete)
        db.commit()
        
        logger.info(f"Successfully deleted user: {user_to_delete.email} (ID: {user_id})")
        
        return {"message": f"User {user_to_delete.email} deleted successfully"}
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        db.close()

