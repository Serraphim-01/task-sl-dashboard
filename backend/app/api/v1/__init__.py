from .customers import customers as customers_router
from .telemetry import telemetry as telemetry_router
from .health import router as health_router
__all__ = ["customers_router", "telemetry_router", "health_router"]

