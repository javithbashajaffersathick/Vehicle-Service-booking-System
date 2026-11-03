from sqlalchemy import Column, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class BookingPart(Base):
    __tablename__ = "booking_parts"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    spare_part_id = Column(Integer, ForeignKey("spare_parts.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price_at_use = Column(Numeric(10, 2), nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="booking_parts")
    spare_part = relationship("SparePart", back_populates="booking_parts")
