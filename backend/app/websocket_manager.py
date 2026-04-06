"""
WebSocket connection manager for real-time updates.
Handles multiple client connections and broadcasts messages.
"""
from fastapi import WebSocket
from typing import Dict, List
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Store active connections: {user_id: [websocket_connections]}
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # Admin connections (broadcast to all admins)
        self.admin_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket, user_id: int = None, is_admin: bool = False):
        """Accept WebSocket connection and store it"""
        await websocket.accept()
        
        if is_admin:
            self.admin_connections.append(websocket)
            logger.info(f"Admin WebSocket connected. Total admin connections: {len(self.admin_connections)}")
        else:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
            logger.info(f"User {user_id} WebSocket connected. Total connections: {len(self.active_connections[user_id])}")
    
    def disconnect(self, websocket: WebSocket, user_id: int = None, is_admin: bool = False):
        """Remove WebSocket connection"""
        if is_admin:
            if websocket in self.admin_connections:
                self.admin_connections.remove(websocket)
                logger.info(f"Admin WebSocket disconnected. Total admin connections: {len(self.admin_connections)}")
        else:
            if user_id and user_id in self.active_connections:
                if websocket in self.active_connections[user_id]:
                    self.active_connections[user_id].remove(websocket)
                    logger.info(f"User {user_id} WebSocket disconnected. Total connections: {len(self.active_connections[user_id])}")
                
                # Clean up empty user connections
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to a specific WebSocket connection"""
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    async def broadcast_to_user(self, user_id: int, message: dict):
        """Send message to all connections for a specific user"""
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending to user {user_id}: {e}")
                    disconnected.append(connection)
            
            # Clean up disconnected connections
            for conn in disconnected:
                self.active_connections[user_id].remove(conn)
    
    async def broadcast_to_admins(self, message: dict):
        """Send message to all admin connections"""
        disconnected = []
        for connection in self.admin_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending to admin: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected connections
        for conn in disconnected:
            if conn in self.admin_connections:
                self.admin_connections.remove(conn)
    
    async def broadcast_user_status_change(self, user_id: int, email: str, is_online: bool, status: str):
        """Broadcast user status change to admins"""
        message = {
            "type": "user_status_change",
            "user_id": user_id,
            "email": email,
            "is_online": is_online,
            "status": status,
            "timestamp": __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()
        }
        await self.broadcast_to_admins(message)
        logger.info(f"Broadcasted status change for user {email}: {status}")


# Global WebSocket manager instance
manager = ConnectionManager()
