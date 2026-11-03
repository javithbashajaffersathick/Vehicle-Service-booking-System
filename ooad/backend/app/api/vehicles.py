from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from app.services import vehicle_service

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])


@router.get("", response_model=List[VehicleResponse])
@router.get("/", response_model=List[VehicleResponse])
def list_vehicles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List vehicles. Customers see own vehicles; Admins see all vehicles."""
    return vehicle_service.get_vehicles(db, current_user)


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def add_vehicle(
    vehicle_in: VehicleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new vehicle for the authenticated customer."""
    return vehicle_service.create_vehicle(db, vehicle_in, current_user)


@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific vehicle."""
    return vehicle_service.get_vehicle_by_id(db, vehicle_id, current_user)


@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(
    vehicle_id: int,
    vehicle_in: VehicleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update details of a vehicle owned by user (or by admin)."""
    return vehicle_service.update_vehicle(db, vehicle_id, vehicle_in, current_user)


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a vehicle owned by user (or by admin)."""
    vehicle_service.delete_vehicle(db, vehicle_id, current_user)
    return None
