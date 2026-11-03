from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


def get_vehicles(db: Session, current_user: User) -> List[Vehicle]:
    """Retrieve vehicles. Customers see only their own; Admins see all."""
    if current_user.role == UserRole.admin:
        return db.query(Vehicle).order_by(Vehicle.created_at.desc()).all()
    return db.query(Vehicle).filter(Vehicle.customer_id == current_user.id).order_by(Vehicle.created_at.desc()).all()


def get_vehicle_by_id(db: Session, vehicle_id: int, current_user: User) -> Vehicle:
    """Retrieve a vehicle by ID with access control."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {vehicle_id} not found."
        )
    if current_user.role != UserRole.admin and vehicle.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this vehicle."
        )
    return vehicle


def create_vehicle(db: Session, vehicle_in: VehicleCreate, current_user: User) -> Vehicle:
    """Add a new vehicle for the customer."""
    existing = db.query(Vehicle).filter(Vehicle.registration_number.ilike(vehicle_in.registration_number.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A vehicle with registration number '{vehicle_in.registration_number}' is already registered."
        )

    new_vehicle = Vehicle(
        customer_id=current_user.id,
        registration_number=vehicle_in.registration_number.strip().upper(),
        make=vehicle_in.make.strip(),
        model=vehicle_in.model.strip(),
        year=vehicle_in.year,
        color=vehicle_in.color.strip() if vehicle_in.color else None,
        notes=vehicle_in.notes
    )
    db.add(new_vehicle)
    db.flush()

    audit = AuditLog(
        user_id=current_user.id,
        action="vehicle_created",
        entity_type="vehicle",
        entity_id=new_vehicle.id,
        details=f"Registered vehicle {new_vehicle.registration_number} ({new_vehicle.make} {new_vehicle.model})"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle


def update_vehicle(db: Session, vehicle_id: int, vehicle_in: VehicleUpdate, current_user: User) -> Vehicle:
    """Update vehicle details with ownership validation."""
    vehicle = get_vehicle_by_id(db, vehicle_id, current_user)

    if vehicle_in.registration_number is not None:
        reg = vehicle_in.registration_number.strip().upper()
        if reg != vehicle.registration_number:
            existing = db.query(Vehicle).filter(Vehicle.registration_number.ilike(reg)).first()
            if existing and existing.id != vehicle.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Vehicle registration '{reg}' already exists."
                )
            vehicle.registration_number = reg

    if vehicle_in.make is not None:
        vehicle.make = vehicle_in.make.strip()
    if vehicle_in.model is not None:
        vehicle.model = vehicle_in.model.strip()
    if vehicle_in.year is not None:
        vehicle.year = vehicle_in.year
    if vehicle_in.color is not None:
        vehicle.color = vehicle_in.color.strip()
    if vehicle_in.notes is not None:
        vehicle.notes = vehicle_in.notes

    audit = AuditLog(
        user_id=current_user.id,
        action="vehicle_updated",
        entity_type="vehicle",
        entity_id=vehicle.id,
        details=f"Updated vehicle {vehicle.registration_number}"
    )
    db.add(audit)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def delete_vehicle(db: Session, vehicle_id: int, current_user: User) -> bool:
    """Delete a vehicle."""
    vehicle = get_vehicle_by_id(db, vehicle_id, current_user)
    db.delete(vehicle)

    audit = AuditLog(
        user_id=current_user.id,
        action="vehicle_deleted",
        entity_type="vehicle",
        entity_id=vehicle_id,
        details=f"Deleted vehicle {vehicle.registration_number}"
    )
    db.add(audit)
    db.commit()
    return True
