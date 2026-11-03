from datetime import date
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict


class MonthlyRevenueItem(BaseModel):
    month: str
    revenue: float
    bookings: int


class DashboardStats(BaseModel):
    total_customers: int
    total_mechanics: int
    total_bookings: int
    pending_bookings: int
    confirmed_bookings: int
    in_progress_bookings: int
    completed_bookings: int
    delivered_bookings: int
    cancelled_bookings: int
    low_stock_items_count: int
    total_revenue: Decimal
    unpaid_invoices_count: int

    # Frontend compatibility fields
    customer_count: Optional[int] = None
    mechanic_count: Optional[int] = None
    active_jobs: Optional[int] = None
    completed_jobs: Optional[int] = None
    monthly_revenue: List[MonthlyRevenueItem] = []
    bookings_by_status: List[Dict[str, Any]] = []

    model_config = ConfigDict(from_attributes=True)


class BookingsByStatus(BaseModel):
    status: str
    count: int


class PopularService(BaseModel):
    service_id: int
    service_name: str
    bookings_count: int
    revenue_generated: Decimal


class RevenueReport(BaseModel):
    total_revenue: Decimal
    total_invoices: int
    paid_invoices: int
    unpaid_invoices: int
    period_start: Optional[date] = None
    period_end: Optional[date] = None


class InventorySummary(BaseModel):
    total_parts: int
    low_stock_parts: int
    out_of_stock_parts: int
    total_inventory_value: Decimal


class MechanicPerformance(BaseModel):
    id: int
    name: str
    email: str
    specialization: str
    jobs_assigned: int
    jobs_completed: int
    active_jobs: int
