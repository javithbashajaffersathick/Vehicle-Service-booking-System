import uuid
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.payment import Payment, PaymentStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.schemas.payment import PaymentCreate


def process_payment(db: Session, payment_in: PaymentCreate, current_user: User) -> Payment:
    """Process a payment for an invoice (Demo mode auto-succeeds)."""
    invoice = db.query(Invoice).filter(Invoice.id == payment_in.invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID {payment_in.invoice_id} not found."
        )

    # Permission check: customer can only pay own invoice
    if current_user.role == UserRole.customer and invoice.booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to pay this invoice."
        )

    if invoice.status == InvoiceStatus.paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invoice has already been fully paid."
        )

    if invoice.status == InvoiceStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot pay a cancelled invoice."
        )

    # Calculate paid total so far
    total_paid = sum(
        Decimal(str(p.amount))
        for p in invoice.payments
        if p.status == PaymentStatus.completed
    )
    balance_due = Decimal(str(invoice.total)) - total_paid

    if payment_in.amount > balance_due:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment amount (${payment_in.amount:.2f}) exceeds remaining balance due (${balance_due:.2f})."
        )

    # Demo mode generates a unique transaction reference
    txn_ref = f"TXN-DEMO-{uuid.uuid4().hex[:12].upper()}"

    payment = Payment(
        invoice_id=invoice.id,
        amount=payment_in.amount,
        payment_method=payment_in.payment_method or "demo",
        transaction_reference=txn_ref,
        status=PaymentStatus.completed
    )
    db.add(payment)
    db.flush()

    # If full balance is paid, update invoice status to paid
    if (total_paid + payment_in.amount) >= Decimal(str(invoice.total)):
        invoice.status = InvoiceStatus.paid

    # Notify customer
    notif = Notification(
        user_id=invoice.booking.customer_id,
        title="Payment Successful",
        message=f"Payment of ${payment_in.amount:.2f} for Invoice {invoice.invoice_number} received successfully. Transaction Ref: {txn_ref}.",
        notification_type="payment_success"
    )
    db.add(notif)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="payment_processed",
        entity_type="payment",
        entity_id=payment.id,
        details=f"Payment of ${payment_in.amount:.2f} processed for Invoice {invoice.invoice_number} via {payment.payment_method}"
    )
    db.add(audit)

    db.commit()
    db.refresh(payment)
    return payment


def get_payment_by_id(db: Session, payment_id: int, current_user: User) -> Payment:
    """Retrieve payment by ID."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment with ID {payment_id} not found."
        )

    if current_user.role == UserRole.customer and payment.invoice.booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: this payment belongs to another user."
        )

    return payment


def get_payments_by_invoice(db: Session, invoice_id: int, current_user: User) -> List[Payment]:
    """Retrieve all payments for an invoice."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID {invoice_id} not found."
        )

    if current_user.role == UserRole.customer and invoice.booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden."
        )

    return db.query(Payment).filter(Payment.invoice_id == invoice_id).order_by(Payment.created_at.desc()).all()
