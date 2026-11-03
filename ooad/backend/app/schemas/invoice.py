from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models.invoice import InvoiceStatus
from app.schemas.payment import PaymentResponse


class InvoiceItemResponse(BaseModel):
    id: int
    invoice_id: int
    description: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class InvoiceCreate(BaseModel):
    booking_id: int
    discount: Optional[Decimal] = Field(default=Decimal("0.0"), ge=0)


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    booking_id: int
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    discount: Decimal
    total: Decimal
    status: InvoiceStatus
    created_at: datetime
    items: List[InvoiceItemResponse] = []
    payments: List[PaymentResponse] = []

    # Frontend aliases
    amount: Optional[Decimal] = None
    labor_cost: Optional[Decimal] = None
    parts_cost: Optional[Decimal] = None
    tax: Optional[Decimal] = None
    paid_at: Optional[str] = None
    payment_method: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if hasattr(data, "id"):
            tot = getattr(data, "total", Decimal("0.00"))
            tax_amt = getattr(data, "tax_amount", Decimal("0.00"))
            items = getattr(data, "items", [])
            payments = getattr(data, "payments", [])

            labor = Decimal("0.00")
            parts = Decimal("0.00")
            for item in items:
                desc = getattr(item, "description", "").lower()
                lt = getattr(item, "line_total", Decimal("0.00"))
                if "service:" in desc or "labor" in desc:
                    labor += lt
                else:
                    parts += lt

            paid_dt = None
            pay_method = None
            if payments:
                last_pay = payments[-1]
                paid_dt = str(getattr(last_pay, "created_at", ""))
                pay_method = getattr(last_pay, "payment_method", "demo")

            return {
                "id": getattr(data, "id"),
                "invoice_number": getattr(data, "invoice_number"),
                "booking_id": getattr(data, "booking_id"),
                "subtotal": getattr(data, "subtotal"),
                "tax_rate": getattr(data, "tax_rate"),
                "tax_amount": tax_amt,
                "discount": getattr(data, "discount"),
                "total": tot,
                "status": getattr(data, "status"),
                "created_at": getattr(data, "created_at"),
                "items": items,
                "payments": payments,
                "amount": tot,
                "labor_cost": labor if labor > Decimal("0.00") else getattr(data, "subtotal", tot),
                "parts_cost": parts,
                "tax": tax_amt,
                "paid_at": paid_dt,
                "payment_method": pay_method,
            }
        return data

    model_config = ConfigDict(from_attributes=True)
