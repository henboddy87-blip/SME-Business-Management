from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.organization import Organization
from app.models.user import User
from app.schemas.audit import AuditLogResponse
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles

router = APIRouter()

@router.get("", response_model=List[AuditLogResponse])
def list_tenant_audit_logs(
    entity: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).filter(AuditLog.organization_id == tenant.id)
    if entity:
        query = query.filter(AuditLog.entity == entity)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return logs
