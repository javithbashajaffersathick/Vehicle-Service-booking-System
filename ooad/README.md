# 🚗 AutoCare — Vehicle Service Booking System

> A comprehensive full-stack web application for digitizing the vehicle servicing process, connecting customers, service-center administrators, and mechanics.

**Built for:** OOAD (Object-Oriented Analysis and Design) College Project

---

## 📑 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [API Documentation](#api-documentation)
- [Running Tests](#running-tests)
- [OOAD Concepts](#ooad-concepts)
- [UML Diagrams](#uml-diagrams)
- [College Demonstration Script](#college-demonstration-script)
- [Known Limitations](#known-limitations)

---

## ✨ Features

### Customer Features
- ✅ User registration and authentication (JWT-based)
- ✅ Vehicle management (add, view, edit vehicles)
- ✅ Browse service catalogue with prices
- ✅ Book appointments with slot conflict prevention
- ✅ View booking details and service progress timeline
- ✅ View and cancel eligible bookings
- ✅ View invoices and make demo payments
- ✅ In-app notification center
- ✅ Service and vehicle maintenance history

### Admin Features
- ✅ Dashboard with real-time statistics from database
- ✅ Booking management with status controls
- ✅ Mechanic creation and job assignment
- ✅ Service package and pricing management
- ✅ Spare-parts inventory with low-stock alerts
- ✅ Invoice generation and payment tracking
- ✅ Reports and analytics with charts
- ✅ Customer and vehicle management
- ✅ Audit logging

### Mechanic Features
- ✅ Dedicated mechanic dashboard
- ✅ View assigned jobs only
- ✅ Update service progress (status transitions)
- ✅ Record work notes and parts used
- ✅ Mark jobs as completed
- ✅ View completed service history

### Technical Features
- ✅ Role-based access control (backend-enforced)
- ✅ Database transactions for booking, billing, and inventory
- ✅ Decimal-safe monetary calculations
- ✅ Configurable business hours and slot duration
- ✅ Booking reference generation
- ✅ Status transition validation
- ✅ Audit trail for administrative actions
- ✅ Comprehensive automated tests

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui-style components |
| **Forms** | React Hook Form + Zod validation |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Routing** | React Router v6 |
| **Backend** | Python 3.11, FastAPI |
| **ORM** | SQLAlchemy 2.0 |
| **Validation** | Pydantic v2 |
| **Auth** | JWT (python-jose) + bcrypt |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **Testing** | Pytest (backend), Vitest (frontend) |

---

## 📁 Project Structure

```
autocare/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/           # Base UI components (Button, Card, Input, etc.)
│   │   │   ├── layout/       # Layout components (Sidebar, Header, Footer)
│   │   │   └── common/       # Shared components (StatusBadge, EmptyState, etc.)
│   │   ├── pages/            # Page components organized by role
│   │   │   ├── public/       # Landing, Login, Register
│   │   │   ├── customer/     # Customer dashboard and features
│   │   │   ├── admin/        # Admin dashboard and management
│   │   │   └── mechanic/     # Mechanic dashboard and features
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service functions
│   │   ├── types/            # TypeScript type definitions
│   │   ├── contexts/         # React contexts (Auth, Toast)
│   │   └── lib/              # Utility functions
│   ├── package.json
│   └── .env.example
├── backend/                  # Python FastAPI application
│   ├── app/
│   │   ├── api/              # API route handlers
│   │   ├── core/             # Configuration, security, dependencies
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic layer
│   │   └── main.py           # FastAPI application entry point
│   ├── scripts/              # Seed data and utility scripts
│   ├── tests/                # Pytest test suites
│   ├── requirements.txt
│   └── .env.example
├── docs/
│   └── uml/                  # UML diagrams (Mermaid)
├── docker-compose.yml        # PostgreSQL setup (optional)
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **npm 9+** — Comes with Node.js

> **Note:** Docker is optional. The application uses SQLite by default for easy local setup.

### 1. Clone / Download the Project

```bash
cd /path/to/autocare
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
copy .env.example .env    # Windows
# cp .env.example .env    # macOS/Linux

# Initialize database and seed demo data
python -m scripts.seed

# Start the backend server
uvicorn app.main:app --reload --port 8000
```

The backend will be available at: **http://localhost:8000**
API documentation at: **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Create .env file from template
copy .env.example .env    # Windows
# cp .env.example .env    # macOS/Linux

# Start the development server
npm run dev
```

The frontend will be available at: **http://localhost:5173**

### 4. Using PostgreSQL (Optional)

If Docker is available:

```bash
# From the project root
docker-compose up -d

# Update backend/.env
DATABASE_URL=postgresql://autocare_user:autocare_dev_password@localhost:5432/autocare
```

---

## 👤 Demo Accounts

> ⚠️ **DEVELOPMENT ONLY** — Change these credentials for any deployment beyond local demonstration.

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@autocare.com | Admin@123 |
| **Mechanic 1** | john.mechanic@autocare.com | Mech@123 |
| **Mechanic 2** | sarah.mechanic@autocare.com | Mech@123 |
| **Customer 1** | alice@example.com | Cust@123 |
| **Customer 2** | bob@example.com | Cust@123 |
| **Customer 3** | carol@example.com | Cust@123 |

---

## 📚 API Documentation

Once the backend is running, visit:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Customer registration | Public |
| POST | `/api/v1/auth/login` | User login | Public |
| GET | `/api/v1/auth/me` | Current user profile | Required |
| GET/POST | `/api/v1/vehicles` | Customer vehicles | Customer |
| GET | `/api/v1/services` | Service catalogue | Public |
| POST | `/api/v1/bookings` | Create booking | Customer |
| GET | `/api/v1/bookings` | List bookings | Role-based |
| PUT | `/api/v1/bookings/{id}/status` | Update status | Role-based |
| PUT | `/api/v1/bookings/{id}/assign` | Assign mechanic | Admin |
| GET/POST | `/api/v1/spare-parts` | Inventory management | Admin |
| POST | `/api/v1/bookings/{id}/parts` | Record parts used | Mechanic/Admin |
| POST | `/api/v1/bookings/{id}/invoice` | Generate invoice | Admin |
| POST | `/api/v1/invoices/{id}/pay` | Demo payment | Customer |
| GET | `/api/v1/notifications` | User notifications | Required |
| GET | `/api/v1/reports/dashboard` | Dashboard statistics | Admin |

---

## 🧪 Running Tests

### Backend Tests

```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## 🎓 OOAD Concepts

### Encapsulation
- Each model class encapsulates its data and validation logic within its class boundary.
- Password hashing is encapsulated in the `Security` module — no other module needs to know the hashing algorithm.
- Business rules are encapsulated in service classes (e.g., `BookingService` validates status transitions internally).

### Abstraction
- The service layer provides a clean abstraction over database operations.
- API schemas (Pydantic models) abstract the internal database representation from the API contract.
- The `get_current_user` dependency abstracts authentication logic from route handlers.

### Composition (over Inheritance)
- **User → CustomerProfile / MechanicProfile:** Role-specific data is composed via one-to-one relationships rather than using class inheritance.
- **Booking → Vehicle, Service, User:** A booking composes references to its related entities.
- **Invoice → InvoiceItem[]:** An invoice is composed of line items.

### Polymorphism
- **Status transition validation** behaves differently based on the current booking status and the user's role.
- **Notification creation** is polymorphic — the same `create_notification` interface handles different notification types (booking confirmation, assignment, payment, etc.).
- **Report generation** uses polymorphic query strategies based on filter parameters.

### Single Responsibility Principle
- **Models** handle data structure and database mapping only.
- **Schemas** handle request/response validation and serialization.
- **Services** contain business logic and orchestration.
- **API routes** handle HTTP concerns (parsing requests, returning responses).
- **Core modules** handle cross-cutting concerns (auth, config, dependencies).

### Key Relationships
| Relationship | Type | Description |
|---|---|---|
| User → CustomerProfile | 1:1 | Composition — customer details |
| User → MechanicProfile | 1:1 | Composition — mechanic details |
| User → Vehicle | 1:N | Customer owns multiple vehicles |
| User → Booking | 1:N | Customer places multiple bookings |
| Vehicle → Booking | 1:N | A vehicle can have multiple bookings |
| Service → Booking | 1:N | A service can be booked many times |
| Booking → BookingPart | 1:N | Parts consumed during service |
| Booking → Invoice | 1:1 | One invoice per completed booking |
| Invoice → InvoiceItem | 1:N | Line-item breakdown |
| Invoice → Payment | 1:N | Payment records |
| SparePart → InventoryMovement | 1:N | Stock movement history |

---

## 📊 UML Diagrams

All UML diagrams are in the `docs/uml/` directory:

1. **Use Case Diagram** — Shows interactions between Customer, Admin, and Mechanic actors
2. **Class Diagram** — Shows all entity classes and their relationships
3. **Sequence Diagram** — Booking flow from customer to database
4. **Activity Diagram** — Service completion and billing workflow
5. **State Diagram** — Booking status transitions
6. **Component Diagram** — System architecture layers
7. **Deployment Diagram** — Local development setup

---

## 🎤 College Demonstration Script

### Step 1: Start the Application (2 min)
1. Open two terminals
2. Terminal 1: Start backend — `cd backend && py -m uvicorn app.main:app --reload --port 8000`
3. Terminal 2: Start frontend — `cd frontend && npm run dev`
4. Open browser at http://localhost:5173

### Step 2: Landing Page Tour (1 min)
1. Show the landing page with hero section, services, and how-it-works
2. Point out the professional design and responsive layout

### Step 3: Customer Registration & Login (2 min)
1. Click "Register" and create a new customer account
2. Show form validation (try submitting empty, duplicate email)
3. Log in with the new account
4. Show role-based redirect to customer dashboard

### Step 4: Add Vehicle & Book Service (3 min)
1. Add a new vehicle with registration details
2. Browse the service catalogue
3. Create a new booking — select vehicle, service, date/time
4. Show slot conflict prevention (try booking same slot)
5. View booking confirmation and notification

### Step 5: Admin Operations (3 min)
1. Log in as admin (admin@autocare.com)
2. Show dashboard with real statistics
3. Confirm the pending booking
4. Assign a mechanic to the booking
5. Show mechanic and customer notifications

### Step 6: Mechanic Workflow (2 min)
1. Log in as mechanic (john.mechanic@autocare.com)
2. View assigned jobs
3. Start the service (status → In Progress)
4. Record parts used from inventory
5. Complete the service

### Step 7: Invoice & Payment (2 min)
1. Log in as admin — generate invoice for completed service
2. Show invoice with service charge, parts, tax breakdown
3. Log in as customer — view invoice
4. Make demo payment
5. Show payment confirmation

### Step 8: Reports & Analytics (1 min)
1. Log in as admin
2. Show reports dashboard with real data charts
3. Show booking statistics, revenue, inventory alerts

### Step 9: Security Demo (1 min)
1. Show that a customer cannot access admin endpoints
2. Show that passwords are hashed in the database
3. Show backend permission enforcement

### Step 10: Architecture & OOP (2 min)
1. Show UML diagrams
2. Explain class relationships and OOAD concepts
3. Show the service layer pattern
4. Explain the status state machine

**Total estimated time: ~20 minutes**

---

## ⚠️ Known Limitations

1. **Database:** Uses SQLite for development. PostgreSQL recommended for production.
2. **Payment:** Demo payment mode only — no real payment gateway integration. Clearly labeled as simulated.
3. **Notifications:** In-app only — no email or SMS delivery configured.
4. **File uploads:** Vehicle photos and document uploads not implemented.
5. **Real-time updates:** Uses polling/refresh rather than WebSocket for real-time data.
6. **Rate limiting:** Documented as a security consideration; simplified for local development.
7. **Multi-tenancy:** Single service center — not designed for multiple branch locations.
8. **Localization:** English only, single currency (INR assumed).

---

## 📄 License

This project is created for academic purposes as part of an OOAD college course. Not intended for production deployment without significant security hardening and feature enhancements.
