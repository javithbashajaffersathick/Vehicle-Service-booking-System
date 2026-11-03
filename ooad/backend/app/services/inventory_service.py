from typing import List, Optional
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.spare_part import SparePart
from app.models.inventory_movement import InventoryMovement, MovementType
from app.models.booking_part import BookingPart
from app.models.booking import Booking, BookingStatus
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.schemas.spare_part import SparePartCreate, SparePartUpdate, StockAdjustment


def get_spare_parts(db: Session, low_stock_only: bool = False, active_only: bool = False) -> List[SparePart]:
    """Retrieve spare parts with optional filtering."""
    query = db.query(SparePart)
    if active_only:
        query = query.filter(SparePart.is_active == True)
    if low_stock_only:
        query = query.filter(SparePart.quantity <= SparePart.reorder_threshold)
    return query.order_by(SparePart.name.asc()).all()


def get_spare_part_by_id(db: Session, part_id: int) -> SparePart:
    """Retrieve single spare part by ID."""
    part = db.query(SparePart).filter(SparePart.id == part_id).first()
    if not part:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Spare part with ID {part_id} not found."
        )
    return part


def create_spare_part(db: Session, part_in: SparePartCreate, current_user: User) -> SparePart:
    """Create a new spare part in inventory (Admin only)."""
    existing = db.query(SparePart).filter(SparePart.sku.ilike(part_in.sku.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Spare part with SKU '{part_in.sku}' already exists."
        )

    part = SparePart(
        name=part_in.name.strip(),
        sku=part_in.sku.strip().upper(),
        quantity=part_in.quantity,
        reorder_threshold=part_in.reorder_threshold,
        unit_price=part_in.unit_price,
        is_active=part_in.is_active
    )
    db.add(part)
    db.flush()

    # Record initial stock movement if quantity > 0
    if part.quantity > 0:
        movement = InventoryMovement(
            spare_part_id=part.id,
            booking_id=None,
            quantity_change=part.quantity,
            movement_type=MovementType.stock_in,
            recorded_by_id=current_user.id,
            notes="Initial stock received"
        )
        db.add(movement)

    audit = AuditLog(
        user_id=current_user.id,
        action="spare_part_created",
        entity_type="spare_part",
        entity_id=part.id,
        details=f"Created spare part '{part.name}' (SKU: {part.sku}) with quantity {part.quantity}"
    )
    db.add(audit)

    db.commit()
    db.refresh(part)
    return part


def update_spare_part(db: Session, part_id: int, part_in: SparePartUpdate, current_user: User) -> SparePart:
    """Update spare part attributes."""
    part = get_spare_part_by_id(db, part_id)

    if part_in.name is not None:
        part.name = part_in.name.strip()
    if part_in.sku is not None:
        sku = part_in.sku.strip().upper()
        if sku != part.sku:
            existing = db.query(SparePart).filter(SparePart.sku.ilike(sku)).first()
            if existing and existing.id != part.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"SKU '{sku}' already exists."
                )
            part.sku = sku
    if part_in.reorder_threshold is not None:
        part.reorder_threshold = part_in.reorder_threshold
    if part_in.unit_price is not None:
        part.unit_price = part_in.unit_price
    if part_in.is_active is not None:
        part.is_active = part_in.is_active

    audit = AuditLog(
        user_id=current_user.id,
        action="spare_part_updated",
        entity_type="spare_part",
        entity_id=part.id,
        details=f"Updated spare part '{part.name}'"
    )
    db.add(audit)
    db.commit()
    db.refresh(part)
    return part


def adjust_stock(
    db: Session,
    part_id: int,
    adjustment: StockAdjustment,
    current_user: User,
    booking_id: Optional[int] = None
) -> SparePart:
    """Adjust inventory stock. Enforces non-negative stock constraint."""
    part = get_spare_part_by_id(db, part_id)

    new_quantity = part.quantity + adjustment.quantity_change
    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock for '{part.name}'. Current: {part.quantity}, requested change: {adjustment.quantity_change}. Stock cannot be negative."
        )

    part.quantity = new_quantity

    movement = InventoryMovement(
        spare_part_id=part.id,
        booking_id=booking_id,
        quantity_change=adjustment.quantity_change,
        movement_type=adjustment.movement_type,
        recorded_by_id=current_user.id,
        notes=adjustment.notes
    )
    db.add(movement)

    # Check for low stock condition and trigger notification for admins
    if part.quantity <= part.reorder_threshold:
        admin_users = db.query(User).filter(User.role == UserRole.admin).all()
        for admin in admin_users:
            notif = Notification(
                user_id=admin.id,
                title="Low Stock Alert",
                message=f"Spare part '{part.name}' (SKU: {part.sku}) has reached low stock: {part.quantity} remaining (threshold: {part.reorder_threshold}).",
                notification_type="low_stock"
            )
            db.add(notif)

    audit = AuditLog(
        user_id=current_user.id,
        action="inventory_adjusted",
        entity_type="spare_part",
        entity_id=part.id,
        details=f"Adjusted stock of '{part.name}' by {adjustment.quantity_change}. New quantity: {part.quantity}"
    )
    db.add(audit)

    db.commit()
    db.refresh(part)
    return part


def get_movements_for_part(db: Session, part_id: int) -> List[InventoryMovement]:
    """Get stock movement history for a part."""
    return db.query(InventoryMovement).filter(
        InventoryMovement.spare_part_id == part_id
    ).order_by(InventoryMovement.created_at.desc()).all()


def record_booking_part(
    db: Session,
    booking_id: int,
    spare_part_id: int,
    quantity: int,
    current_user: User
) -> BookingPart:
    """Record spare part used in a booking. Deducts stock and validates constraints."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found."
        )

    if booking.status not in [BookingStatus.in_progress, BookingStatus.confirmed]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot add parts to a booking with status '{booking.status.value}'. Must be 'in_progress' or 'confirmed'."
        )

    part = get_spare_part_by_id(db, spare_part_id)
    if part.quantity < quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient inventory for '{part.name}'. Available: {part.quantity}, requested: {quantity}."
        )

    # Deduct stock
    part.quantity -= quantity

    movement = InventoryMovement(
        spare_part_id=part.id,
        booking_id=booking.id,
        quantity_change=-quantity,
        movement_type=MovementType.stock_out,
        recorded_by_id=current_user.id,
        notes=f"Used in booking {booking.booking_reference}"
    )
    db.add(movement)

    booking_part = BookingPart(
        booking_id=booking.id,
        spare_part_id=part.id,
        quantity=quantity,
        unit_price_at_use=part.unit_price
    )
    db.add(booking_part)

    # Check low stock notification
    if part.quantity <= part.reorder_threshold:
        admin_users = db.query(User).filter(User.role == UserRole.admin).all()
        for admin in admin_users:
            db.add(Notification(
                user_id=admin.id,
                title="Low Stock Alert",
                message=f"Spare part '{part.name}' is low: {part.quantity} remaining.",
                notification_type="low_stock"
            ))

    audit = AuditLog(
        user_id=current_user.id,
        action="booking_part_added",
        entity_type="booking_part",
        entity_id=booking.id,
        details=f"Added {quantity}x {part.name} to booking {booking.booking_reference}"
    )
    db.add(audit)

    db.commit()
    db.refresh(booking_part)
    return booking_part


def get_booking_parts(db: Session, booking_id: int) -> List[BookingPart]:
    """Get all spare parts used in a booking."""
    return db.query(BookingPart).filter(BookingPart.booking_id == booking_id).all()
