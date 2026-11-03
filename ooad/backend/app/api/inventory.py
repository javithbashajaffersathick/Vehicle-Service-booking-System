from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin, require_admin_or_mechanic
from app.models.user import User
from app.schemas.spare_part import (
    SparePartCreate,
    SparePartUpdate,
    SparePartResponse,
    StockAdjustment,
    InventoryMovementResponse,
)
from app.services import inventory_service

router = APIRouter(tags=["Inventory"])


def map_part_response(p) -> SparePartResponse:
    """Helper to convert SparePart model to schema with computed is_low_stock."""
    return SparePartResponse(
        id=p.id,
        name=p.name,
        sku=p.sku,
        quantity=p.quantity,
        reorder_threshold=p.reorder_threshold,
        unit_price=p.unit_price,
        is_active=p.is_active,
        created_at=p.created_at,
        is_low_stock=(p.quantity <= p.reorder_threshold)
    )


@router.get("", response_model=List[SparePartResponse])
@router.get("/", response_model=List[SparePartResponse])
def list_spare_parts(
    low_stock_only: bool = Query(False, description="Filter only items at or below reorder threshold"),
    active_only: bool = Query(True, description="Filter only active items"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List inventory spare parts. Accessible by all authenticated staff and customers."""
    parts = inventory_service.get_spare_parts(db, low_stock_only=low_stock_only, active_only=active_only)
    return [map_part_response(p) for p in parts]


@router.get("/low-stock", response_model=List[SparePartResponse])
def list_low_stock_parts(
    current_user: User = Depends(require_admin_or_mechanic),
    db: Session = Depends(get_db)
):
    """Retrieve parts currently at or below their reorder threshold."""
    parts = inventory_service.get_spare_parts(db, low_stock_only=True, active_only=True)
    return [map_part_response(p) for p in parts]


@router.post("/", response_model=SparePartResponse, status_code=status.HTTP_201_CREATED)
def create_spare_part(
    part_in: SparePartCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new spare part in inventory (Admin only)."""
    p = inventory_service.create_spare_part(db, part_in, current_admin)
    return map_part_response(p)


@router.get("/{part_id}", response_model=SparePartResponse)
def get_spare_part(
    part_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single spare part by ID."""
    p = inventory_service.get_spare_part_by_id(db, part_id)
    return map_part_response(p)


@router.put("/{part_id}", response_model=SparePartResponse)
def update_spare_part(
    part_id: int,
    part_in: SparePartUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update spare part attributes (Admin only)."""
    p = inventory_service.update_spare_part(db, part_id, part_in, current_admin)
    return map_part_response(p)


@router.post("/{part_id}/adjust-stock", response_model=SparePartResponse)
def adjust_stock(
    part_id: int,
    adjustment: StockAdjustment,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Adjust stock quantity. Stock cannot go negative (Admin only)."""
    p = inventory_service.adjust_stock(db, part_id, adjustment, current_admin)
    return map_part_response(p)


@router.get("/{part_id}/movements", response_model=List[InventoryMovementResponse])
def get_stock_movements(
    part_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get stock movement history for a part (Admin only)."""
    movements = inventory_service.get_movements_for_part(db, part_id)
    return [
        InventoryMovementResponse(
            id=m.id,
            spare_part_id=m.spare_part_id,
            booking_id=m.booking_id,
            quantity_change=m.quantity_change,
            movement_type=m.movement_type,
            recorded_by_id=m.recorded_by_id,
            notes=m.notes,
            created_at=m.created_at,
            spare_part_name=m.spare_part.name if m.spare_part else None,
            spare_part_sku=m.spare_part.sku if m.spare_part else None
        )
        for m in movements
    ]
