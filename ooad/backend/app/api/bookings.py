from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, status, Query, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_admin_or_mechanic
from app.models.user import User
from app.models.booking import BookingStatus
from app.schemas.booking import (
    BookingCreate,
    BookingResponse,
    BookingStatusUpdate,
)
from app.schemas.mechanic import MechanicAssignment
from app.schemas.booking_part import BookingPartResponse
from app.schemas.invoice import InvoiceResponse
from app.services import booking_service, inventory_service, invoice_service

router = APIRouter(prefix="/bookings", tags=["Bookings"])


class AddPartBody(BaseModel):
    part_id: Optional[int] = None
    spare_part_id: Optional[int] = None
    quantity: int = Field(default=1, gt=0)


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new service appointment booking."""
    return booking_service.create_booking(db, booking_in, current_user)


@router.get("", response_model=List[BookingResponse])
@router.get("/", response_model=List[BookingResponse])
def list_bookings(
    status_filter: Optional[BookingStatus] = Query(None, alias="status", description="Filter by booking status"),
    customer_id: Optional[int] = Query(None, description="Admin filter by customer ID"),
    mechanic_id: Optional[int] = Query(None, description="Admin filter by mechanic ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List bookings based on authentication role:
    - Customer: lists only own bookings
    - Mechanic: lists assigned bookings
    - Admin: lists all bookings with optional filtering
    """
    return booking_service.get_bookings(
        db=db,
        current_user=current_user,
        status_filter=status_filter,
        customer_id=customer_id,
        mechanic_id=mechanic_id
    )


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get complete booking details by ID."""
    return booking_service.get_booking_by_id(db, booking_id, current_user)


@router.put("/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: int,
    status_update: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update booking status according to the state machine transition rules.
    - pending -> confirmed (admin)
    - pending -> cancelled (customer or admin)
    - confirmed -> in_progress (mechanic or admin)
    - confirmed -> cancelled (admin)
    - in_progress -> completed (mechanic or admin)
    - completed -> delivered (admin)
    """
    return booking_service.update_booking_status(db, booking_id, status_update, current_user)


@router.put("/{booking_id}/assign-mechanic", response_model=BookingResponse)
def assign_mechanic(
    booking_id: int,
    assignment: MechanicAssignment,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Assign a mechanic to a booking (Admin only)."""
    return booking_service.assign_mechanic(db, booking_id, assignment.mechanic_id, current_admin)


@router.put("/{booking_id}/assign", response_model=BookingResponse)
def assign_mechanic_alias(
    booking_id: int,
    assignment: MechanicAssignment,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Assign a mechanic to a booking (Frontend alias)."""
    return booking_service.assign_mechanic(db, booking_id, assignment.mechanic_id, current_admin)


@router.post("/{booking_id}/parts", response_model=BookingPartResponse, status_code=status.HTTP_201_CREATED)
def add_part_to_booking(
    booking_id: int,
    body: AddPartBody,
    current_user: User = Depends(require_admin_or_mechanic),
    db: Session = Depends(get_db)
):
    """Add a spare part to a booking directly (Frontend alias)."""
    part_id = body.spare_part_id or body.part_id
    if not part_id:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="part_id or spare_part_id is required")

    bp = inventory_service.record_booking_part(
        db=db,
        booking_id=booking_id,
        spare_part_id=part_id,
        quantity=body.quantity,
        current_user=current_user
    )
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


@router.post("/{booking_id}/invoice", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def generate_booking_invoice(
    booking_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Generate invoice directly from booking ID (Frontend alias)."""
    return invoice_service.generate_invoice_for_booking(
        db=db,
        booking_id=booking_id,
        discount=Decimal("0.0"),
        current_user=current_admin
    )


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    notes: Optional[str] = Query(None, description="Reason for cancellation"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a booking (Customer or Admin)."""
    return booking_service.cancel_booking(db, booking_id, current_user, reason=notes)
