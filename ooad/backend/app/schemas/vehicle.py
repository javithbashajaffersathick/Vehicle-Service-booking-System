from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator


class VehicleBase(BaseModel):
    registration_number: Optional[str] = Field(None, min_length=2, max_length=50)
    license_plate: Optional[str] = Field(None, min_length=2, max_length=50)
    make: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=50)
    year: int = Field(..., ge=1900, le=2100)
    color: Optional[str] = Field(None, max_length=30)
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def sync_plate_and_reg(cls, data: Any) -> Any:
        if isinstance(data, dict):
            reg = data.get("registration_number") or data.get("license_plate")
            if reg:
                data["registration_number"] = reg
                data["license_plate"] = reg
        return data


class VehicleCreate(VehicleBase):
    @model_validator(mode="after")
    def validate_reg_present(self) -> "VehicleCreate":
        if not self.registration_number:
            raise ValueError("registration_number or license_plate is required")
        return self


class VehicleUpdate(BaseModel):
    registration_number: Optional[str] = Field(None, min_length=2, max_length=50)
    license_plate: Optional[str] = Field(None, min_length=2, max_length=50)
    make: Optional[str] = Field(None, min_length=1, max_length=50)
    model: Optional[str] = Field(None, min_length=1, max_length=50)
    year: Optional[int] = Field(None, ge=1900, le=2100)
    color: Optional[str] = Field(None, max_length=30)
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def sync_plate_and_reg(cls, data: Any) -> Any:
        if isinstance(data, dict):
            reg = data.get("registration_number") or data.get("license_plate")
            if reg:
                data["registration_number"] = reg
                data["license_plate"] = reg
        return data


class VehicleResponse(VehicleBase):
    id: int
    customer_id: int
    created_at: datetime
    registration_number: str
    license_plate: str = ""

    @model_validator(mode="before")
    @classmethod
    def populate_response(cls, data: Any) -> Any:
        if hasattr(data, "registration_number"):
            reg = getattr(data, "registration_number")
            return {
                "id": getattr(data, "id"),
                "customer_id": getattr(data, "customer_id"),
                "created_at": getattr(data, "created_at"),
                "registration_number": reg,
                "license_plate": reg,
                "make": getattr(data, "make"),
                "model": getattr(data, "model"),
                "year": getattr(data, "year"),
                "color": getattr(data, "color"),
                "notes": getattr(data, "notes"),
            }
        return data

    model_config = ConfigDict(from_attributes=True)
