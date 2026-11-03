from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.service import Service
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.service import ServiceCreate, ServiceUpdate


def get_services(db: Session, active_only: bool = False) -> List[Service]:
    """List services. Optionally filter active ones."""
    query = db.query(Service)
    if active_only:
        query = query.filter(Service.is_active == True)
    return query.order_by(Service.id.asc()).all()


def get_service_by_id(db: Session, service_id: int) -> Service:
    """Get service package by ID."""
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service with ID {service_id} not found."
        )
    return service


def create_service(db: Session, service_in: ServiceCreate, current_user: User) -> Service:
    """Create a new service package (Admin only)."""
    new_service = Service(
        name=service_in.name.strip(),
        description=service_in.description,
        base_price=service_in.base_price,
        estimated_duration_minutes=service_in.estimated_duration_minutes,
        is_active=service_in.is_active
    )
    db.add(new_service)
    db.flush()

    audit = AuditLog(
        user_id=current_user.id,
        action="service_package_created",
        entity_type="service",
        entity_id=new_service.id,
        details=f"Created service package '{new_service.name}' with price {new_service.base_price}"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_service)
    return new_service


def update_service(db: Session, service_id: int, service_in: ServiceUpdate, current_user: User) -> Service:
    """Update a service package."""
    service = get_service_by_id(db, service_id)

    if service_in.name is not None:
        service.name = service_in.name.strip()
    if service_in.description is not None:
        service.description = service_in.description
    if service_in.base_price is not None:
        service.base_price = service_in.base_price
    if service_in.estimated_duration_minutes is not None:
        service.estimated_duration_minutes = service_in.estimated_duration_minutes
    if service_in.is_active is not None:
        service.is_active = service_in.is_active

    audit = AuditLog(
        user_id=current_user.id,
        action="service_package_updated",
        entity_type="service",
        entity_id=service.id,
        details=f"Updated service package '{service.name}'"
    )
    db.add(audit)
    db.commit()
    db.refresh(service)
    return service


def delete_service(db: Session, service_id: int, current_user: User) -> bool:
    """Soft-delete or delete a service package."""
    service = get_service_by_id(db, service_id)
    # Check if bookings reference this service
    if service.bookings:
        # Soft delete by deactivating
        service.is_active = False
        action_detail = f"Deactivated service package '{service.name}' because it has existing bookings"
    else:
        db.delete(service)
        action_detail = f"Deleted service package '{service.name}'"

    audit = AuditLog(
        user_id=current_user.id,
        action="service_package_deleted",
        entity_type="service",
        entity_id=service_id,
        details=action_detail
    )
    db.add(audit)
    db.commit()
    return True
