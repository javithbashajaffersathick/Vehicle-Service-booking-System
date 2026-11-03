from datetime import date, time
from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.schemas.mechanic import (
    MechanicCreate,
    MechanicProfileUpdate,
    MechanicResponse,
    MechanicStatusUpdate,
)
from app.services import mechanic_service

router = APIRouter(prefix="/mechanics", tags=["Mechanics"])


@router.get("", response_model=List[MechanicResponse])
@router.get("/", response_model=List[MechanicResponse])
def list_mechanics(
    available_only: bool = Query(False, description="Filter only available mechanics"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List mechanics. Accessible by authenticated users."""
    return mechanic_service.get_mechanics(db, available_only=available_only)


@router.post("/", response_model=MechanicResponse, status_code=status.HTTP_201_CREATED)
def create_mechanic(
    mech_in: MechanicCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new mechanic account (Admin only)."""
    return mechanic_service.create_mechanic(db, mech_in, current_admin)


@router.get("/available/slot", response_model=List[MechanicResponse])
def get_available_mechanics_for_slot(
    appointment_date: date = Query(..., description="Target appointment date (YYYY-MM-DD)"),
    appointment_time: time = Query(..., description="Target appointment time (HH:MM:SS)"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Find available mechanics for a specific date and time slot (Admin only)."""
    return mechanic_service.get_available_mechanics_for_slot(db, appointment_date, appointment_time)


@router.get("/{mechanic_id}", response_model=MechanicResponse)
def get_mechanic(
    mechanic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single mechanic details."""
    return mechanic_service.get_mechanic_by_id(db, mechanic_id)


@router.put("/{mechanic_id}", response_model=MechanicResponse)
def update_mechanic_profile(
    mechanic_id: int,
    profile_in: MechanicProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update mechanic profile (Mechanic themselves or Admin)."""
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role != "admin" and current_user.id != mechanic_id:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile."
        )
    return mechanic_service.update_mechanic_profile(db, mechanic_id, profile_in, current_user)


@router.put("/{mechanic_id}/status", response_model=MechanicResponse)
def update_mechanic_status(
    mechanic_id: int,
    status_data: MechanicStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update mechanic availability status (Mechanic themselves or Admin)."""
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role != "admin" and current_user.id != mechanic_id:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own status."
        )
    is_avail = (status_data.status.lower() == "available")
    profile_update = MechanicProfileUpdate(is_available=is_avail)
    return mechanic_service.update_mechanic_profile(db, mechanic_id, profile_update, current_user)
