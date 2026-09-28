import uuid
from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.user import User, Role
from app.models.organization import Organization, OrganizationSettings
from app.models.subscription import Subscription, SubscriptionPlan
from app.models.warehouse import Warehouse
from app.schemas.auth import LoginRequest, Token, RegisterBusinessRequest, UserResponse, PasswordChangeRequest
from app.dependencies.auth import get_current_user

router = APIRouter()

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
    
    # Check organization status if user belongs to an organization
    if user.organization_id:
        org = db.query(Organization).filter(Organization.id == user.organization_id).first()
        if org and not org.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your organization account has been suspended"
            )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(subject=user.id, expires_delta=access_token_expires)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/register", response_model=Token)
def register_business(request: RegisterBusinessRequest, db: Session = Depends(get_db)):
    # Check if user email already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered in the platform"
        )

    # 1. Create Organization
    org_code = "KH-" + str(uuid.uuid4())[:8].upper()
    organization = Organization(
        name=request.business_name,
        code=org_code,
        business_type=request.business_type,
        owner_name=request.full_name,
        phone=request.phone,
        email=request.email,
        address=request.address,
        province=request.province,
        currency=request.currency or "USD",
        is_active=True,
        onboarding_completed=False
    )
    db.add(organization)
    db.flush()

    # 2. Create Organization Settings
    org_settings = OrganizationSettings(
        organization_id=organization.id,
        khqr_merchant_name=request.business_name,
        khqr_merchant_city=request.province,
        khqr_merchant_id=f"{org_code.lower()}@bakong",
        invoice_prefix="INV-",
        quotation_prefix="QUO-",
        po_prefix="PO-",
        khr_exchange_rate=4100.0,
        enable_khqr=True
    )
    db.add(org_settings)

    # 3. Create Default Free Subscription
    free_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.slug == "free").first()
    if not free_plan:
        free_plan = SubscriptionPlan(
            name="Free",
            slug="free",
            price_usd=0.0,
            billing_period="monthly",
            max_users=1,
            max_products=100,
            max_warehouses=1,
            max_monthly_sales=200,
            features='["pos", "inventory", "purchasing", "reports"]'
        )
        db.add(free_plan)
        db.flush()

    subscription = Subscription(
        organization_id=organization.id,
        plan_id=free_plan.id,
        status="active"
    )
    db.add(subscription)

    # 4. Create Default Warehouse
    default_warehouse = Warehouse(
        organization_id=organization.id,
        name=f"{request.province} Main Warehouse",
        code="WH-MAIN",
        province=request.province,
        address=request.address or request.province,
        is_default=True,
        status="active"
    )
    db.add(default_warehouse)
    db.flush()
    org_settings.default_warehouse_id = default_warehouse.id

    # 5. Create Business Owner Role if not exists
    owner_role = db.query(Role).filter(Role.name == "Business Owner", Role.is_system == True).first()
    if not owner_role:
        owner_role = Role(name="Business Owner", description="Full administrative control over tenant business", is_system=True)
        db.add(owner_role)
        db.flush()

    # 6. Create User
    new_user = User(
        organization_id=organization.id,
        email=request.email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name,
        phone=request.phone,
        is_super_admin=False,
        is_active=True
    )
    new_user.roles.append(owner_role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(subject=new_user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password does not match")
    current_user.hashed_password = get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
