import random
import string
from datetime import datetime, date, time
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.booking import Booking, BookingStatus
from app.models.booking_status_history import BookingStatusHistory
from app.models.vehicle import Vehicle
from app.models.service import Service
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.schemas.booking import BookingCreate, BookingUpdate, BookingStatusUpdate

# Transition matrix specifying allowed roles per transition
ALLOWED_TRANSITIONS = {
    BookingStatus.pending: {
        BookingStatus.confirmed: ["admin"],
        BookingStatus.cancelled: ["customer", "admin"],
    },
    BookingStatus.confirmed: {
        BookingStatus.in_progress: ["mechanic", "admin"],
        BookingStatus.cancelled: ["admin"],
    },
    BookingStatus.in_progress: {
        BookingStatus.completed: ["mechanic", "admin"],
    },
    BookingStatus.completed: {
        BookingStatus.delivered: ["admin"],
    },
}


def generate_booking_reference(appointment_date: date, db: Session) -> str:
    """Generate a unique booking reference in the format AC-YYYYMMDD-XXXX."""
    date_str = appointment_date.strftime("%Y%m%d")
    for _ in range(50):
        chars = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        ref = f"AC-{date_str}-{chars}"
        if not db.query(Booking).filter(Booking.booking_reference == ref).first():
            return ref
    # Fallback with timestamp microsecond
    return f"AC-{date_str}-{int(datetime.utcnow().timestamp()) % 10000:04d}"


def validate_booking_slot(
    db: Session,
    appointment_date: date,
    appointment_time: time,
    exclude_booking_id: Optional[int] = None
) -> None:
    """Validate business hours, days, and slot availability."""
    # Check day of week: Monday=0, Saturday=5, Sunday=6
    if appointment_date.weekday() == 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bookings are not accepted on Sundays. AutoCare is open Monday to Saturday."
        )

    # Check business hours: 8:00 AM (08:00) to 6:00 PM (18:00)
    slot_hour = appointment_time.hour
    if slot_hour < settings.BUSINESS_HOURS_START or slot_hour >= settings.BUSINESS_HOURS_END:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Appointment time must be between {settings.BUSINESS_HOURS_START:02d}:00 and {settings.BUSINESS_HOURS_END:02d}:00."
        )

    # Check for slot conflicts (1 booking per slot, excluding cancelled)
    query = db.query(Booking).filter(
        Booking.appointment_date == appointment_date,
        Booking.appointment_time == appointment_time,
        Booking.status != BookingStatus.cancelled
    )
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)

    if query.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"The selected slot ({appointment_date} at {appointment_time.strftime('%H:%M')}) is already booked."
        )


def create_booking(db: Session, booking_in: BookingCreate, current_user: User) -> Booking:
    """Create a new service booking for a vehicle."""
    # Verify vehicle exists and belongs to current user (or user is admin)
    vehicle = db.query(Vehicle).filter(Vehicle.id == booking_in.vehicle_id).first()
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID {booking_in.vehicle_id} not found."
        )
    if current_user.role != UserRole.admin and vehicle.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create bookings for your own vehicles."
        )

    # Verify service exists and is active
    service = db.query(Service).filter(Service.id == booking_in.service_id).first()
    if not service or not service.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Service package is unavailable or does not exist."
        )

    # Validate slot
    validate_booking_slot(db, booking_in.appointment_date, booking_in.appointment_time)

    # Generate reference
    ref = generate_booking_reference(booking_in.appointment_date, db)

    booking = Booking(
        booking_reference=ref,
        customer_id=current_user.id if current_user.role != UserRole.admin else vehicle.customer_id,
        vehicle_id=booking_in.vehicle_id,
        service_id=booking_in.service_id,
        mechanic_id=None,
        appointment_date=booking_in.appointment_date,
        appointment_time=booking_in.appointment_time,
        status=BookingStatus.pending,
        notes=booking_in.notes
    )
    db.add(booking)
    db.flush()

    # Initial history record
    history = BookingStatusHistory(
        booking_id=booking.id,
        old_status=None,
        new_status=BookingStatus.pending.value,
        changed_by_id=current_user.id,
        notes="Booking created"
    )
    db.add(history)

    # Notification for customer
    notif = Notification(
        user_id=booking.customer_id,
        title="Booking Request Received",
        message=f"Your booking {ref} for {service.name} on {booking.appointment_date} is pending confirmation.",
        notification_type="booking_created"
    )
    db.add(notif)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="booking_created",
        entity_type="booking",
        entity_id=booking.id,
        details=f"Created booking {ref} for vehicle {vehicle.registration_number}"
    )
    db.add(audit)

    db.commit()
    db.refresh(booking)
    return booking


def get_bookings(
    db: Session,
    current_user: User,
    status_filter: Optional[BookingStatus] = None,
    customer_id: Optional[int] = None,
    mechanic_id: Optional[int] = None
) -> List[Booking]:
    """Retrieve bookings based on role and filters."""
    query = db.query(Booking)

    if current_user.role == UserRole.customer:
        query = query.filter(Booking.customer_id == current_user.id)
    elif current_user.role == UserRole.mechanic:
        query = query.filter(Booking.mechanic_id == current_user.id)
    else:  # Admin
        if customer_id:
            query = query.filter(Booking.customer_id == customer_id)
        if mechanic_id:
            query = query.filter(Booking.mechanic_id == mechanic_id)

    if status_filter:
        query = query.filter(Booking.status == status_filter)

    return query.order_by(Booking.appointment_date.desc(), Booking.appointment_time.desc()).all()


def get_booking_by_id(db: Session, booking_id: int, current_user: User) -> Booking:
    """Retrieve a single booking with authorization check."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking with ID {booking_id} not found."
        )

    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if user_role == "customer" and booking.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: this booking belongs to another customer."
        )
    if user_role == "mechanic" and booking.mechanic_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you are not assigned to this booking."
        )
    return booking


def update_booking_status(
    db: Session,
    booking_id: int,
    status_update: BookingStatusUpdate,
    current_user: User
) -> Booking:
    """Validate status transition and update status."""
    booking = get_booking_by_id(db, booking_id, current_user)
    current_status = booking.status
    target_status = status_update.status
    user_role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)

    # Check terminal statuses
    if current_status in [BookingStatus.cancelled, BookingStatus.delivered]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot modify bookings that are {current_status.value}."
        )

    # Check allowed transitions
    allowed_for_current = ALLOWED_TRANSITIONS.get(current_status, {})
    if target_status not in allowed_for_current:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{current_status.value}' to '{target_status.value}'."
        )

    # Check authorized roles for this transition
    allowed_roles = allowed_for_current[target_status]
    if user_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user_role}' is not authorized to transition booking from '{current_status.value}' to '{target_status.value}'."
        )

    # Perform transition
    booking.status = target_status
    booking.updated_at = datetime.utcnow()

    # Record history
    history = BookingStatusHistory(
        booking_id=booking.id,
        old_status=current_status.value,
        new_status=target_status.value,
        changed_by_id=current_user.id,
        notes=status_update.notes or f"Status changed to {target_status.value}"
    )
    db.add(history)

    # Notification for customer
    notif = Notification(
        user_id=booking.customer_id,
        title=f"Booking Status: {target_status.value.replace('_', ' ').capitalize()}",
        message=f"Booking {booking.booking_reference} status has been updated to {target_status.value}.",
        notification_type="booking_status_updated"
    )
    db.add(notif)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="booking_status_changed",
        entity_type="booking",
        entity_id=booking.id,
        details=f"Booking {booking.booking_reference} transitioned from {current_status.value} to {target_status.value}"
    )
    db.add(audit)

    db.commit()
    db.refresh(booking)
    return booking


def assign_mechanic(db: Session, booking_id: int, mechanic_id: int, current_user: User) -> Booking:
    """Assign a mechanic to a booking (Admin only)."""
    booking = get_booking_by_id(db, booking_id, current_user)
    if booking.status in [BookingStatus.cancelled, BookingStatus.delivered]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign mechanic to a cancelled or delivered booking."
        )

    mechanic = db.query(User).filter(User.id == mechanic_id, User.role == UserRole.mechanic).first()
    if not mechanic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mechanic with ID {mechanic_id} not found."
        )

    booking.mechanic_id = mechanic_id
    booking.updated_at = datetime.utcnow()

    # Notify mechanic
    notif = Notification(
        user_id=mechanic_id,
        title="New Service Assignment",
        message=f"You have been assigned to booking {booking.booking_reference} scheduled on {booking.appointment_date}.",
        notification_type="booking_assignment"
    )
    db.add(notif)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="mechanic_assigned",
        entity_type="booking",
        entity_id=booking.id,
        details=f"Assigned mechanic {mechanic.name} to booking {booking.booking_reference}"
    )
    db.add(audit)

    db.commit()
    db.refresh(booking)
    return booking


def cancel_booking(db: Session, booking_id: int, current_user: User, reason: Optional[str] = None) -> Booking:
    """Cancel a booking following transition rules."""
    status_update = BookingStatusUpdate(
        status=BookingStatus.cancelled,
        notes=reason or "Booking cancelled by user"
    )
    return update_booking_status(db, booking_id, status_update, current_user)
