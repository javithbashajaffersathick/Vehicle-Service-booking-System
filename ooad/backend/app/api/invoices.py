from typing import List, Optional, Any
from decimal import Decimal
from pydantic import BaseModel
from fastapi import APIRouter, Depends, status, Query, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.invoice import InvoiceStatus
from app.schemas.invoice import InvoiceCreate, InvoiceResponse
from app.schemas.payment import PaymentCreate
from app.services import invoice_service, payment_service

router = APIRouter(prefix="/invoices", tags=["Invoices"])


class PayInvoiceBody(BaseModel):
    payment_method: Optional[str] = "credit_card"
    transaction_id: Optional[str] = None
    card_number: Optional[str] = None
    card_expiry: Optional[str] = None
    card_cvc: Optional[str] = None


@router.post("/generate", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def generate_invoice(
    invoice_in: InvoiceCreate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Generate an official invoice for a completed booking (Admin only)."""
    return invoice_service.generate_invoice_for_booking(
        db=db,
        booking_id=invoice_in.booking_id,
        discount=invoice_in.discount or Decimal("0.0"),
        current_user=current_admin
    )


@router.get("", response_model=List[InvoiceResponse])
@router.get("/", response_model=List[InvoiceResponse])
def list_invoices(
    status_filter: Optional[InvoiceStatus] = Query(None, alias="status", description="Filter by invoice status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List invoices. Customers view own; Admins view all."""
    return invoice_service.get_invoices(db, current_user, status_filter=status_filter)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full invoice details with line items and payments."""
    return invoice_service.get_invoice_by_id(db, invoice_id, current_user)


@router.post("/{invoice_id}/pay", response_model=InvoiceResponse)
def pay_invoice(
    invoice_id: int,
    body: Optional[PayInvoiceBody] = Body(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process payment for an invoice (Frontend alias)."""
    invoice = invoice_service.get_invoice_by_id(db, invoice_id, current_user)
    payment_in = PaymentCreate(
        invoice_id=invoice.id,
        amount=invoice.total,
        payment_method=(body.payment_method if body and body.payment_method else "credit_card")
    )
    payment_service.process_payment(db, payment_in, current_user)
    db.refresh(invoice)
    return invoice
