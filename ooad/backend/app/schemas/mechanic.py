from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator
from app.models.user import UserRole
from app.schemas.user import MechanicProfileResponse


class MechanicCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    specialization: Optional[str] = None
    experience_years: int = Field(default=0, ge=0)


class MechanicProfileUpdate(BaseModel):
    specialization: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0)
    is_available: Optional[bool] = None


class MechanicStatusUpdate(BaseModel):
    status: str = Field(..., description="'available', 'busy', or 'offline'")


class MechanicAssignment(BaseModel):
    mechanic_id: int


class MechanicResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    email: EmailStr
    role: UserRole
    is_active: bool
    phone: Optional[str] = None
    specialization: Optional[str] = "General Maintenance"
    status: Optional[str] = "available"
    active_jobs_count: int = 0
    mechanic_profile: Optional[MechanicProfileResponse] = None

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if hasattr(data, "id"):
            profile = getattr(data, "mechanic_profile", None)
            assigned = getattr(data, "assigned_bookings", [])
            active_cnt = sum(
                1 for b in assigned
                if str(getattr(b, "status", "")).lower() in ["confirmed", "in_progress"]
            )
            is_avail = getattr(profile, "is_available", True) if profile else True
            st = "available" if is_avail else "busy"
            spec = getattr(profile, "specialization", "General Maintenance") if profile else "General Maintenance"
            return {
                "id": getattr(data, "id"),
                "user_id": getattr(data, "id"),
                "name": getattr(data, "name"),
                "email": getattr(data, "email"),
                "role": getattr(data, "role"),
                "is_active": getattr(data, "is_active", True),
                "phone": getattr(profile, "phone", None) if hasattr(profile, "phone") else None,
                "specialization": spec,
                "status": st,
                "active_jobs_count": active_cnt,
                "mechanic_profile": profile,
            }
        return data

    model_config = ConfigDict(from_attributes=True)
