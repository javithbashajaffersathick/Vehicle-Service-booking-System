# AutoCare — UML Diagrams

## 1. Use Case Diagram

```mermaid
graph TD
    subgraph "AutoCare System"
        UC1["Register Account"]
        UC2["Login / Logout"]
        UC3["Manage Profile"]
        UC4["Manage Vehicles"]
        UC5["Browse Services"]
        UC6["Book Appointment"]
        UC7["View Bookings"]
        UC8["Cancel Booking"]
        UC9["View Invoice"]
        UC10["Make Payment"]
        UC11["View Notifications"]
        UC12["Confirm Booking"]
        UC13["Assign Mechanic"]
        UC14["Manage Services"]
        UC15["Manage Mechanics"]
        UC16["Manage Inventory"]
        UC17["Generate Invoice"]
        UC18["View Reports"]
        UC19["View Dashboard"]
        UC20["Update Job Status"]
        UC21["Record Parts Used"]
        UC22["View Assigned Jobs"]
        UC23["Mark Job Complete"]
        UC24["Manage Customers"]
    end

    Customer["🧑 Customer"]
    Admin["👔 Admin"]
    Mechanic["🔧 Mechanic"]

    Customer --- UC1
    Customer --- UC2
    Customer --- UC3
    Customer --- UC4
    Customer --- UC5
    Customer --- UC6
    Customer --- UC7
    Customer --- UC8
    Customer --- UC9
    Customer --- UC10
    Customer --- UC11

    Admin --- UC2
    Admin --- UC12
    Admin --- UC13
    Admin --- UC14
    Admin --- UC15
    Admin --- UC16
    Admin --- UC17
    Admin --- UC18
    Admin --- UC19
    Admin --- UC24
    Admin --- UC11

    Mechanic --- UC2
    Mechanic --- UC20
    Mechanic --- UC21
    Mechanic --- UC22
    Mechanic --- UC23
    Mechanic --- UC11
```

## 2. Class Diagram

```mermaid
classDiagram
    class User {
        +int id
        +str name
        +str email
        +str password_hash
        +UserRole role
        +bool is_active
        +datetime created_at
        +verify_password(password) bool
        +set_password(password) void
    }

    class CustomerProfile {
        +int id
        +int user_id
        +str phone
        +str address
        +str city
        +str state
        +str zip_code
    }

    class MechanicProfile {
        +int id
        +int user_id
        +str specialization
        +int experience_years
        +bool is_available
    }

    class Vehicle {
        +int id
        +int customer_id
        +str registration_number
        +str make
        +str model
        +int year
        +str color
        +str notes
        +datetime created_at
    }

    class Service {
        +int id
        +str name
        +str description
        +Decimal base_price
        +int estimated_duration_minutes
        +bool is_active
        +datetime created_at
    }

    class Booking {
        +int id
        +str booking_reference
        +int customer_id
        +int vehicle_id
        +int service_id
        +int mechanic_id
        +date appointment_date
        +time appointment_time
        +BookingStatus status
        +str notes
        +datetime created_at
        +generate_reference() str
        +can_transition_to(status) bool
        +cancel() void
    }

    class BookingStatusHistory {
        +int id
        +int booking_id
        +str old_status
        +str new_status
        +int changed_by_id
        +str notes
        +datetime created_at
    }

    class SparePart {
        +int id
        +str name
        +str sku
        +int quantity
        +int reorder_threshold
        +Decimal unit_price
        +bool is_active
        +is_low_stock() bool
    }

    class InventoryMovement {
        +int id
        +int spare_part_id
        +int booking_id
        +int quantity_change
        +MovementType movement_type
        +int recorded_by_id
        +str notes
        +datetime created_at
    }

    class BookingPart {
        +int id
        +int booking_id
        +int spare_part_id
        +int quantity
        +Decimal unit_price_at_use
    }

    class Invoice {
        +int id
        +str invoice_number
        +int booking_id
        +Decimal subtotal
        +Decimal tax_rate
        +Decimal tax_amount
        +Decimal discount
        +Decimal total
        +InvoiceStatus status
        +datetime created_at
        +calculate_total() Decimal
    }

    class InvoiceItem {
        +int id
        +int invoice_id
        +str description
        +int quantity
        +Decimal unit_price
        +Decimal line_total
    }

    class Payment {
        +int id
        +int invoice_id
        +Decimal amount
        +str payment_method
        +str transaction_reference
        +PaymentStatus status
        +datetime created_at
    }

    class Notification {
        +int id
        +int user_id
        +str title
        +str message
        +str notification_type
        +bool is_read
        +datetime created_at
        +mark_as_read() void
    }

    class AuditLog {
        +int id
        +int user_id
        +str action
        +str entity_type
        +int entity_id
        +str details
        +datetime created_at
    }

    User "1" --> "0..1" CustomerProfile : has
    User "1" --> "0..1" MechanicProfile : has
    User "1" --> "*" Vehicle : owns
    User "1" --> "*" Booking : places
    User "1" --> "*" Notification : receives
    User "1" --> "*" AuditLog : performs

    Vehicle "*" --> "1" User : belongs to
    Booking "*" --> "1" Vehicle : for
    Booking "*" --> "1" Service : requests
    Booking "0..*" --> "0..1" User : assigned mechanic
    Booking "1" --> "*" BookingStatusHistory : tracks
    Booking "1" --> "*" BookingPart : uses
    Booking "1" --> "0..1" Invoice : generates

    SparePart "1" --> "*" InventoryMovement : tracks
    SparePart "1" --> "*" BookingPart : used in
    BookingPart "*" --> "1" SparePart : references

    Invoice "1" --> "*" InvoiceItem : contains
    Invoice "1" --> "*" Payment : receives
```

## 3. Sequence Diagram — Booking Flow

```mermaid
sequenceDiagram
    actor Customer
    participant Frontend
    participant API as FastAPI Router
    participant BookingSvc as BookingService
    participant DB as Database

    Customer->>Frontend: Fill booking form
    Frontend->>API: POST /api/v1/bookings
    API->>API: Validate JWT token
    API->>BookingSvc: create_booking(data, user)

    BookingSvc->>DB: Verify vehicle ownership
    DB-->>BookingSvc: Vehicle confirmed

    BookingSvc->>DB: Check slot availability
    DB-->>BookingSvc: Slot available

    BookingSvc->>DB: Generate unique reference
    BookingSvc->>DB: INSERT booking (status=pending)
    DB-->>BookingSvc: Booking created

    BookingSvc->>DB: INSERT status history
    BookingSvc->>DB: INSERT notification

    BookingSvc-->>API: BookingResponse
    API-->>Frontend: 201 Created
    Frontend-->>Customer: Confirmation screen
```

## 4. Activity Diagram — Service Completion & Billing

```mermaid
flowchart TD
    A["Service Completed by Mechanic"] --> B["Mechanic updates status to 'Completed'"]
    B --> C["System records status history"]
    C --> D["Admin reviews completed service"]
    D --> E{"Generate Invoice?"}

    E -- Yes --> F["System calculates invoice"]
    F --> G["Fetch service base price"]
    G --> H["Fetch consumed spare parts"]
    H --> I["Apply tax rate 18%"]
    I --> J["Apply discount if any"]
    J --> K["Calculate final total"]
    K --> L["Create invoice with line items"]
    L --> M["Notify customer of invoice"]
    M --> N["Customer views invoice"]

    E -- No --> D

    N --> O{"Customer pays?"}
    O -- Yes --> P["Customer initiates demo payment"]
    P --> Q["Server validates payment amount"]
    Q --> R["Process demo transaction"]
    R --> S["Record payment with reference"]
    S --> T["Update invoice status to 'Paid'"]
    T --> U["Notify customer of payment"]
    U --> V["Admin marks as 'Delivered'"]
    V --> W["Service complete"]

    O -- Not yet --> N
```

## 5. State Diagram — Booking Status

```mermaid
stateDiagram-v2
    [*] --> Pending : Customer creates booking

    Pending --> Confirmed : Admin confirms
    Pending --> Cancelled : Customer/Admin cancels

    Confirmed --> InProgress : Mechanic/Admin starts
    Confirmed --> Cancelled : Admin cancels

    InProgress --> Completed : Mechanic/Admin completes

    Completed --> Delivered : Admin delivers

    Cancelled --> [*]
    Delivered --> [*]

    note right of Pending : Initial state after booking
    note right of Confirmed : Mechanic assigned, ready to start
    note right of InProgress : Service being performed
    note right of Completed : Service done, invoice generated
    note right of Delivered : Vehicle returned to customer
    note right of Cancelled : Booking cancelled
```

## 6. Component Diagram

```mermaid
flowchart TD
    subgraph "Frontend - React + TypeScript"
        subgraph "Pages"
            LP["Landing Page"]
            Auth["Auth Pages"]
            CD["Customer Dashboard"]
            AD["Admin Dashboard"]
            MD["Mechanic Dashboard"]
        end

        subgraph "Shared Components"
            UI["UI Components"]
            Forms["Form Components"]
            Charts["Chart Components"]
        end

        subgraph "State & Services"
            AuthCtx["Auth Context"]
            APIClient["API Client - Axios"]
            Hooks["Custom Hooks"]
        end
    end

    subgraph "Backend - FastAPI"
        subgraph "API Layer"
            AuthAPI["Auth Router"]
            BookingAPI["Booking Router"]
            VehicleAPI["Vehicle Router"]
            ServiceAPI["Service Router"]
            MechAPI["Mechanic Router"]
            InvAPI["Inventory Router"]
            InvoiceAPI["Invoice Router"]
            PayAPI["Payment Router"]
            NotifAPI["Notification Router"]
            ReportAPI["Report Router"]
        end

        subgraph "Service Layer"
            AuthSvc["AuthService"]
            BookingSvc["BookingService"]
            VehicleSvc["VehicleService"]
            InvSvc["InventoryService"]
            InvoiceSvc["InvoiceService"]
            PaySvc["PaymentService"]
            NotifSvc["NotificationService"]
            ReportSvc["ReportService"]
        end

        subgraph "Data Layer"
            Models["SQLAlchemy Models"]
            Schemas["Pydantic Schemas"]
        end

        subgraph "Core"
            Security["Security - JWT + Bcrypt"]
            Config["Configuration"]
            Deps["Dependencies"]
        end
    end

    subgraph "Database"
        SQLite["SQLite / PostgreSQL"]
    end

    APIClient --> AuthAPI
    APIClient --> BookingAPI
    APIClient --> VehicleAPI
    APIClient --> ServiceAPI

    AuthAPI --> AuthSvc
    BookingAPI --> BookingSvc
    VehicleAPI --> VehicleSvc
    InvAPI --> InvSvc
    InvoiceAPI --> InvoiceSvc
    PayAPI --> PaySvc
    NotifAPI --> NotifSvc
    ReportAPI --> ReportSvc

    AuthSvc --> Models
    BookingSvc --> Models
    VehicleSvc --> Models
    InvSvc --> Models
    InvoiceSvc --> Models

    Models --> SQLite
```

## 7. Deployment Diagram

```mermaid
flowchart LR
    subgraph "Developer Machine"
        subgraph "Frontend Server"
            Vite["Vite Dev Server<br/>Port 5173"]
        end

        subgraph "Backend Server"
            Uvicorn["Uvicorn + FastAPI<br/>Port 8000"]
        end

        subgraph "Database"
            DB["SQLite<br/>autocare.db"]
        end

        subgraph "Optional"
            Docker["Docker<br/>PostgreSQL:5432"]
        end
    end

    Browser["Web Browser"] --> Vite
    Vite -->|"Proxy /api/*"| Uvicorn
    Uvicorn --> DB
    Uvicorn -.->|"If configured"| Docker
```
