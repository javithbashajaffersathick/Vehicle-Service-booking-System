from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserUpdate,
    UserResponse,
    CustomerProfileBase,
    CustomerProfileCreate,
    CustomerProfileUpdate,
    CustomerProfileResponse,
    MechanicProfileResponse,
    Token,
    TokenData,
)
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleUpdate,
    VehicleResponse,
)
from app.schemas.service import (
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
)
from app.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    BookingStatusUpdate,
    BookingStatusHistoryResponse,
)
from app.schemas.mechanic import (
    MechanicCreate,
    MechanicProfileUpdate,
    MechanicResponse,
    MechanicAssignment,
)
from app.schemas.spare_part import (
    SparePartCreate,
    SparePartUpdate,
    SparePartResponse,
    StockAdjustment,
    InventoryMovementResponse,
)
from app.schemas.booking_part import (
    BookingPartCreate,
    BookingPartResponse,
)
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceItemResponse,
)
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
)
from app.schemas.notification import (
    NotificationResponse,
)
from app.schemas.report import (
    DashboardStats,
    BookingsByStatus,
    PopularService,
    RevenueReport,
    InventorySummary,
)

__all__ = [
    "UserCreate",
    "UserLogin",
    "UserUpdate",
    "UserResponse",
    "CustomerProfileBase",
    "CustomerProfileCreate",
    "CustomerProfileUpdate",
    "CustomerProfileResponse",
    "MechanicProfileResponse",
    "Token",
    "TokenData",
    "VehicleCreate",
    "VehicleUpdate",
    "VehicleResponse",
    "ServiceCreate",
    "ServiceUpdate",
    "ServiceResponse",
    "BookingCreate",
    "BookingUpdate",
    "BookingResponse",
    "BookingStatusUpdate",
    "BookingStatusHistoryResponse",
    "MechanicCreate",
    "MechanicProfileUpdate",
    "MechanicResponse",
    "MechanicAssignment",
    "SparePartCreate",
    "SparePartUpdate",
    "SparePartResponse",
    "StockAdjustment",
    "InventoryMovementResponse",
    "BookingPartCreate",
    "BookingPartResponse",
    "InvoiceCreate",
    "InvoiceResponse",
    "InvoiceItemResponse",
    "PaymentCreate",
    "PaymentResponse",
    "NotificationResponse",
    "DashboardStats",
    "BookingsByStatus",
    "PopularService",
    "RevenueReport",
    "InventorySummary",
]
