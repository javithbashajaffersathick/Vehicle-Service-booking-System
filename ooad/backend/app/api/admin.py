from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.schemas.user import UserResponse
from app.services import report_service

router = APIRouter(prefix="/admin", tags=["Admin Operations"])


@router.get("/customers", response_model=List[UserResponse])
def list_customers(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all registered customers with profile information (Admin only)."""
    return db.query(User).filter(User.role == UserRole.customer).order_by(User.created_at.desc()).all()


@router.get("/customers/{customer_id}", response_model=UserResponse)
def get_customer(
    customer_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get detailed customer information (Admin only)."""
    customer = db.query(User).filter(User.id == customer_id, User.role == UserRole.customer).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    return customer


@router.put("/users/{user_id}/toggle-status", response_model=Dict[str, Any])
def toggle_user_active_status(
    user_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Activate or deactivate a user account (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own admin account."
        )

    user.is_active = not user.is_active
    action_str = "activated" if user.is_active else "deactivated"

    audit = AuditLog(
        user_id=current_admin.id,
        action="user_status_toggled",
        entity_type="user",
        entity_id=user.id,
        details=f"Admin {action_str} user {user.email}"
    )
    db.add(audit)
    db.commit()

    return {
        "user_id": user.id,
        "email": user.email,
        "is_active": user.is_active,
        "message": f"User account successfully {action_str}."
    }


@router.get("/audit-logs", response_model=List[Dict[str, Any]])
def get_audit_logs(
    limit: int = Query(100, ge=1, le=500, description="Max number of logs to return"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve system audit logs (Admin only)."""
    logs = report_service.get_audit_logs(db, limit=limit)
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_name": log.user.name if log.user else "System",
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "created_at": log.created_at.isoformat()
        }
        for log in logs
    ]
