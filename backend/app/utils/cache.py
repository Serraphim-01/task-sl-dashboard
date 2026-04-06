"""
Two-Layer Caching System
Layer 1: Application In-Memory Cache using aiocache
Layer 2: HTTP Cache Headers for client-side caching
"""
from aiocache import cached, Cache
from aiocache.serializers import JsonSerializer
from functools import wraps
from fastapi import Response
from typing import Optional, Dict, Any
import time


# ==================== CACHE CONFIGURATION ====================

class CacheConfig:
    """Centralized cache configuration"""
    
    # Layer 1: In-Memory Cache TTLs (seconds)
    TTL_ACCOUNT_INFO = 300          # 5 minutes
    TTL_DEVICE_LIST = 180           # 3 minutes
    TTL_DEVICE_INFO = 120           # 2 minutes
    TTL_DEVICE_STATUS = 30          # 30 seconds (frequently changing)
    TTL_TELEMETRY = 15              # 15 seconds (real-time data)
    TTL_STATISTICS = 300            # 5 minutes
    TTL_TASKS = 60                  # 1 minute
    TTL_NETWORK_CONFIG = 300        # 5 minutes
    TTL_ALERTS = 60                 # 1 minute
    
    # Layer 2: HTTP Cache Headers (seconds)
    HTTP_CACHE_SHORT = 60           # 1 minute
    HTTP_CACHE_MEDIUM = 300         # 5 minutes
    HTTP_CACHE_LONG = 3600          # 1 hour
    
    # Cache key prefixes
    PREFIX_STARLINK = "starlink"
    PREFIX_ACCOUNT = "account"
    PREFIX_DEVICE = "device"
    PREFIX_TELEMETRY = "telemetry"
    PREFIX_TASKS = "tasks"
    PREFIX_ALERTS = "alerts"


# ==================== LAYER 1: IN-MEMORY CACHE ====================

# Initialize aiocache with in-memory backend
cache = Cache(Cache.MEMORY, serializer=JsonSerializer())


async def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics"""
    try:
        # Note: Memory cache doesn't provide detailed stats like Redis
        # For production, consider using Redis backend
        return {
            "backend": "memory",
            "note": "Memory cache doesn't expose detailed stats. Use Redis for production."
        }
    except Exception as e:
        return {"error": str(e)}


async def invalidate_cache_pattern(pattern: str) -> int:
    """
    Invalidate all cache keys matching a pattern
    
    Args:
        pattern: Pattern to match (e.g., "starlink:device:*")
        
    Returns:
        Number of keys deleted
    """
    try:
        # Memory cache doesn't support pattern deletion natively
        # We need to track keys manually or use clear()
        # For production, use Redis backend which supports pattern deletion
        return 0
    except Exception:
        return 0


async def clear_all_cache() -> bool:
    """Clear all cached data"""
    try:
        await cache.clear()
        return True
    except Exception:
        return False


async def invalidate_user_cache(user_id: int, resource_type: Optional[str] = None) -> bool:
    """
    Invalidate cache for a specific user
    
    Args:
        user_id: User ID
        resource_type: Optional resource type (account, device, telemetry, etc.)
    """
    try:
        # Note: For memory cache, we can't selectively delete by prefix
        # Clear all cache for simplicity (use Redis for granular control)
        await cache.clear()
        return True
    except Exception:
        return False


# ==================== LAYER 2: HTTP CACHE HEADERS ====================

def set_cache_headers(
    response: Response,
    max_age: int = CacheConfig.HTTP_CACHE_MEDIUM,
    public: bool = False,
    no_transform: bool = True
):
    """
    Set HTTP cache control headers on response (Layer 2)
    
    Args:
        response: FastAPI Response object
        max_age: Cache-Control max-age in seconds
        public: If True, allows caching by any cache (CDN, browser, etc.)
        no_transform: If True, prevents intermediaries from modifying the response
    """
    cache_control = f"{'public' if public else 'private'}, max-age={max_age}"
    if no_transform:
        cache_control += ", no-transform"
    
    response.headers["Cache-Control"] = cache_control
    response.headers["X-Cache-Layer"] = "2"
    response.headers["X-Cache-Max-Age"] = str(max_age)
    
    # Set Expires header for HTTP/1.0 compatibility
    expires_time = time.time() + max_age
    from email.utils import formatdate
    response.headers["Expires"] = formatdate(expires_time, usegmt=True)


def set_no_cache_headers(response: Response):
    """Set headers to prevent caching"""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["X-Cache-Layer"] = "disabled"


# ==================== CACHE DECORATORS ====================

def cache_starlink_data(
    ttl: int = CacheConfig.TTL_DEVICE_INFO,
    key_prefix: str = CacheConfig.PREFIX_STARLINK,
    key_suffix: Optional[str] = None,
    http_cache_ttl: Optional[int] = None,
    http_cache_public: bool = False
):
    """
    Decorator for caching Starlink API responses (both layers)
    
    Args:
        ttl: Layer 1 cache TTL in seconds
        key_prefix: Cache key prefix
        key_suffix: Optional suffix for cache key
        http_cache_ttl: Layer 2 HTTP cache TTL (None to disable)
        http_cache_public: If True, allows public caching
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract response from kwargs if present
            response = kwargs.get('response')
            
            # Generate cache key
            user_id = kwargs.get('current_user', None)
            if hasattr(user_id, 'id'):
                user_id = user_id.id
            else:
                user_id = 'unknown'
                
            resource_id = kwargs.get('device_id', kwargs.get('task_id', kwargs.get('alert_id', 'all')))
            suffix = f":{key_suffix}" if key_suffix else ""
            cache_key = f"{key_prefix}:{user_id}:{resource_id}{suffix}:{func.__name__}"
            
            # Layer 1: Check in-memory cache
            cached_data = await cache.get(cache_key)
            if cached_data is not None:
                # Set Layer 2 headers if response object provided
                if response and http_cache_ttl:
                    set_cache_headers(response, http_cache_ttl, http_cache_public)
                    response.headers["X-Cache-Status"] = "HIT"
                    response.headers["X-Cache-Layer"] = "1+2"
                
                return cached_data
            
            # Cache MISS - call original function
            result = await func(*args, **kwargs)
            
            # Store in Layer 1 cache
            await cache.set(cache_key, result, ttl=ttl)
            
            # Set Layer 2 headers if response object provided
            if response and http_cache_ttl:
                set_cache_headers(response, http_cache_ttl, http_cache_public)
                response.headers["X-Cache-Status"] = "MISS"
                response.headers["X-Cache-Layer"] = "1+2"
            
            return result
        return wrapper
    return decorator


def cache_account_info(func):
    """Decorator for caching account information"""
    return cache_starlink_data(
        ttl=CacheConfig.TTL_ACCOUNT_INFO,
        key_prefix=CacheConfig.PREFIX_ACCOUNT,
        http_cache_ttl=CacheConfig.HTTP_CACHE_MEDIUM,
        http_cache_public=False
    )(func)


def cache_device_list(func):
    """Decorator for caching device list"""
    return cache_starlink_data(
        ttl=CacheConfig.TTL_DEVICE_LIST,
        key_prefix=CacheConfig.PREFIX_DEVICE,
        key_suffix="list",
        http_cache_ttl=CacheConfig.HTTP_CACHE_SHORT,
        http_cache_public=False
    )(func)


def cache_device_info(func):
    """Decorator for caching device information"""
    return cache_starlink_data(
        ttl=CacheConfig.TTL_DEVICE_INFO,
        key_prefix=CacheConfig.PREFIX_DEVICE,
        http_cache_ttl=CacheConfig.HTTP_CACHE_SHORT,
        http_cache_public=False
    )(func)


def cache_telemetry(func):
    """Decorator for caching telemetry data (short TTL)"""
    return cache_starlink_data(
        ttl=CacheConfig.TTL_TELEMETRY,
        key_prefix=CacheConfig.PREFIX_TELEMETRY,
        http_cache_ttl=CacheConfig.HTTP_CACHE_SHORT,
        http_cache_public=False
    )(func)


def cache_tasks(func):
    """Decorator for caching task list"""
    return cache_starlink_data(
        ttl=CacheConfig.TTL_TASKS,
        key_prefix=CacheConfig.PREFIX_TASKS,
        http_cache_ttl=CacheConfig.HTTP_CACHE_SHORT,
        http_cache_public=False
    )(func)


def cache_alerts(func):
    """Decorator for caching alerts"""
    return cache_starlink_data(
        ttl=CacheConfig.TTL_ALERTS,
        key_prefix=CacheConfig.PREFIX_ALERTS,
        http_cache_ttl=CacheConfig.HTTP_CACHE_SHORT,
        http_cache_public=False
    )(func)
