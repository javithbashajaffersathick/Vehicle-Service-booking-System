from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.notification import Notification


def get_user_notifications(
    db: Session,
    user_id: int,
    unread_only: bool = False
) -> List[Notification]:
    """Retrieve notifications for a user."""
    query = db.query(Notification).filter(Notification.user_id == user_id)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(Notification.created_at.desc()).all()


def mark_notification_read(
    db: Session,
    notification_id: int,
    user_id: int
) -> Notification:
    """Mark a single notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Notification with ID {notification_id} not found."
        )

    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


def mark_all_notifications_read(db: Session, user_id: int) -> int:
    """Mark all unread notifications for a user as read."""
    unread_count = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return unread_count


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "general"
) -> Notification:
    """Helper to create and commit a notification."""
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
