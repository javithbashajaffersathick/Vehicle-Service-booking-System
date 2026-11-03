from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User, UserRole
from app.schemas.user import UserResponse
from app.api.auth import router as auth_router
from app.api.vehicles import router as vehicles_router
from app.api.services import router as services_router
from app.api.bookings import router as bookings_router
from app.api.mechanics import router as mechanics_router
from app.api.inventory import router as inventory_router
from app.api.booking_parts import router as booking_parts_router
from app.api.invoices import router as invoices_router
from app.api.payments import router as payments_router
from app.api.notifications import router as notifications_router
from app.api.reports import router as reports_router
from app.api.admin import router as admin_router

api_router = APIRouter(prefix="/api/v1")

# Mount all domain sub-routers
api_router.include_router(auth_router)
api_router.include_router(vehicles_router)
api_router.include_router(services_router)
api_router.include_router(bookings_router)
api_router.include_router(mechanics_router)
api_router.include_router(inventory_router, prefix="/inventory")
api_router.include_router(inventory_router, prefix="/spare-parts")
api_router.include_router(booking_parts_router)
api_router.include_router(invoices_router)
api_router.include_router(payments_router)
api_router.include_router(notifications_router)
api_router.include_router(reports_router)
api_router.include_router(admin_router)

# Direct customer and user routers for client convenience
customers_router = APIRouter(prefix="/customers", tags=["Customers"])


@customers_router.get("", response_model=List[UserResponse])
@customers_router.get("/", response_model=List[UserResponse])
def get_customers_list(current_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == UserRole.customer).order_by(User.created_at.desc()).all()


@customers_router.get("/{customer_id}", response_model=UserResponse)
def get_customer_item(customer_id: int, current_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    c = db.query(User).filter(User.id == customer_id, User.role == UserRole.customer).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return c


api_router.include_router(customers_router)

users_router = APIRouter(prefix="/users", tags=["Users"])


@users_router.get("", response_model=List[UserResponse])
@users_router.get("/", response_model=List[UserResponse])
def get_users_list(role: Optional[str] = Query(None), current_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return q.order_by(User.created_at.desc()).all()


@users_router.get("/{user_id}", response_model=UserResponse)
def get_user_item(user_id: int, current_admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    return u


api_router.include_router(users_router)

# Alias for compatibility
router = api_router

__all__ = ["api_router", "router"]
