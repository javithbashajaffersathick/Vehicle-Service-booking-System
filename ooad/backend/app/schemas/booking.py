from datetime import date, time, datetime
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models.booking import BookingStatus
from app.schemas.user import UserResponse
from app.schemas.vehicle import VehicleResponse
from app.schemas.service import ServiceResponse
from app.schemas.booking_part import BookingPartResponse
from app.schemas.invoice import InvoiceResponse


class BookingCreate(BaseModel):
    vehicle_id: int
    service_id: int
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    scheduled_date: Optional[str] = None
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def parse_scheduled(cls, data: Any) -> Any:
        if isinstance(data, dict):
            sched = data.get("scheduled_date")
            if sched and not data.get("appointment_date"):
                sched_str = str(sched)
                if "T" in sched_str:
                    parts = sched_str.split("T", 1)
                    data["appointment_date"] = parts[0]
                    if not data.get("appointment_time") and len(parts) > 1:
                        data["appointment_time"] = parts[1][:5]
                elif " " in sched_str:
                    parts = sched_str.split(" ", 1)
                    data["appointment_date"] = parts[0]
                    if not data.get("appointment_time") and len(parts) > 1:
                        data["appointment_time"] = parts[1][:5]
                else:
                    data["appointment_date"] = sched_str
            if not data.get("appointment_time"):
                data["appointment_time"] = time(9, 0)
        return data

    @model_validator(mode="after")
    def ensure_appointment_set(self) -> "BookingCreate":
        if not self.appointment_date:
            raise ValueError("appointment_date or scheduled_date is required")
        if not self.appointment_time:
            self.appointment_time = time(9, 0)
        return self


class BookingUpdate(BaseModel):
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    service_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    notes: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    notes: Optional[str] = None


class BookingStatusHistoryResponse(BaseModel):
    id: int
    booking_id: int
    old_status: Optional[str] = None
    new_status: str
    changed_by_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BookingResponse(BaseModel):
    id: int
    booking_reference: str
    customer_id: int
    user_id: Optional[int] = None
    vehicle_id: int
    service_id: int
    mechanic_id: Optional[int] = None
    appointment_date: date
    appointment_time: time
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    status: BookingStatus
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    customer: Optional[UserResponse] = None
    vehicle: Optional[VehicleResponse] = None
    service: Optional[ServiceResponse] = None
    mechanic: Optional[UserResponse] = None
    status_history: List[BookingStatusHistoryResponse] = []
    booking_parts: List[BookingPartResponse] = []
    parts: Optional[List[BookingPartResponse]] = None
    invoice: Optional[InvoiceResponse] = None
    total_amount: Optional[Decimal] = None

    @model_validator(mode="before")
    @classmethod
    def populate_frontend_aliases(cls, data: Any) -> Any:
        if hasattr(data, "id"):
            app_date = getattr(data, "appointment_date")
            app_time = getattr(data, "appointment_time")
            inv = getattr(data, "invoice", None)
            serv = getattr(data, "service", None)
            tot = None
            if inv and getattr(inv, "total", None) is not None:
                tot = getattr(inv, "total")
            elif serv and getattr(serv, "base_price", None) is not None:
                tot = getattr(serv, "base_price")

            b_parts = getattr(data, "booking_parts", [])
            return {
                "id": getattr(data, "id"),
                "booking_reference": getattr(data, "booking_reference"),
                "customer_id": getattr(data, "customer_id"),
                "user_id": getattr(data, "customer_id"),
                "vehicle_id": getattr(data, "vehicle_id"),
                "service_id": getattr(data, "service_id"),
                "mechanic_id": getattr(data, "mechanic_id"),
                "appointment_date": app_date,
                "appointment_time": app_time,
                "scheduled_date": f"{app_date}T{app_time}" if app_date and app_time else str(app_date),
                "scheduled_time": app_time.strftime("%H:%M") if hasattr(app_time, "strftime") else str(app_time),
                "status": getattr(data, "status"),
                "notes": getattr(data, "notes"),
                "created_at": getattr(data, "created_at"),
                "updated_at": getattr(data, "updated_at"),
                "customer": getattr(data, "customer", None),
                "vehicle": getattr(data, "vehicle", None),
                "service": getattr(data, "service", None),
                "mechanic": getattr(data, "mechanic", None),
                "status_history": getattr(data, "status_history", []),
                "booking_parts": b_parts,
                "parts": b_parts,
                "invoice": inv,
                "total_amount": tot,
            }
        return data

    model_config = ConfigDict(from_attributes=True)
