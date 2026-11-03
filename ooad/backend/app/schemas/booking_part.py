from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class BookingPartCreate(BaseModel):
    spare_part_id: int
    quantity: int = Field(..., gt=0)


class BookingPartResponse(BaseModel):
    id: int
    booking_id: int
    spare_part_id: int
    quantity: int
    unit_price_at_use: Decimal
    total_price: Optional[Decimal] = None
    spare_part_name: Optional[str] = None
    spare_part_sku: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
