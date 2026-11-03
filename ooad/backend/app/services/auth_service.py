from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, UserRole
from app.models.customer_profile import CustomerProfile
from app.models.mechanic_profile import MechanicProfile
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.schemas.user import UserCreate, UserUpdate


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Retrieve user by email address."""
    return db.query(User).filter(User.email.ilike(email.strip())).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """Retrieve user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def register_user(db: Session, user_in: UserCreate) -> User:
    """Register a new user and associated profile."""
    existing_user = get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        name=user_in.name,
        email=user_in.email.lower().strip(),
        password_hash=hashed_pw,
        role=user_in.role or UserRole.customer,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    if new_user.role == UserRole.customer:
        customer_profile = CustomerProfile(
            user_id=new_user.id,
            phone=user_in.phone,
            address=user_in.address,
            city=user_in.city,
            state=user_in.state,
            zip_code=user_in.zip_code
        )
        db.add(customer_profile)
    elif new_user.role == UserRole.mechanic:
        mech_profile = MechanicProfile(
            user_id=new_user.id,
            specialization="General Service",
            experience_years=1,
            is_available=True
        )
        db.add(mech_profile)

    # Welcome notification
    welcome_notif = Notification(
        user_id=new_user.id,
        title="Welcome to AutoCare",
        message=f"Welcome, {new_user.name}! Your account has been successfully created.",
        notification_type="account_registered"
    )
    db.add(welcome_notif)

    # Audit log
    audit = AuditLog(
        user_id=new_user.id,
        action="user_registered",
        entity_type="user",
        entity_id=new_user.id,
        details=f"User {new_user.email} registered with role {new_user.role.value}"
    )
    db.add(audit)

    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user by email and password."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def update_profile(db: Session, current_user: User, update_data: UserUpdate) -> User:
    """Update profile of the current user."""
    if update_data.name is not None:
        current_user.name = update_data.name
    if update_data.email is not None and update_data.email.lower().strip() != current_user.email:
        existing = get_user_by_email(db, update_data.email)
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already taken by another account."
            )
        current_user.email = update_data.email.lower().strip()
    if update_data.password is not None and len(update_data.password.strip()) >= 6:
        current_user.password_hash = get_password_hash(update_data.password)

    if current_user.role == UserRole.customer:
        if not current_user.customer_profile:
            current_user.customer_profile = CustomerProfile(user_id=current_user.id)
        if update_data.phone is not None:
            current_user.customer_profile.phone = update_data.phone
        if update_data.address is not None:
            current_user.customer_profile.address = update_data.address
        if update_data.city is not None:
            current_user.customer_profile.city = update_data.city
        if update_data.state is not None:
            current_user.customer_profile.state = update_data.state
        if update_data.zip_code is not None:
            current_user.customer_profile.zip_code = update_data.zip_code

    audit = AuditLog(
        user_id=current_user.id,
        action="profile_updated",
        entity_type="user",
        entity_id=current_user.id,
        details="User profile updated"
    )
    db.add(audit)
    db.commit()
    db.refresh(current_user)
    return current_user
