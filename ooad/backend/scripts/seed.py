import sys
import os
from datetime import datetime, date, time, timedelta
from decimal import Decimal

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.customer_profile import CustomerProfile
from app.models.mechanic_profile import MechanicProfile
from app.models.vehicle import Vehicle
from app.models.service import Service
from app.models.booking import Booking, BookingStatus
from app.models.booking_status_history import BookingStatusHistory
from app.models.spare_part import SparePart
from app.models.inventory_movement import InventoryMovement, MovementType
from app.models.booking_part import BookingPart
from app.models.invoice import Invoice, InvoiceStatus
from app.models.invoice_item import InvoiceItem
from app.models.payment import Payment, PaymentStatus
from app.models.notification import Notification
from app.models.audit_log import AuditLog


def get_weekday_offset(base_date: date, days: int) -> date:
    """Helper to ensure appointment dates fall on Monday-Saturday (never Sunday)."""
    target = base_date + timedelta(days=days)
    if target.weekday() == 6:  # Sunday
        target += timedelta(days=1)
    return target


def seed_database():
    """Idempotently seed the AutoCare database with realistic test data."""
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        admin_check = db.query(User).filter(User.email == "admin@autocare.com").first()
        if admin_check:
            print("[INFO] Database has already been seeded. Skipping seed execution.")
            return

        print("[INFO] Seeding AutoCare database...")

        # 1. CREATE USERS & PROFILES
        # Admin
        admin = User(
            name="System Admin",
            email="admin@autocare.com",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.admin,
            is_active=True
        )
        db.add(admin)
        db.flush()

        # Mechanics
        mech1 = User(
            name="John Mechanic",
            email="john.mechanic@autocare.com",
            password_hash=get_password_hash("Mech@123"),
            role=UserRole.mechanic,
            is_active=True
        )
        db.add(mech1)
        db.flush()
        db.add(MechanicProfile(
            user_id=mech1.id,
            specialization="Engine Diagnostics & Overhaul",
            experience_years=8,
            is_available=True
        ))

        mech2 = User(
            name="Sarah Mechanic",
            email="sarah.mechanic@autocare.com",
            password_hash=get_password_hash("Mech@123"),
            role=UserRole.mechanic,
            is_active=True
        )
        db.add(mech2)
        db.flush()
        db.add(MechanicProfile(
            user_id=mech2.id,
            specialization="Brake & Suspension Systems",
            experience_years=5,
            is_available=True
        ))

        # Customers
        cust1 = User(
            name="Alice Smith",
            email="alice@example.com",
            password_hash=get_password_hash("Cust@123"),
            role=UserRole.customer,
            is_active=True
        )
        db.add(cust1)
        db.flush()
        db.add(CustomerProfile(
            user_id=cust1.id,
            phone="9876543210",
            address="123 Orchard Lane",
            city="Springfield",
            state="IL",
            zip_code="62701"
        ))

        cust2 = User(
            name="Bob Jones",
            email="bob@example.com",
            password_hash=get_password_hash("Cust@123"),
            role=UserRole.customer,
            is_active=True
        )
        db.add(cust2)
        db.flush()
        db.add(CustomerProfile(
            user_id=cust2.id,
            phone="9876543211",
            address="456 Elm Street",
            city="Columbus",
            state="OH",
            zip_code="43085"
        ))

        cust3 = User(
            name="Carol White",
            email="carol@example.com",
            password_hash=get_password_hash("Cust@123"),
            role=UserRole.customer,
            is_active=True
        )
        db.add(cust3)
        db.flush()
        db.add(CustomerProfile(
            user_id=cust3.id,
            phone="9876543212",
            address="789 Pine Avenue",
            city="Austin",
            state="TX",
            zip_code="78701"
        ))

        # Additional demo accounts for generic demo buttons
        demo_admin = User(
            name="Demo Admin",
            email="admin@example.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.admin,
            is_active=True
        )
        db.add(demo_admin)

        demo_mech = User(
            name="Demo Mechanic",
            email="mechanic@example.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.mechanic,
            is_active=True
        )
        db.add(demo_mech)
        db.flush()
        db.add(MechanicProfile(
            user_id=demo_mech.id,
            specialization="General Maintenance",
            experience_years=4,
            is_available=True
        ))

        demo_cust = User(
            name="Demo Customer",
            email="customer@example.com",
            password_hash=get_password_hash("password123"),
            role=UserRole.customer,
            is_active=True
        )
        db.add(demo_cust)
        db.flush()
        db.add(CustomerProfile(
            user_id=demo_cust.id,
            phone="9876543299",
            address="100 Demo Plaza",
            city="Metropolis",
            state="NY",
            zip_code="10001"
        ))

        print("[OK] Users & Profiles created.")

        # 2. CREATE VEHICLES (3 per customer)
        vehicles_data = [
            # Alice
            {"customer_id": cust1.id, "reg": "KA-01-AB-1234", "make": "Honda", "model": "Civic", "year": 2020, "color": "Silver", "notes": "Regular commuter car"},
            {"customer_id": cust1.id, "reg": "KA-01-CD-5678", "make": "Toyota", "model": "RAV4", "year": 2022, "color": "Midnight Blue", "notes": "Family SUV"},
            {"customer_id": cust1.id, "reg": "KA-01-EF-9012", "make": "Ford", "model": "F-150", "year": 2021, "color": "Black", "notes": "Towing package included"},
            # Bob
            {"customer_id": cust2.id, "reg": "MH-02-GH-3456", "make": "BMW", "model": "3 Series", "year": 2021, "color": "Alpine White", "notes": "Requires synthetic oil only"},
            {"customer_id": cust2.id, "reg": "MH-02-JK-7890", "make": "Audi", "model": "A4", "year": 2020, "color": "Daytona Grey", "notes": "Quattro AWD"},
            {"customer_id": cust2.id, "reg": "MH-02-LM-2345", "make": "Volkswagen", "model": "Golf GTI", "year": 2019, "color": "Tornado Red", "notes": "Track pack setup"},
            # Carol
            {"customer_id": cust3.id, "reg": "DL-03-NP-6789", "make": "Tesla", "model": "Model 3", "year": 2023, "color": "Pearl White", "notes": "Electric - suspension & brake focus"},
            {"customer_id": cust3.id, "reg": "DL-03-QR-0123", "make": "Hyundai", "model": "Tucson", "year": 2022, "color": "Crimson", "notes": "AWD crossover"},
            {"customer_id": cust3.id, "reg": "DL-03-ST-4567", "make": "Mazda", "model": "CX-5", "year": 2021, "color": "Soul Red", "notes": "Maintained at dealer"},
        ]
        created_vehicles = []
        for vd in vehicles_data:
            v = Vehicle(
                customer_id=vd["customer_id"],
                registration_number=vd["reg"],
                make=vd["make"],
                model=vd["model"],
                year=vd["year"],
                color=vd["color"],
                notes=vd["notes"]
            )
            db.add(v)
            created_vehicles.append(v)
        db.flush()
        print(f"[OK] {len(created_vehicles)} vehicles created.")

        # 3. CREATE SERVICE PACKAGES (6 packages)
        services_data = [
            {"name": "Basic Service", "description": "Engine oil check, air filter check, safety inspection, fluid top-up.", "price": Decimal("99.00"), "duration": 60},
            {"name": "Full Service", "description": "Comprehensive inspection, complete fluid replacement, spark plugs check, suspension check, wheel alignment.", "price": Decimal("249.00"), "duration": 180},
            {"name": "Oil Change", "description": "High-grade synthetic engine oil drain and refill with brand-new premium oil filter replacement.", "price": Decimal("49.00"), "duration": 45},
            {"name": "Brake Service", "description": "Front & rear brake pad inspection/replacement, rotor resurfacing check, and brake fluid flush.", "price": Decimal("159.00"), "duration": 90},
            {"name": "Engine Diagnostics", "description": "Full computerized ECU error code scan, emissions compliance check, and compression analysis.", "price": Decimal("89.00"), "duration": 60},
            {"name": "AC Service", "description": "Air conditioning system refrigerant recharge, condenser cleaning, and cabin filter replacement.", "price": Decimal("119.00"), "duration": 75},
        ]
        created_services = []
        for sd in services_data:
            s = Service(
                name=sd["name"],
                description=sd["description"],
                base_price=sd["price"],
                estimated_duration_minutes=sd["duration"],
                is_active=True
            )
            db.add(s)
            created_services.append(s)
        db.flush()
        print(f"[OK] {len(created_services)} service packages created.")

        # 4. CREATE SPARE PARTS (16 parts, with several low/out of stock)
        parts_data = [
            {"name": "Synthetic Engine Oil 5W-30 (1L)", "sku": "OIL-5W30-1L", "qty": 45, "thresh": 10, "price": Decimal("28.50")},
            {"name": "Premium Oil Filter", "sku": "FLT-OIL-01", "qty": 30, "thresh": 8, "price": Decimal("12.00")},
            {"name": "Engine Air Filter", "sku": "FLT-AIR-02", "qty": 4, "thresh": 6, "price": Decimal("18.50")},  # LOW STOCK
            {"name": "Cabin Air Filter HEPA", "sku": "FLT-CAB-03", "qty": 22, "thresh": 5, "price": Decimal("22.00")},
            {"name": "Front Ceramic Brake Pads Set", "sku": "BRK-PAD-F01", "qty": 3, "thresh": 5, "price": Decimal("65.00")},  # LOW STOCK
            {"name": "Rear Brake Pads Set", "sku": "BRK-PAD-R02", "qty": 14, "thresh": 5, "price": Decimal("55.00")},
            {"name": "Vented Brake Rotor 12-inch", "sku": "BRK-ROT-12", "qty": 8, "thresh": 4, "price": Decimal("85.00")},
            {"name": "Platinum Spark Plug", "sku": "SPK-PLG-01", "qty": 55, "thresh": 12, "price": Decimal("9.50")},
            {"name": "Serpentine Accessory Belt", "sku": "BLT-SRP-01", "qty": 2, "thresh": 4, "price": Decimal("32.00")},  # LOW STOCK
            {"name": "All-Weather Wiper Blades 22-in", "sku": "WIP-BLD-22", "qty": 38, "thresh": 10, "price": Decimal("16.00")},
            {"name": "Car Battery 12V 650CCA", "sku": "BAT-12V-650", "qty": 6, "thresh": 3, "price": Decimal("135.00")},
            {"name": "Radiator Coolant Premix 1 Gal", "sku": "FLU-CLT-01", "qty": 18, "thresh": 6, "price": Decimal("21.00")},
            {"name": "Brake Fluid DOT-4 (1L)", "sku": "FLU-BRK-DOT4", "qty": 1, "thresh": 5, "price": Decimal("14.50")},  # LOW STOCK
            {"name": "High Flow Fuel Filter", "sku": "FLT-FUL-01", "qty": 16, "thresh": 5, "price": Decimal("28.00")},
            {"name": "Front Gas Shock Absorber", "sku": "SUS-SHK-F01", "qty": 0, "thresh": 4, "price": Decimal("110.00")},  # OUT OF STOCK
            {"name": "Synthetic Transmission Fluid 4L", "sku": "FLU-ATF-4L", "qty": 11, "thresh": 4, "price": Decimal("42.00")},
        ]
        created_parts = []
        for pd in parts_data:
            part = SparePart(
                name=pd["name"],
                sku=pd["sku"],
                quantity=pd["qty"],
                reorder_threshold=pd["thresh"],
                unit_price=pd["price"],
                is_active=True
            )
            db.add(part)
            created_parts.append(part)
        db.flush()

        # Add initial inventory movements for each part
        for part in created_parts:
            if part.quantity > 0:
                mv = InventoryMovement(
                    spare_part_id=part.id,
                    booking_id=None,
                    quantity_change=part.quantity,
                    movement_type=MovementType.stock_in,
                    recorded_by_id=admin.id,
                    notes="Initial warehouse inventory stock-in"
                )
                db.add(mv)
        db.flush()
        print(f"[OK] {len(created_parts)} spare parts created with inventory movements.")

        # 5. CREATE BOOKINGS (9 bookings covering all statuses)
        today = date.today()
        bookings_meta = [
            # 1. Pending (Alice, Civic, Basic Service, upcoming slot)
            {
                "ref": f"AC-{today.strftime('%Y%m%d')}-A101",
                "customer": cust1, "vehicle": created_vehicles[0], "service": created_services[0],
                "mechanic": None, "date": get_weekday_offset(today, 2), "time": time(9, 0),
                "status": BookingStatus.pending, "notes": "Checking slight squeak in suspension"
            },
            # 2. Pending (Bob, BMW, Oil Change, upcoming slot)
            {
                "ref": f"AC-{today.strftime('%Y%m%d')}-B202",
                "customer": cust2, "vehicle": created_vehicles[3], "service": created_services[2],
                "mechanic": None, "date": get_weekday_offset(today, 3), "time": time(10, 0),
                "status": BookingStatus.pending, "notes": "Scheduled 10,000 mile oil service"
            },
            # 3. Confirmed (Alice, RAV4, Brake Service, assigned to John)
            {
                "ref": f"AC-{today.strftime('%Y%m%d')}-C303",
                "customer": cust1, "vehicle": created_vehicles[1], "service": created_services[3],
                "mechanic": mech1, "date": get_weekday_offset(today, 1), "time": time(11, 0),
                "status": BookingStatus.confirmed, "notes": "Pedal feels slightly spongy"
            },
            # 4. Confirmed (Bob, Audi A4, AC Service, assigned to Sarah)
            {
                "ref": f"AC-{today.strftime('%Y%m%d')}-D404",
                "customer": cust2, "vehicle": created_vehicles[4], "service": created_services[5],
                "mechanic": mech2, "date": get_weekday_offset(today, 1), "time": time(14, 0),
                "status": BookingStatus.confirmed, "notes": "AC blowing lukewarm air"
            },
            # 5. In Progress (Alice, Ford F-150, Oil Change, assigned to John)
            {
                "ref": f"AC-{today.strftime('%Y%m%d')}-E505",
                "customer": cust1, "vehicle": created_vehicles[2], "service": created_services[2],
                "mechanic": mech1, "date": get_weekday_offset(today, 0), "time": time(8, 0),
                "status": BookingStatus.in_progress, "notes": "Heavy duty oil change"
            },
            # 6. In Progress (Carol, Tesla Model 3, Brake Service, assigned to Sarah)
            {
                "ref": f"AC-{today.strftime('%Y%m%d')}-F606",
                "customer": cust3, "vehicle": created_vehicles[6], "service": created_services[3],
                "mechanic": mech2, "date": get_weekday_offset(today, 0), "time": time(13, 0),
                "status": BookingStatus.in_progress, "notes": "Regenerative brake inspection"
            },
            # 7. Completed (Bob, VW Golf, Engine Diagnostics, John)
            {
                "ref": f"AC-{get_weekday_offset(today, -2).strftime('%Y%m%d')}-G707",
                "customer": cust2, "vehicle": created_vehicles[5], "service": created_services[4],
                "mechanic": mech1, "date": get_weekday_offset(today, -2), "time": time(10, 0),
                "status": BookingStatus.completed, "notes": "Engine light on code P0300"
            },
            # 8. Delivered (Carol, Hyundai Tucson, Full Service, Sarah)
            {
                "ref": f"AC-{get_weekday_offset(today, -4).strftime('%Y%m%d')}-H808",
                "customer": cust3, "vehicle": created_vehicles[7], "service": created_services[1],
                "mechanic": mech2, "date": get_weekday_offset(today, -4), "time": time(9, 0),
                "status": BookingStatus.delivered, "notes": "Annual 30,000 km full maintenance"
            },
            # 9. Cancelled (Alice, Honda Civic, AC Service)
            {
                "ref": f"AC-{get_weekday_offset(today, -1).strftime('%Y%m%d')}-I909",
                "customer": cust1, "vehicle": created_vehicles[0], "service": created_services[5],
                "mechanic": None, "date": get_weekday_offset(today, -1), "time": time(15, 0),
                "status": BookingStatus.cancelled, "notes": "Customer had emergency travel"
            },
        ]

        created_bookings = []
        for bm in bookings_meta:
            b = Booking(
                booking_reference=bm["ref"],
                customer_id=bm["customer"].id,
                vehicle_id=bm["vehicle"].id,
                service_id=bm["service"].id,
                mechanic_id=bm["mechanic"].id if bm["mechanic"] else None,
                appointment_date=bm["date"],
                appointment_time=bm["time"],
                status=bm["status"],
                notes=bm["notes"]
            )
            db.add(b)
            created_bookings.append(b)
        db.flush()

        # Add status history for bookings
        for b in created_bookings:
            # Initial pending history
            db.add(BookingStatusHistory(
                booking_id=b.id,
                old_status=None,
                new_status=BookingStatus.pending.value,
                changed_by_id=b.customer_id,
                notes="Appointment booked"
            ))
            if b.status in [BookingStatus.confirmed, BookingStatus.in_progress, BookingStatus.completed, BookingStatus.delivered]:
                db.add(BookingStatusHistory(
                    booking_id=b.id,
                    old_status=BookingStatus.pending.value,
                    new_status=BookingStatus.confirmed.value,
                    changed_by_id=admin.id,
                    notes="Admin confirmed booking and scheduled slot"
                ))
            if b.status in [BookingStatus.in_progress, BookingStatus.completed, BookingStatus.delivered]:
                db.add(BookingStatusHistory(
                    booking_id=b.id,
                    old_status=BookingStatus.confirmed.value,
                    new_status=BookingStatus.in_progress.value,
                    changed_by_id=b.mechanic_id or admin.id,
                    notes="Mechanic began service inspection and work"
                ))
            if b.status in [BookingStatus.completed, BookingStatus.delivered]:
                db.add(BookingStatusHistory(
                    booking_id=b.id,
                    old_status=BookingStatus.in_progress.value,
                    new_status=BookingStatus.completed.value,
                    changed_by_id=b.mechanic_id or admin.id,
                    notes="All checklist items completed successfully"
                ))
            if b.status == BookingStatus.delivered:
                db.add(BookingStatusHistory(
                    booking_id=b.id,
                    old_status=BookingStatus.completed.value,
                    new_status=BookingStatus.delivered.value,
                    changed_by_id=admin.id,
                    notes="Vehicle handed over to customer"
                ))
            if b.status == BookingStatus.cancelled:
                db.add(BookingStatusHistory(
                    booking_id=b.id,
                    old_status=BookingStatus.pending.value,
                    new_status=BookingStatus.cancelled.value,
                    changed_by_id=b.customer_id,
                    notes="Customer requested cancellation"
                ))
        db.flush()
        print(f"[OK] {len(created_bookings)} bookings with status history created.")

        # 6. BOOKING PARTS FOR IN_PROGRESS, COMPLETED, DELIVERED BOOKINGS
        # Booking 5 (in_progress, Ford F-150): Oil Change -> Synthetic Oil (2x), Oil Filter (1x)
        b5 = created_bookings[4]
        bp5_1 = BookingPart(booking_id=b5.id, spare_part_id=created_parts[0].id, quantity=2, unit_price_at_use=created_parts[0].unit_price)
        bp5_2 = BookingPart(booking_id=b5.id, spare_part_id=created_parts[1].id, quantity=1, unit_price_at_use=created_parts[1].unit_price)
        db.add_all([bp5_1, bp5_2])

        # Booking 6 (in_progress, Tesla Model 3): Brake Service -> Front Ceramic Brake Pads (1x), Brake Fluid (1x)
        b6 = created_bookings[5]
        bp6_1 = BookingPart(booking_id=b6.id, spare_part_id=created_parts[4].id, quantity=1, unit_price_at_use=created_parts[4].unit_price)
        bp6_2 = BookingPart(booking_id=b6.id, spare_part_id=created_parts[12].id, quantity=1, unit_price_at_use=created_parts[12].unit_price)
        db.add_all([bp6_1, bp6_2])

        # Booking 7 (completed, VW Golf): Engine Diagnostics -> Spark Plugs (4x), Engine Air Filter (1x)
        b7 = created_bookings[6]
        bp7_1 = BookingPart(booking_id=b7.id, spare_part_id=created_parts[7].id, quantity=4, unit_price_at_use=created_parts[7].unit_price)
        bp7_2 = BookingPart(booking_id=b7.id, spare_part_id=created_parts[2].id, quantity=1, unit_price_at_use=created_parts[2].unit_price)
        db.add_all([bp7_1, bp7_2])

        # Booking 8 (delivered, Hyundai Tucson): Full Service -> Serpentine Belt (1x), Radiator Coolant (1x)
        b8 = created_bookings[7]
        bp8_1 = BookingPart(booking_id=b8.id, spare_part_id=created_parts[8].id, quantity=1, unit_price_at_use=created_parts[8].unit_price)
        bp8_2 = BookingPart(booking_id=b8.id, spare_part_id=created_parts[11].id, quantity=1, unit_price_at_use=created_parts[11].unit_price)
        db.add_all([bp8_1, bp8_2])
        db.flush()
        print("[OK] Booking spare parts linked.")

        # 7. INVOICES FOR COMPLETED AND DELIVERED BOOKINGS
        # Invoice 1 for Booking 7 (Completed, Bob):
        # Service: Engine Diagnostics ($89.00)
        # Parts: Spark Plugs 4x $9.50 = $38.00; Air filter 1x $18.50 = $18.50
        # Subtotal: 89.00 + 38.00 + 18.50 = 145.50
        # Discount: 0.00
        # Tax (18%): 145.50 * 0.18 = 26.19
        # Total: 171.69
        inv7 = Invoice(
            invoice_number=f"INV-{b7.appointment_date.strftime('%Y%m%d')}-7001",
            booking_id=b7.id,
            subtotal=Decimal("145.50"),
            tax_rate=Decimal("18.00"),
            tax_amount=Decimal("26.19"),
            discount=Decimal("0.00"),
            total=Decimal("171.69"),
            status=InvoiceStatus.issued
        )
        db.add(inv7)
        db.flush()

        db.add(InvoiceItem(invoice_id=inv7.id, description="Service: Engine Diagnostics", quantity=1, unit_price=Decimal("89.00"), line_total=Decimal("89.00")))
        db.add(InvoiceItem(invoice_id=inv7.id, description="Part: Platinum Spark Plug", quantity=4, unit_price=Decimal("9.50"), line_total=Decimal("38.00")))
        db.add(InvoiceItem(invoice_id=inv7.id, description="Part: Engine Air Filter", quantity=1, unit_price=Decimal("18.50"), line_total=Decimal("18.50")))

        # Invoice 2 for Booking 8 (Delivered, Carol):
        # Service: Full Service ($249.00)
        # Parts: Serpentine Belt 1x $32.00 = $32.00; Coolant 1x $21.00 = $21.00
        # Subtotal: 249.00 + 32.00 + 21.00 = 302.00
        # Discount: 20.00 -> Taxable: 282.00
        # Tax (18%): 282.00 * 0.18 = 50.76
        # Total: 332.76
        inv8 = Invoice(
            invoice_number=f"INV-{b8.appointment_date.strftime('%Y%m%d')}-8002",
            booking_id=b8.id,
            subtotal=Decimal("302.00"),
            tax_rate=Decimal("18.00"),
            tax_amount=Decimal("50.76"),
            discount=Decimal("20.00"),
            total=Decimal("332.76"),
            status=InvoiceStatus.paid
        )
        db.add(inv8)
        db.flush()

        db.add(InvoiceItem(invoice_id=inv8.id, description="Service: Full Service", quantity=1, unit_price=Decimal("249.00"), line_total=Decimal("249.00")))
        db.add(InvoiceItem(invoice_id=inv8.id, description="Part: Serpentine Accessory Belt", quantity=1, unit_price=Decimal("32.00"), line_total=Decimal("32.00")))
        db.add(InvoiceItem(invoice_id=inv8.id, description="Part: Radiator Coolant Premix 1 Gal", quantity=1, unit_price=Decimal("21.00"), line_total=Decimal("21.00")))

        # 8. PAYMENT FOR INVOICE 8 (Delivered booking)
        payment8 = Payment(
            invoice_id=inv8.id,
            amount=Decimal("332.76"),
            payment_method="Credit Card",
            transaction_reference="TXN-DEMO-DLV001",
            status=PaymentStatus.completed
        )
        db.add(payment8)
        db.flush()
        print("[OK] Invoices and Payments created.")

        # 9. NOTIFICATIONS
        notifications_data = [
            {"user_id": cust1.id, "title": "Booking Confirmed", "message": "Your booking AC-C303 for Brake Service has been confirmed for tomorrow.", "type": "booking_confirmed", "read": False},
            {"user_id": cust2.id, "title": "Invoice Ready", "message": f"Invoice {inv7.invoice_number} is ready for review.", "type": "invoice_generated", "read": False},
            {"user_id": cust3.id, "title": "Vehicle Delivered", "message": "Your Hyundai Tucson is serviced and ready for pickup. Thank you!", "type": "booking_status_updated", "read": True},
            {"user_id": mech1.id, "title": "New Assignment", "message": "You have been assigned to service booking AC-C303.", "type": "booking_assignment", "read": False},
            {"user_id": admin.id, "title": "Low Stock Warning", "message": "Brake Fluid DOT-4 and Air Filter stock is low.", "type": "low_stock", "read": False},
        ]
        for nd in notifications_data:
            db.add(Notification(
                user_id=nd["user_id"],
                title=nd["title"],
                message=nd["message"],
                notification_type=nd["type"],
                is_read=nd["read"]
            ))

        # 10. AUDIT LOGS
        audit_data = [
            {"user_id": admin.id, "action": "seed_initialization", "entity_type": "system", "entity_id": 1, "details": "AutoCare test database populated with baseline seed dataset"},
            {"user_id": cust1.id, "action": "booking_created", "entity_type": "booking", "entity_id": created_bookings[0].id, "details": "Customer Alice Smith created booking AC-A101"},
            {"user_id": admin.id, "action": "booking_confirmed", "entity_type": "booking", "entity_id": created_bookings[2].id, "details": "Admin confirmed booking AC-C303 and assigned John Mechanic"},
            {"user_id": mech1.id, "action": "booking_in_progress", "entity_type": "booking", "entity_id": created_bookings[4].id, "details": "John Mechanic started work on Ford F-150"},
            {"user_id": cust3.id, "action": "payment_completed", "entity_type": "payment", "entity_id": payment8.id, "details": "Payment of $332.76 received for Invoice INV-8002"},
        ]
        for ad in audit_data:
            db.add(AuditLog(
                user_id=ad["user_id"],
                action=ad["action"],
                entity_type=ad["entity_type"],
                entity_id=ad["entity_id"],
                details=ad["details"]
            ))

        db.commit()
        print("\n[SUCCESS] AutoCare database seeding completed successfully!")
        print("------------------------------------------------------------")
        print("Test Accounts Available:")
        print("  Admin:     admin@autocare.com        / Admin@123")
        print("  Mechanic:  john.mechanic@autocare.com / Mech@123")
        print("  Mechanic:  sarah.mechanic@autocare.com / Mech@123")
        print("  Customer:  alice@example.com         / Cust@123")
        print("  Customer:  bob@example.com           / Cust@123")
        print("  Customer:  carol@example.com         / Cust@123")
        print("------------------------------------------------------------")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to seed database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
