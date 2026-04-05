"""
Starlink V2 API Service
Provides methods to interact with all Starlink V2 API endpoints.
"""
import httpx
import logging
from typing import Optional, Dict, Any
from app.services.kms_service import get_kms_service

logger = logging.getLogger(__name__)


class StarlinkV2Service:
    """Service class for interacting with Starlink V2 API"""
    
    BASE_URL = "https://starlink.com/api/public/v2"
    
    def __init__(self, client_id: str, client_secret: str):
        """
        Initialize Starlink V2 Service
        
        Args:
            client_id: Starlink Client ID
            client_secret: Starlink Client Secret
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self._access_token: Optional[str] = None
    
    async def _get_access_token(self) -> str:
        """
        Obtain access token from Starlink OAuth endpoint
        
        Returns:
            Access token string
        """
        if self._access_token:
            return self._access_token
            
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://starlink.com/api/auth/connect/token",
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    data={
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "grant_type": "client_credentials",
                    },
                    timeout=10,
                )
                
                if response.status_code != 200:
                    logger.error(f"Token request failed: {response.status_code} - {response.text}")
                    raise Exception(f"Failed to obtain access token: {response.status_code}")
                
                token_data = response.json()
                self._access_token = token_data.get("access_token")
                
                if not self._access_token:
                    raise Exception("No access token in response")
                
                logger.info("Successfully obtained Starlink access token")
                return self._access_token
                
            except Exception as e:
                logger.error(f"Error obtaining access token: {str(e)}")
                raise
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        params: Optional[Dict] = None,
        json_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Make authenticated request to Starlink API
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint path
            params: Query parameters
            json_data: JSON body for POST/PUT requests
            
        Returns:
            Response data as dictionary
        """
        token = await self._get_access_token()
        
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.BASE_URL}{endpoint}"
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
                
                if method == "GET":
                    response = await client.get(url, headers=headers, params=params, timeout=30)
                elif method == "POST":
                    response = await client.post(url, headers=headers, params=params, json=json_data, timeout=30)
                elif method == "PUT":
                    response = await client.put(url, headers=headers, params=params, json=json_data, timeout=30)
                elif method == "DELETE":
                    response = await client.delete(url, headers=headers, params=params, timeout=30)
                else:
                    raise ValueError(f"Unsupported HTTP method: {method}")
                
                if response.status_code == 401:
                    # Token might be expired, clear it and retry once
                    self._access_token = None
                    token = await self._get_access_token()
                    headers["Authorization"] = f"Bearer {token}"
                    
                    if method == "GET":
                        response = await client.get(url, headers=headers, params=params, timeout=30)
                    elif method == "POST":
                        response = await client.post(url, headers=headers, params=params, json=json_data, timeout=30)
                    elif method == "PUT":
                        response = await client.put(url, headers=headers, params=params, json=json_data, timeout=30)
                    elif method == "DELETE":
                        response = await client.delete(url, headers=headers, params=params, timeout=30)
                
                if response.status_code >= 400:
                    error_detail = f"Starlink API error: {response.status_code} - {response.text}"
                    logger.warning(f"Starlink API error {response.status_code}: {response.text}")
                    
                    # Return empty data for expected "not found" scenarios
                    if response.status_code == 404:
                        try:
                            error_body = response.json()
                            if "not_found" in error_body.get("errors", [{}])[0].get("errorMessage", ""):
                                logger.info("Resource not found - returning empty data")
                                return {}  # Return empty dict instead of raising exception
                        except:
                            pass
                    
                    raise Exception(error_detail)
                
                return response.json() if response.content else {}
                
            except Exception as e:
                logger.error(f"Error making Starlink API request: {str(e)}")
                raise
    
    # ==================== ACCOUNT ENDPOINTS ====================
    
    async def get_account(self) -> Dict[str, Any]:
        """Get account information"""
        return await self._make_request("GET", "/account")
    
    async def get_account_users(self) -> Dict[str, Any]:
        """List all users on the account"""
        return await self._make_request("GET", "/account/users")
    
    async def add_account_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new user to the account"""
        return await self._make_request("POST", "/account/users", json_data=user_data)
    
    async def remove_account_user(self, user_id: str) -> Dict[str, Any]:
        """Remove a user from the account"""
        return await self._make_request("DELETE", f"/account/users/{user_id}")
    
    # ==================== DEVICE ENDPOINTS ====================
    
    async def list_devices(self) -> Dict[str, Any]:
        """List all devices on the account"""
        return await self._make_request("GET", "/devices")
    
    async def get_device(self, device_id: str) -> Dict[str, Any]:
        """Get specific device information"""
        return await self._make_request("GET", f"/devices/{device_id}")
    
    async def get_device_status(self, device_id: str) -> Dict[str, Any]:
        """Get device status"""
        return await self._make_request("GET", f"/devices/{device_id}/status")
    
    async def get_device_location(self, device_id: str) -> Dict[str, Any]:
        """Get device location"""
        return await self._make_request("GET", f"/devices/{device_id}/location")
    
    async def get_device_diagnostics(self, device_id: str) -> Dict[str, Any]:
        """Get device diagnostics"""
        return await self._make_request("GET", f"/devices/{device_id}/diagnostics")
    
    # ==================== TELEMETRY ENDPOINTS ====================
    
    async def get_telemetry(self, device_id: Optional[str] = None) -> Dict[str, Any]:
        """Get real-time telemetry data"""
        params = {"deviceId": device_id} if device_id else {}
        return await self._make_request("GET", "/telemetry", params=params)
    
    async def get_statistics(
        self, 
        device_id: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get historical statistics"""
        params = {}
        if device_id:
            params["deviceId"] = device_id
        if start_time:
            params["startTime"] = start_time
        if end_time:
            params["endTime"] = end_time
        
        return await self._make_request("GET", "/statistics", params=params)
    
    # ==================== TASK ENDPOINTS ====================
    
    async def list_tasks(self, device_id: Optional[str] = None) -> Dict[str, Any]:
        """List all tasks"""
        params = {"deviceId": device_id} if device_id else {}
        return await self._make_request("GET", "/tasks", params=params)
    
    async def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new task"""
        return await self._make_request("POST", "/tasks", json_data=task_data)
    
    async def get_task(self, task_id: str) -> Dict[str, Any]:
        """Get task status"""
        return await self._make_request("GET", f"/tasks/{task_id}")
    
    async def cancel_task(self, task_id: str) -> Dict[str, Any]:
        """Cancel a task"""
        return await self._make_request("DELETE", f"/tasks/{task_id}")
    
    # ==================== NETWORK CONFIGURATION ====================
    
    async def get_network_config(self, device_id: str) -> Dict[str, Any]:
        """Get network configuration"""
        return await self._make_request("GET", f"/devices/{device_id}/network/config")
    
    async def update_network_config(self, device_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Update network configuration"""
        return await self._make_request("PUT", f"/devices/{device_id}/network/config", json_data=config)
    
    # ==================== ALERTS & NOTIFICATIONS ====================
    
    async def get_alerts(self, device_id: Optional[str] = None) -> Dict[str, Any]:
        """Get alerts"""
        params = {"deviceId": device_id} if device_id else {}
        return await self._make_request("GET", "/alerts", params=params)
    
    async def acknowledge_alert(self, alert_id: str) -> Dict[str, Any]:
        """Acknowledge an alert"""
        return await self._make_request("POST", f"/alerts/{alert_id}/acknowledge")
