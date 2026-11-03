from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.services import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/process", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def process_payment(
    payment_in: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process a payment for an invoice (Demo mode). Auto-confirms and updates invoice status."""
    return payment_service.process_payment(db, payment_in, current_user)


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get single payment details by ID."""
    return payment_service.get_payment_by_id(db, payment_id, current_user)


@router.get("/invoice/{invoice_id}", response_model=List[PaymentResponse])
def get_invoice_payments(
    invoice_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all payment records associated with an invoice."""
    return payment_service.get_payments_by_invoice(db, invoice_id, current_user)
