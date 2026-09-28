from typing import Optional
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.models.user import User

def log_audit_event(
    db: Session,
    organization_id: str,
    action: str,
    entity: str,
    entity_id: Optional[str] = None,
    user: Optional[User] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """Record an immutable audit log entry."""
    entry = AuditLog(
        organization_id=organization_id,
        user_id=user.id if user else None,
        user_email=user.email if user else "system",
        action=action,
        entity=entity,
        entity_id=str(entity_id) if entity_id else None,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address
    )
    db.add(entry)
    return entry
