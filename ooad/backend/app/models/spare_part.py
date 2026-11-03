from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class SparePart(Base):
    __tablename__ = "spare_parts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    reorder_threshold = Column(Integer, default=5, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    movements = relationship("InventoryMovement", back_populates="spare_part", cascade="all, delete-orphan")
    booking_parts = relationship("BookingPart", back_populates="spare_part")
