import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base


class MovementType(str, enum.Enum):
    stock_in = "stock_in"
    stock_out = "stock_out"
    adjustment = "adjustment"


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)
    spare_part_id = Column(Integer, ForeignKey("spare_parts.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    quantity_change = Column(Integer, nullable=False)
    movement_type = Column(Enum(MovementType), nullable=False)
    recorded_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    spare_part = relationship("SparePart", back_populates="movements")
    booking = relationship("Booking", back_populates="inventory_movements")
    recorded_by = relationship("User")
