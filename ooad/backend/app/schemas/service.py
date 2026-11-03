from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator


class ServiceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    base_price: Decimal = Field(..., ge=0)
    estimated_duration_minutes: int = Field(default=60, ge=15)
    estimated_hours: Optional[float] = None
    category: Optional[str] = "Maintenance"
    is_active: bool = True
    features: Optional[List[str]] = None

    @model_validator(mode="before")
    @classmethod
    def sync_duration_hours(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "estimated_hours" in data and not data.get("estimated_duration_minutes"):
                try:
                    data["estimated_duration_minutes"] = max(15, int(float(data["estimated_hours"]) * 60))
                except (ValueError, TypeError):
                    data["estimated_duration_minutes"] = 60
            elif "estimated_duration_minutes" in data and not data.get("estimated_hours"):
                try:
                    data["estimated_hours"] = round(float(data["estimated_duration_minutes"]) / 60.0, 1)
                except (ValueError, TypeError):
                    data["estimated_hours"] = 1.0
        return data


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    base_price: Optional[Decimal] = Field(None, ge=0)
    estimated_duration_minutes: Optional[int] = Field(None, ge=15)
    estimated_hours: Optional[float] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None
    features: Optional[List[str]] = None


class ServiceResponse(ServiceBase):
    id: int
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def populate_response(cls, data: Any) -> Any:
        if hasattr(data, "id"):
            duration = getattr(data, "estimated_duration_minutes", 60)
            return {
                "id": getattr(data, "id"),
                "name": getattr(data, "name"),
                "description": getattr(data, "description"),
                "base_price": getattr(data, "base_price"),
                "estimated_duration_minutes": duration,
                "estimated_hours": round(duration / 60.0, 1),
                "category": "Maintenance",
                "is_active": getattr(data, "is_active", True),
                "created_at": getattr(data, "created_at"),
                "features": [
                    "Multi-point safety check",
                    "Certified mechanic inspection",
                    "Warranty protected service"
                ],
            }
        return data

    model_config = ConfigDict(from_attributes=True)
