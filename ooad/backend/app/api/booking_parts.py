from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin_or_mechanic
from app.models.user import User
from app.schemas.booking_part import BookingPartCreate, BookingPartResponse
from app.services import inventory_service

router = APIRouter(prefix="/booking-parts", tags=["Booking Parts"])


def map_booking_part(bp) -> BookingPartResponse:
    """Helper to convert BookingPart model to response schema with computed fields."""
    unit_price = Decimal(str(bp.unit_price_at_use))
    total = unit_price * Decimal(str(bp.quantity))
    return BookingPartResponse(
        id=bp.id,
        booking_id=bp.booking_id,
        spare_part_id=bp.spare_part_id,
        quantity=bp.quantity,
        unit_price_at_use=unit_price,
        total_price=total,
        spare_part_name=bp.spare_part.name if bp.spare_part else None,
        spare_part_sku=bp.spare_part.sku if bp.spare_part else None
    )


@router.get("/booking/{booking_id}", response_model=List[BookingPartResponse])
def get_booking_parts(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all spare parts logged for a booking."""
    parts = inventory_service.get_booking_parts(db, booking_id)
    return [map_booking_part(bp) for bp in parts]


@router.post("/booking/{booking_id}", response_model=BookingPartResponse, status_code=status.HTTP_201_CREATED)
def add_booking_part(
    booking_id: int,
    part_in: BookingPartCreate,
    current_user: User = Depends(require_admin_or_mechanic),
    db: Session = Depends(get_db)
):
    """Record spare part used for a booking. Deducts inventory stock (Mechanic or Admin)."""
    bp = inventory_service.record_booking_part(
        db=db,
        booking_id=booking_id,
        spare_part_id=part_in.spare_part_id,
        quantity=part_in.quantity,
        current_user=current_user
    )
    return map_booking_part(bp)
