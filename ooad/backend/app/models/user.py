import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, enum.Enum):
    customer = "customer"
    admin = "admin"
    mechanic = "mechanic"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.customer, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    customer_profile = relationship("CustomerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    mechanic_profile = relationship("MechanicProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    vehicles = relationship("Vehicle", back_populates="customer", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="customer", foreign_keys="Booking.customer_id", cascade="all, delete-orphan")
    assigned_bookings = relationship("Booking", back_populates="mechanic", foreign_keys="Booking.mechanic_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
