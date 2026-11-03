from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class MechanicProfile(Base):
    __tablename__ = "mechanic_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialization = Column(String(100), nullable=True)
    experience_years = Column(Integer, default=0, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="mechanic_profile")
