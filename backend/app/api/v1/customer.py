from fastapi import APIRouter, HTTPException, Depends, Query, Body
from app.database import User
from app.api.v1.auth import get_current_user
from app.services.kms_service import get_kms_service
from app.services.starlink_v2_service import StarlinkV2Service
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)
router = APIRouter()


async def get_starlink_service(current_user: User) -> StarlinkV2Service:
    """
    Helper function to create Starlink V2 Service instance for the current user.
    Fetches credentials from Key Vault and initializes the service.
    """
    kms = await get_kms_service()
    
    client_id = await kms.get_secret(current_user.kms_client_id_secret_name)
    client_secret = await kms.get_secret(current_user.kms_client_secret_secret_name)
    
    if not client_id or not client_secret:
        logger.error(f"Failed to retrieve credentials from Key Vault for user {current_user.email}")
        raise HTTPException(status_code=500, detail="Failed to retrieve Starlink credentials")
    
    return StarlinkV2Service(client_id=client_id, client_secret=client_secret)


# ==================== ACCOUNT ENDPOINTS ====================

@router.get("/starlink/account")
async def get_account_info(current_user: User = Depends(get_current_user)):
    """Get account information"""
    try:
        service = await get_starlink_service(current_user)
        result = await service.get_account()
        # Return empty data if account not found
        if not result or result == {}:
            return {"message": "No account information available"}
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching account info: {str(e)}")
        error_msg = str(e)
        if "404" in error_msg and "not_found" in error_msg:
            return {"message": "Account not found. Please verify your Starlink credentials."}
        raise HTTPException(status_code=500, detail=f"Failed to fetch account info: {error_msg}")


@router.get("/starlink/account/users")
async def get_account_users(current_user: User = Depends(get_current_user)):
    """List all users on the account"""
    try:
        service = await get_starlink_service(current_user)
        return await service.get_account_users()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching account users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/starlink/account/users")
async def add_account_user(
    user_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Add a new user to the account"""
    try:
        service = await get_starlink_service(current_user)
        return await service.add_account_user(user_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding account user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/starlink/account/users/{user_id}")
async def remove_account_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove a user from the account"""
    try:
        service = await get_starlink_service(current_user)
        return await service.remove_account_user(user_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing account user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DEVICE ENDPOINTS ====================

@router.get("/starlink/devices")
async def list_devices(current_user: User = Depends(get_current_user)):
    """List all devices on the account"""
    try:
        service = await get_starlink_service(current_user)
        result = await service.list_devices()
        # Return empty array if no devices found
        if not result or result == {}:
            return {"devices": [], "message": "No devices found for this account"}
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing devices: {str(e)}")
        # Provide user-friendly error message
        error_msg = str(e)
        if "404" in error_msg and "not_found" in error_msg:
            return {"devices": [], "message": "No devices found. Please contact support if you believe this is an error."}
        raise HTTPException(status_code=500, detail=f"Failed to fetch devices: {error_msg}")


@router.get("/starlink/devices/{device_id}")
async def get_device(
    device_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get specific device information"""
    try:
        service = await get_starlink_service(current_user)
        return await service.get_device(device_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching device: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/starlink/devices/{device_id}/status")
async def get_device_status(
    device_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get device status"""
    try:
        service = await get_starlink_service(current_user)
        return await service.get_device_status(device_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching device status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/starlink/devices/{device_id}/location")
async def get_device_location(
    device_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get device location"""
    try:
        service = await get_starlink_service(current_user)
        return await service.get_device_location(device_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching device location: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/starlink/devices/{device_id}/diagnostics")
async def get_device_diagnostics(
    device_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get device diagnostics"""
    try:
        service = await get_starlink_service(current_user)
        return await service.get_device_diagnostics(device_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching device diagnostics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== TELEMETRY & STATISTICS ENDPOINTS ====================

@router.get("/starlink/telemetry")
async def get_telemetry(
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    current_user: User = Depends(get_current_user)
):
    """Get real-time telemetry data"""
    try:
        service = await get_starlink_service(current_user)
        result = await service.get_telemetry(device_id)
        if not result or result == {}:
            return {"message": "No telemetry data available"}
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching telemetry: {str(e)}")
        error_msg = str(e)
        if "404" in error_msg and "not_found" in error_msg:
            return {"message": "No telemetry data available for this device"}
        raise HTTPException(status_code=500, detail=f"Failed to fetch telemetry: {error_msg}")


@router.get("/starlink/statistics")
async def get_statistics(
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    start_time: Optional[str] = Query(None, description="Start time (ISO 8601)"),
    end_time: Optional[str] = Query(None, description="End time (ISO 8601)"),
    current_user: User = Depends(get_current_user)
):
    """Get historical statistics"""
    try:
        service = await get_starlink_service(current_user)
        return await service.get_statistics(device_id, start_time, end_time)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== TASK MANAGEMENT ENDPOINTS ====================

@router.get("/starlink/tasks")
async def list_tasks(
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    current_user: User = Depends(get_current_user)
):
    """List all tasks"""
    try:
        service = await get_starlink_service(current_user)
        return await service.list_tasks(device_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/starlink/tasks")
async def create_task(
    task_data: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Create a new task"""
    try:
        service = await get_starlink_service(current_user)
        return await service.create_task(task_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/starlink/tasks/{task_id}")
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get task status"""
    try:
        service = await get_starlink_service(current_user)
        return await service.get_task(task_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/starlink/tasks/{task_id}")
async def cancel_task(
    task_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancel a task"""
    try:
        service = await get_starlink_service(current_user)
        return await service.cancel_task(task_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error canceling task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== NETWORK CONFIGURATION ENDPOINTS ====================

@router.get("/starlink/network/config/{device_id}")
async def get_network_config(
    device_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get network configuration"""
    try:
        service = await get_starlink_service(current_user)
        return await service.get_network_config(device_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching network config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/starlink/network/config/{device_id}")
async def update_network_config(
    device_id: str,
    config: Dict[str, Any] = Body(...),
    current_user: User = Depends(get_current_user)
):
    """Update network configuration"""
    try:
        service = await get_starlink_service(current_user)
        return await service.update_network_config(device_id, config)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating network config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ALERTS & NOTIFICATIONS ENDPOINTS ====================

@router.get("/starlink/alerts")
async def get_alerts(
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    current_user: User = Depends(get_current_user)
):
    """Get alerts"""
    try:
        service = await get_starlink_service(current_user)
        return await service.get_alerts(device_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/starlink/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user)
):
    """Acknowledge an alert"""
    try:
        service = await get_starlink_service(current_user)
        return await service.acknowledge_alert(alert_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error acknowledging alert: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
