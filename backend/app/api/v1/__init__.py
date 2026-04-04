from .customers import router as customers_router
from .telemetry import telemetry as telemetry_router
from .health import router as health_router
from .customer import router as customer_router
from .auth import router as auth_router
__all__ = ["customers_router", "telemetry_router", "health_router", "customer_router", "auth_router"]

