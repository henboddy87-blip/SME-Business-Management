from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.notification import Notification
from app.models.organization import Organization
from app.schemas.audit import NotificationResponse
from app.dependencies.tenant import get_current_tenant

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    notifications = db.query(Notification).filter(Notification.organization_id == tenant.id).order_by(Notification.created_at.desc()).limit(30).all()
    return notifications

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.organization_id == tenant.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.put("/read-all")
def mark_all_notifications_read(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(Notification.organization_id == tenant.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
