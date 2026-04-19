from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from app.database import User
from app.utils.password import hash_password
from app.services.kms_service import get_kms_service
from app.database import SessionLocal
from app.api.v1.auth import get_current_admin_user, get_current_user
import re
import logging
import json
from typing import List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class CreateCustomerRequest(BaseModel):
    email: str
    enterprise_name: str
    service_line_number: str  # Service line to associate with customer



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
    Associates customer with a service line and uses admin's Starlink credentials.
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
        
        # Verify admin has Starlink credentials
        if not current_admin.kms_client_id_secret_name or not current_admin.kms_client_secret_secret_name:
            raise HTTPException(
                status_code=500, 
                detail="Admin account does not have Starlink credentials configured. Please configure admin credentials first."
            )
        
        # Use admin's Starlink credentials (shared across all customers)
        # The service_line_number is just for association, credentials are shared
        kms = await get_kms_service()
        
        # Verify admin's credentials exist in Key Vault
        admin_client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
        admin_client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
        
        if not admin_client_id or not admin_client_secret:
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve admin Starlink credentials from Key Vault"
            )
        
        logger.info(f"Creating customer with admin's Starlink credentials for service line: {request.service_line_number}")
        
        # Create user record in database (without password - unactivated)
        new_user = User(
            email=request.email,
            hashed_password=None,  # No password yet - user will set on first login
            kms_client_id_secret_name=current_admin.kms_client_id_secret_name,  # Use admin's credential
            kms_client_secret_secret_name=current_admin.kms_client_secret_secret_name,  # Use admin's credential
            service_line_number=request.service_line_number,  # Store service line
            enterprise_name=request.enterprise_name,
            is_admin=False,
            is_active=False,  # Inactive until first login
            must_change_password=True  # Must set password on first login
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"Created new customer user: {request.email} (ID: {new_user.id}) - Service Line: {request.service_line_number} - Status: Unactivated")
        
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


@router.get("/admin/service-lines")
async def get_service_lines(
    address_reference_id: Optional[str] = None,
    search_string: Optional[str] = None,
    data_pool_id: Optional[str] = None,
    page: int = 0,
    order_by_created_date_descending: bool = True,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get all service lines from Starlink API.
    Supports filtering and pagination.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch admin credentials
        kms = await get_kms_service()
        
        # For admin, we need to use a global Starlink credential or iterate through customers
        # For now, we'll use the first customer's credentials or admin's own
        # This can be enhanced based on your business logic
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                return await service.get_service_lines(
                    address_reference_id=address_reference_id,
                    search_string=search_string,
                    data_pool_id=data_pool_id,
                    page=page,
                    order_by_created_date_descending=order_by_created_date_descending
                )
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    return await service.get_service_lines(
                        address_reference_id=address_reference_id,
                        search_string=search_string,
                        data_pool_id=data_pool_id,
                        page=page,
                        order_by_created_date_descending=order_by_created_date_descending
                    )
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching service lines: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch service lines: {str(e)}")


@router.get("/admin/service-lines/{service_line_number}")
async def get_service_line(
    service_line_number: str,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get detailed information about a specific service line.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_service_line(service_line_number)
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_service_line(service_line_number)
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching service line details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch service line details: {str(e)}")


@router.get("/admin/service-lines/{service_line_number}/billing-partial-periods")
async def get_billing_partial_periods(
    service_line_number: str,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get billing partial periods for a specific service line.
    Reference: https://starlink.readme.io/docs/understanding-proration
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_billing_partial_periods(service_line_number)
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_billing_partial_periods(service_line_number)
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching billing partial periods: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch billing partial periods: {str(e)}")


@router.get("/admin/service-lines/{service_line_number}/current-plan")
async def get_current_plan(
    service_line_number: str,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get current plan details for a specific service line.
    Returns servicePlan, dataBlocks (active, recurring, topUp), and pricing information.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_current_plan(service_line_number)
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_current_plan(service_line_number)
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching current plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch current plan: {str(e)}")


@router.get("/admin/service-lines/{service_line_number}/user-terminals")
async def get_user_terminals(
    service_line_number: str,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get user terminals associated with a specific service line.
    Uses the serviceLineNumbers parameter to filter terminals.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_user_terminals(service_line_number)
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_user_terminals(service_line_number)
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user terminals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user terminals: {str(e)}")


@router.get("/admin/service-lines/{service_line_number}/telemetry")
async def get_service_line_telemetry(
    service_line_number: str,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get telemetry for devices associated with a service line.
    Fetches telemetry stream and filters by service line devices.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                # Fetch telemetry stream with small batch for service line
                response = await service.get_telemetry_stream(batch_size=100, max_linger_ms=5000)
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    # Fetch telemetry stream with small batch for service line
                    response = await service.get_telemetry_stream(batch_size=100, max_linger_ms=5000)
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching service line telemetry: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch service line telemetry: {str(e)}")


@router.get("/admin/user-terminals/{user_terminal_id}")
async def get_user_terminal_details(
    user_terminal_id: str,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get detailed information for a specific user terminal.
    Includes L2VPN configuration (l2VpnCircuits array) and all terminal details.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_user_terminal_details(user_terminal_id)
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_user_terminal_details(user_terminal_id)
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user terminal details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user terminal details: {str(e)}")


@router.get("/admin/routers/{router_id}")
async def get_router_details(
    router_id: str,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get detailed information for a specific router.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_router_details(router_id)
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_router_details(router_id)
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching router details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch router details: {str(e)}")


@router.get("/admin/routers/configs/{config_id}")
async def get_router_config(
    config_id: str,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get router configuration.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_router_config(config_id)
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_router_config(config_id)
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching router config: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch router config: {str(e)}")


@router.get("/admin/routers/configs/default")
async def get_default_router_config(
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get default router configuration.
    Gets the router config id that will be assigned to any routers when they are first added to this account.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_default_router_config()
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_default_router_config()
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching default router config: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch default router config: {str(e)}")


@router.get("/admin/settings/kms/secrets")
async def list_kms_secrets(
    current_admin: User = Depends(get_current_admin_user)
):
    """
    List all secrets in Azure Key Vault (names only, not values).
    Admin can see what credentials are available to use.
    """
    from app.services.kms_service import get_kms_service
    
    try:
        kms = await get_kms_service()
        secrets = await kms.list_secrets()
        
        if secrets is None:
            raise HTTPException(status_code=500, detail="Failed to retrieve secrets from Key Vault")
        
        return {
            "secrets": secrets,
            "total": len(secrets)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list KMS secrets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list secrets: {str(e)}")


@router.post("/admin/settings/kms/credentials")
async def update_admin_starlink_credentials(
    request: dict,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Update admin's Starlink credentials in Azure Key Vault.
    Creates new secrets with specified names and values.
    """
    from app.services.kms_service import get_kms_service
    from sqlalchemy import text
    
    # Validate request
    client_id_secret_name = request.get('client_id_secret_name')
    client_id_value = request.get('client_id_value')
    client_secret_secret_name = request.get('client_secret_secret_name')
    client_secret_value = request.get('client_secret_value')
    
    if not all([client_id_secret_name, client_id_value, client_secret_secret_name, client_secret_value]):
        raise HTTPException(status_code=400, detail="All fields are required")
    
    db = SessionLocal()
    try:
        kms = await get_kms_service()
        
        # Store secrets in Key Vault
        success_id = await kms.set_secret(client_id_secret_name, client_id_value)
        success_secret = await kms.set_secret(client_secret_secret_name, client_secret_value)
        
        if not success_id or not success_secret:
            raise HTTPException(status_code=500, detail="Failed to store credentials in Key Vault")
        
        # Update admin's record to reference these secrets
        current_admin.kms_client_id_secret_name = client_id_secret_name
        current_admin.kms_client_secret_secret_name = client_secret_secret_name
        
        db.commit()
        db.refresh(current_admin)
        
        logger.info(f"Updated Starlink credentials for admin: {current_admin.email}")
        
        return {
            "message": "Starlink credentials updated successfully",
            "client_id_secret_name": client_id_secret_name,
            "client_secret_secret_name": client_secret_secret_name
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update credentials: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update credentials: {str(e)}")
    finally:
        db.close()


@router.post("/admin/settings/kms/update-current-credentials")
async def update_current_credentials(
    request: dict,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Update admin's credential references to use existing Key Vault secrets.
    Does NOT create new secrets - just updates the admin's references.
    """
    from sqlalchemy import text
    
    # Validate request
    client_id_secret_name = request.get('client_id_secret_name')
    client_secret_secret_name = request.get('client_secret_secret_name')
    
    logger.info(f"Updating credentials for admin {current_admin.email}: ID={client_id_secret_name}, Secret={client_secret_secret_name}")
    
    if not all([client_id_secret_name, client_secret_secret_name]):
        raise HTTPException(status_code=400, detail="Both secret names are required")
    
    db = SessionLocal()
    try:
        # Verify the secrets exist in Key Vault
        kms = await get_kms_service()
        
        logger.info(f"Verifying secret: {client_id_secret_name}")
        client_id = await kms.get_secret(client_id_secret_name)
        logger.info(f"Secret {client_id_secret_name} found: {client_id is not None}")
        
        logger.info(f"Verifying secret: {client_secret_secret_name}")
        client_secret = await kms.get_secret(client_secret_secret_name)
        logger.info(f"Secret {client_secret_secret_name} found: {client_secret is not None}")
        
        if client_id is None or client_secret is None:
            logger.error(f"Secrets not found - ID: {client_id_secret_name}, Secret: {client_secret_secret_name}")
            raise HTTPException(
                status_code=404, 
                detail=f"One or both secrets not found in Key Vault. Please create them first using 'Add New Starlink Credentials'"
            )
        
        # Update admin's record to reference these existing secrets
        current_admin.kms_client_id_secret_name = client_id_secret_name
        current_admin.kms_client_secret_secret_name = client_secret_secret_name
        
        db.commit()
        db.refresh(current_admin)
        
        logger.info(f"Updated admin credential references for: {current_admin.email}")
        
        return {
            "message": "Current credentials updated successfully",
            "client_id_secret_name": client_id_secret_name,
            "client_secret_secret_name": client_secret_secret_name
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update credentials: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to update credentials: {str(e)}")
    finally:
        db.close()


@router.delete("/admin/settings/kms/secrets/{secret_name}")
async def delete_kms_secret(
    secret_name: str,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Delete a secret from Azure Key Vault (soft delete).
    Warning: This cannot be undone easily.
    """
    from app.services.kms_service import get_kms_service
    
    try:
        kms = await get_kms_service()
        success = await kms.delete_secret(secret_name)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete secret")
        
        return {
            "message": f"Secret '{secret_name}' deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete secret: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete secret: {str(e)}")


@router.get("/admin/settings/kms/status")
async def get_kms_status(
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get KMS configuration status and current admin's credential references.
    """
    from app.services.kms_service import get_kms_service
    
    try:
        kms = await get_kms_service()
        
        # Check if admin has credentials configured
        has_credentials = bool(
            current_admin.kms_client_id_secret_name and 
            current_admin.kms_client_secret_secret_name
        )
        
        # Test if credentials are accessible
        credentials_accessible = False
        if has_credentials:
            try:
                client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
                client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
                credentials_accessible = bool(client_id and client_secret)
            except:
                credentials_accessible = False
        
        return {
            "vault_url": kms.vault_url,
            "vault_connected": bool(kms.vault_url),
            "has_credentials_configured": has_credentials,
            "client_id_secret_name": current_admin.kms_client_id_secret_name,
            "client_secret_secret_name": current_admin.kms_client_secret_secret_name,
            "credentials_accessible": credentials_accessible
        }
        
    except Exception as e:
        logger.error(f"Failed to get KMS status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get KMS status: {str(e)}")


@router.get("/customer/service-line/user-terminals")
async def get_customer_user_terminals(
    current_user: User = Depends(get_current_user)
):
    """
    Customer endpoint to get user terminals for their service line.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    # Check if user has a service line
    if not current_user.service_line_number:
        raise HTTPException(status_code=404, detail="No service line associated with your account")
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Use the user's own credentials
        if current_user.kms_client_id_secret_name and current_user.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_user.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_user.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_user_terminals(current_user.service_line_number)
                
                return response
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user terminals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user terminals: {str(e)}")


@router.get("/customer/service-line/telemetry")
async def get_customer_service_line_telemetry(
    current_user: User = Depends(get_current_user)
):
    """
    Customer endpoint to get telemetry for devices in their service line.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    # Check if user has a service line
    if not current_user.service_line_number:
        raise HTTPException(status_code=404, detail="No service line associated with your account")
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Use the user's own credentials
        if current_user.kms_client_id_secret_name and current_user.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_user.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_user.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                # Fetch telemetry stream with small batch for service line
                response = await service.get_telemetry_stream(batch_size=100, max_linger_ms=5000)
                return response
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching service line telemetry: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch service line telemetry: {str(e)}")


@router.get("/customer/service-line/current-plan")
async def get_customer_current_plan(
    current_user: User = Depends(get_current_user)
):
    """
    Customer endpoint to get current plan details for their service line.
    Returns servicePlan, dataBlocks, and pricing information.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    # Check if user has a service line
    if not current_user.service_line_number:
        raise HTTPException(status_code=404, detail="No service line associated with your account")
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Use the user's own credentials
        if current_user.kms_client_id_secret_name and current_user.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_user.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_user.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_current_plan(current_user.service_line_number)
                
                return response
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching current plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch current plan: {str(e)}")


@router.get("/customer/service-line")
async def get_customer_service_line(
    current_user: User = Depends(get_current_user)
):
    """
    Customer endpoint to get their own service line details.
    Customers can only access their own service line data.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    # Check if user has a service line
    if not current_user.service_line_number:
        raise HTTPException(status_code=404, detail="No service line associated with your account")
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Use the user's own credentials
        if current_user.kms_client_id_secret_name and current_user.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_user.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_user.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_service_line(current_user.service_line_number)
                
                return response
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching service line details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch service line details: {str(e)}")


@router.get("/customer/products")
async def get_customer_products(
    current_user: User = Depends(get_current_user)
):
    """
    Customer endpoint to get all available products from Starlink API.
    Customers can view products for reference.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Use the user's own credentials
        if current_user.kms_client_id_secret_name and current_user.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_user.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_user.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_products()
                
                return response
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")


@router.get("/customer/addresses/{address_reference_id}")
async def get_customer_address(
    address_reference_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Customer endpoint to get a specific address by reference ID from Starlink API.
    Customers can only access addresses.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Use the user's own credentials
        if current_user.kms_client_id_secret_name and current_user.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_user.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_user.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_address(address_reference_id)
                
                return response
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching address: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch address: {str(e)}")


@router.get("/admin/products")
async def get_products(
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get all available products from Starlink API.
    Returns full product details including names, descriptions, and pricing.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_products()
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_products()
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")


@router.get("/admin/products/{product_reference_id}")
async def get_product(
    product_reference_id: str,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get a specific product by reference ID from Starlink API.
    Returns full product details including name, description, and pricing.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_product(product_reference_id)
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_product(product_reference_id)
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch product: {str(e)}")


@router.get("/admin/addresses")
async def get_addresses(
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get all addresses from Starlink API.
    Returns list of all addresses with pagination.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_addresses()
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_addresses()
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching addresses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch addresses: {str(e)}")


@router.get("/admin/addresses/{address_reference_id}")
async def get_address(
    address_reference_id: str,
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get a specific address by reference ID from Starlink API.
    Returns full address details including address lines, locality, region, coordinates, etc.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_address(address_reference_id)
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_address(address_reference_id)
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching address: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch address: {str(e)}")


@router.get("/admin/routers/local-content")
async def get_router_local_content(
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get list of router local content files from Starlink API.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_router_local_content()
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_router_local_content()
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching router local content: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch router local content: {str(e)}")


@router.get("/admin/routers/sandbox/clients")
async def get_sandbox_clients(
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get sandbox clients from Starlink API.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_sandbox_clients()
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_sandbox_clients()
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sandbox clients: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch sandbox clients: {str(e)}")


@router.get("/admin/routers/configs/tls")
async def get_tls_configs(
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Admin endpoint to get TLS configurations from Starlink API.
    """
    from app.services.starlink_v2_service import StarlinkV2Service
    from app.services.kms_service import get_kms_service
    
    try:
        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_tls_configs()
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_tls_configs()
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching TLS configs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch TLS configs: {str(e)}")

        # Get KMS service to fetch credentials
        kms = await get_kms_service()
        
        # Get admin's own credentials if they have them
        if current_admin.kms_client_id_secret_name and current_admin.kms_client_secret_secret_name:
            client_id = await kms.get_secret(current_admin.kms_client_id_secret_name)
            client_secret = await kms.get_secret(current_admin.kms_client_secret_secret_name)
            
            if client_id and client_secret:
                service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                response = await service.get_tls_configs()
                
                return response
        
        # If admin doesn't have credentials, try first customer
        db = SessionLocal()
        try:
            first_customer = db.query(User).filter(User.is_admin == False).first()
            if first_customer:
                client_id = await kms.get_secret(first_customer.kms_client_id_secret_name)
                client_secret = await kms.get_secret(first_customer.kms_client_secret_secret_name)
                
                if client_id and client_secret:
                    service = StarlinkV2Service(client_id=client_id, client_secret=client_secret)
                    response = await service.get_tls_configs()
                    
                    return response
        finally:
            db.close()
        
        raise HTTPException(status_code=500, detail="No Starlink credentials available")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching TLS configs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch TLS configs: {str(e)}")

