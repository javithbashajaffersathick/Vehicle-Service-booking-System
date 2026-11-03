from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from app.models.payment import PaymentStatus


class PaymentCreate(BaseModel):
    invoice_id: int
    amount: Decimal = Field(..., gt=0)
    payment_method: str = Field(default="demo", min_length=1, max_length=50)


class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    amount: Decimal
    payment_method: str
    transaction_reference: str
    status: PaymentStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
