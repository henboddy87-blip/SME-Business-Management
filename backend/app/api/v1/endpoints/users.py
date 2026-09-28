from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User, Role
from app.models.organization import Organization
from app.schemas.auth import UserResponse, UserCreate, UserUpdate, RoleResponse
from app.dependencies.auth import get_current_user
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.plan_limit_service import check_plan_limit
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("", response_model=List[UserResponse])
def list_organization_users(
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Manager"])),
    db: Session = Depends(get_db)
):
    users = db.query(User).filter(User.organization_id == tenant.id).all()
    return users

@router.get("/roles", response_model=List[RoleResponse])
def list_available_roles(db: Session = Depends(get_db)):
    # Standard tenant business roles
    roles = db.query(Role).filter(Role.name != "Super Admin").all()
    return roles

@router.post("", response_model=UserResponse)
def create_organization_user(
    data: UserCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    # Enforce plan limits on users!
    check_plan_limit(db, tenant.id, "users")

    # Check email duplicate
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered in the platform")

    new_user = User(
        organization_id=tenant.id,
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        phone=data.phone,
        is_super_admin=False,
        is_active=True
    )

    # Attach requested roles
    if data.role_names:
        roles = db.query(Role).filter(Role.name.in_(data.role_names)).all()
        new_user.roles = roles

    db.add(new_user)
    log_audit_event(
        db,
        organization_id=tenant.id,
        action="CREATE_USER",
        entity="User",
        entity_id=new_user.id,
        user=current_user,
        new_value=f"Created user {new_user.email} with roles {data.role_names}"
    )
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_organization_user(
    user_id: str,
    data: UserUpdate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id, User.organization_id == tenant.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role_names is not None:
        roles = db.query(Role).filter(Role.name.in_(data.role_names)).all()
        user.roles = roles

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="UPDATE_USER",
        entity="User",
        entity_id=user.id,
        user=current_user,
        new_value=f"Updated user {user.email}"
    )
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_organization_user(
    user_id: str,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    user = db.query(User).filter(User.id == user_id, User.organization_id == tenant.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    log_audit_event(
        db,
        organization_id=tenant.id,
        action="DEACTIVATE_USER",
        entity="User",
        entity_id=user.id,
        user=current_user
    )
    db.commit()
    return {"message": "User deactivated successfully"}
