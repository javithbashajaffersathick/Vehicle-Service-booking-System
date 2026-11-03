import random
import string
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_item import InvoiceItem
from app.models.booking import Booking, BookingStatus
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.models.audit_log import AuditLog


def generate_invoice_number(db: Session) -> str:
    """Generate a unique invoice number."""
    date_str = datetime.utcnow().strftime("%Y%m%d")
    for _ in range(50):
        chars = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        inv_num = f"INV-{date_str}-{chars}"
        if not db.query(Invoice).filter(Invoice.invoice_number == inv_num).first():
            return inv_num
    return f"INV-{date_str}-{int(datetime.utcnow().timestamp()) % 10000:04d}"


def generate_invoice_for_booking(
    db: Session,
    booking_id: int,
    discount: Decimal = Decimal("0.0"),
    current_user: Optional[User] = None
) -> Invoice:
    """Generate an invoice for a completed booking. Ensures uniqueness per booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found."
        )

    # Check if booking is in completed or delivered status
    if booking.status not in [BookingStatus.completed, BookingStatus.delivered]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invoices can only be generated for completed bookings. Current status is '{booking.status.value}'."
        )

    # Check if invoice already exists
    existing_invoice = db.query(Invoice).filter(Invoice.booking_id == booking_id).first()
    if existing_invoice:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An invoice ({existing_invoice.invoice_number}) has already been generated for this booking."
        )

    # Calculate service cost
    service_price = Decimal(str(booking.service.base_price))
    items_to_create = []

    # Service item
    items_to_create.append({
        "description": f"Service: {booking.service.name}",
        "quantity": 1,
        "unit_price": service_price,
        "line_total": service_price
    })

    # Parts items
    parts_total = Decimal("0.00")
    for bp in booking.booking_parts:
        part_unit_price = Decimal(str(bp.unit_price_at_use))
        line_tot = Decimal(str(bp.quantity)) * part_unit_price
        parts_total += line_tot
        part_name = bp.spare_part.name if bp.spare_part else "Spare Part"
        items_to_create.append({
            "description": f"Part: {part_name}",
            "quantity": bp.quantity,
            "unit_price": part_unit_price,
            "line_total": line_tot
        })

    subtotal = service_price + parts_total
    discount_val = Decimal(str(discount)).quantize(Decimal("0.01"))
    if discount_val > subtotal:
        discount_val = subtotal

    taxable = subtotal - discount_val
    tax_rate = Decimal(str(settings.TAX_RATE))
    tax_amount = (taxable * tax_rate / Decimal("100.00")).quantize(Decimal("0.01"))
    total = (taxable + tax_amount).quantize(Decimal("0.01"))

    invoice = Invoice(
        invoice_number=generate_invoice_number(db),
        booking_id=booking.id,
        subtotal=subtotal,
        tax_rate=tax_rate,
        tax_amount=tax_amount,
        discount=discount_val,
        total=total,
        status=InvoiceStatus.issued
    )
    db.add(invoice)
    db.flush()

    for item_data in items_to_create:
        item = InvoiceItem(
            invoice_id=invoice.id,
            description=item_data["description"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            line_total=item_data["line_total"]
        )
        db.add(item)

    # Customer notification
    notif = Notification(
        user_id=booking.customer_id,
        title="Invoice Generated",
        message=f"Invoice {invoice.invoice_number} has been generated for your booking {booking.booking_reference}. Total: ${total:.2f}.",
        notification_type="invoice_generated"
    )
    db.add(notif)

    # Audit log
    audit_user_id = current_user.id if current_user else booking.customer_id
    audit = AuditLog(
        user_id=audit_user_id,
        action="invoice_generated",
        entity_type="invoice",
        entity_id=invoice.id,
        details=f"Generated invoice {invoice.invoice_number} for booking {booking.booking_reference}. Total: {total}"
    )
    db.add(audit)

    db.commit()
    db.refresh(invoice)
    return invoice


def get_invoice_by_id(db: Session, invoice_id: int, current_user: User) -> Invoice:
    """Retrieve invoice with access validation."""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice with ID {invoice_id} not found."
        )

    if current_user.role == UserRole.customer and invoice.booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this invoice."
        )

    return invoice


def get_invoices(db: Session, current_user: User, status_filter: Optional[InvoiceStatus] = None) -> List[Invoice]:
    """Retrieve all invoices appropriate for the user."""
    query = db.query(Invoice).join(Booking)
    if current_user.role == UserRole.customer:
        query = query.filter(Booking.customer_id == current_user.id)
    if status_filter:
        query = query.filter(Invoice.status == status_filter)
    return query.order_by(Invoice.created_at.desc()).all()
