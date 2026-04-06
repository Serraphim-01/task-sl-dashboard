import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  user_id?: number;
  email?: string;
  is_online?: boolean;
  status?: string;
  timestamp?: string;
  message?: string;
  is_admin?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  messages: WebSocketMessage[];
  reconnect: () => void;
}

/**
 * WebSocket hook for real-time updates
 * @param userId - User ID for the connection
 * @param token - JWT token for authentication
 * @param enabled - Whether to establish connection (default: true)
 */
export const useWebSocket = (
  userId: number | null,
  token: string | null,
  enabled: boolean = true
): UseWebSocketReturn => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);

  const connect = useCallback(() => {
    if (!userId || !token || !enabled) {
      return;
    }

    // Close existing connection if any
    if (ws.current) {
      ws.current.close();
    }

    try {
      // Connect to WebSocket endpoint
      const wsUrl = `ws://localhost:8000/api/v1/ws/${userId}?token=${token}`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        
        // Clear any reconnection timeout
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          setLastMessage(data);
          setMessages((prev) => [...prev.slice(-50), data]); // Keep last 50 messages
        } catch (error) {
          // Silently ignore parse errors
        }
      };

      ws.current.onclose = (event) => {
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        if (enabled && event.code !== 4001 && event.code !== 4002 && event.code !== 4003) {
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.current.onerror = (error) => {
        // Silently handle errors - reconnection will be attempted
      };

      // Send ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      // Cleanup on unmount
      return () => {
        clearInterval(pingInterval);
      };
    } catch (error) {
      // Silently handle connection errors
    }
  }, [userId, token, enabled]);

  // Establish connection on mount or when dependencies change
  useEffect(() => {
    const cleanup = connect();
    
    return () => {
      if (cleanup) cleanup();
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }
    connect();
  }, [connect]);

  return {
    isConnected,
    lastMessage,
    messages,
    reconnect,
  };
};
