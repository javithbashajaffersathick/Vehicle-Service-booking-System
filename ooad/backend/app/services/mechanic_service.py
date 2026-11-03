from datetime import date, time
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.mechanic_profile import MechanicProfile
from app.models.booking import Booking, BookingStatus
from app.models.audit_log import AuditLog
from app.schemas.mechanic import MechanicCreate, MechanicProfileUpdate


def create_mechanic(db: Session, mech_in: MechanicCreate, current_user: User) -> User:
    """Create a new mechanic user and profile (Admin only)."""
    existing = db.query(User).filter(User.email.ilike(mech_in.email.strip())).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user = User(
        name=mech_in.name.strip(),
        email=mech_in.email.lower().strip(),
        password_hash=get_password_hash(mech_in.password),
        role=UserRole.mechanic,
        is_active=True
    )
    db.add(user)
    db.flush()

    profile = MechanicProfile(
        user_id=user.id,
        specialization=mech_in.specialization or "General Maintenance",
        experience_years=mech_in.experience_years,
        is_available=True
    )
    db.add(profile)

    audit = AuditLog(
        user_id=current_user.id,
        action="mechanic_created",
        entity_type="user",
        entity_id=user.id,
        details=f"Created mechanic {user.name} ({user.email})"
    )
    db.add(audit)

    db.commit()
    db.refresh(user)
    return user


def get_mechanics(db: Session, available_only: bool = False) -> List[User]:
    """Retrieve all mechanics."""
    query = db.query(User).filter(User.role == UserRole.mechanic, User.is_active == True)
    if available_only:
        query = query.join(MechanicProfile).filter(MechanicProfile.is_available == True)
    return query.all()


def get_mechanic_by_id(db: Session, mechanic_id: int) -> User:
    """Get single mechanic by user ID."""
    mechanic = db.query(User).filter(User.id == mechanic_id, User.role == UserRole.mechanic).first()
    if not mechanic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mechanic with ID {mechanic_id} not found."
        )
    return mechanic


def update_mechanic_profile(
    db: Session,
    mechanic_id: int,
    profile_in: MechanicProfileUpdate,
    current_user: User
) -> User:
    """Update mechanic profile details."""
    mechanic = get_mechanic_by_id(db, mechanic_id)
    if not mechanic.mechanic_profile:
        mechanic.mechanic_profile = MechanicProfile(user_id=mechanic.id)

    if profile_in.specialization is not None:
        mechanic.mechanic_profile.specialization = profile_in.specialization.strip()
    if profile_in.experience_years is not None:
        mechanic.mechanic_profile.experience_years = profile_in.experience_years
    if profile_in.is_available is not None:
        mechanic.mechanic_profile.is_available = profile_in.is_available

    audit = AuditLog(
        user_id=current_user.id,
        action="mechanic_profile_updated",
        entity_type="mechanic_profile",
        entity_id=mechanic.mechanic_profile.id,
        details=f"Updated profile for mechanic {mechanic.name}"
    )
    db.add(audit)
    db.commit()
    db.refresh(mechanic)
    return mechanic


def get_available_mechanics_for_slot(
    db: Session,
    appointment_date: date,
    appointment_time: time
) -> List[User]:
    """Find mechanics who are active, available, and have no conflicting booking in this slot."""
    # Find IDs of mechanics booked at this date and time
    busy_mechanic_ids = [
        row[0] for row in db.query(Booking.mechanic_id).filter(
            Booking.appointment_date == appointment_date,
            Booking.appointment_time == appointment_time,
            Booking.mechanic_id.isnot(None),
            Booking.status.in_([BookingStatus.confirmed, BookingStatus.in_progress])
        ).all()
    ]

    query = db.query(User).join(MechanicProfile).filter(
        User.role == UserRole.mechanic,
        User.is_active == True,
        MechanicProfile.is_available == True
    )

    if busy_mechanic_ids:
        query = query.filter(~User.id.in_(busy_mechanic_ids))

    return query.all()
