from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_admin
from app.models.user import User
from app.schemas.report import (
    DashboardStats,
    BookingsByStatus,
    PopularService,
    RevenueReport,
    InventorySummary,
)
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_statistics(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get high-level summary KPIs for management dashboard (Admin only)."""
    return report_service.get_dashboard_stats(db)


@router.get("/bookings-by-status", response_model=List[BookingsByStatus])
def get_booking_counts_by_status(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get booking counts across all workflow statuses (Admin only)."""
    return report_service.get_bookings_by_status(db)


@router.get("/popular-services", response_model=List[PopularService])
def get_popular_services(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get breakdown of services ordered by popularity and revenue (Admin only)."""
    return report_service.get_popular_services(db)


@router.get("/revenue", response_model=RevenueReport)
def get_revenue_report(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get detailed financial and revenue report (Admin only)."""
    return report_service.get_revenue_report(db, start_date=start_date, end_date=end_date)


@router.get("/inventory", response_model=InventorySummary)
def get_inventory_summary(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get inventory status summary and valuation (Admin only)."""
    return report_service.get_inventory_summary(db)


@router.get("/mechanics", response_model=List[dict])
def get_mechanic_performance_report(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get mechanic work performance analytics (Admin only)."""
    perfs = report_service.get_mechanic_performance(db)
    return [
        {
            "id": p.id,
            "name": p.name,
            "email": p.email,
            "specialization": p.specialization,
            "jobs_assigned": p.jobs_assigned,
            "jobs_completed": p.jobs_completed,
            "active_jobs": p.active_jobs,
        }
        for p in perfs
    ]
