from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse
from app.services import service_service

router = APIRouter(prefix="/services", tags=["Service Packages"])


@router.get("", response_model=List[ServiceResponse])
@router.get("/", response_model=List[ServiceResponse])
def list_services(
    active_only: bool = Query(True, description="Filter only active service packages"),
    db: Session = Depends(get_db)
):
    """List service packages (Public endpoint)."""
    return service_service.get_services(db, active_only=active_only)


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(
    service_id: int,
    db: Session = Depends(get_db)
):
    """Get service package by ID (Public endpoint)."""
    return service_service.get_service_by_id(db, service_id)


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(
    service_in: ServiceCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new service package (Admin only)."""
    return service_service.create_service(db, service_in, current_admin)


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: int,
    service_in: ServiceUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update an existing service package (Admin only)."""
    return service_service.update_service(db, service_id, service_in, current_admin)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete or deactivate a service package (Admin only)."""
    service_service.delete_service(db, service_id, current_admin)
    return None
