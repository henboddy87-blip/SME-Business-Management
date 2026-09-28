from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.product import Category, Brand, Unit
from app.models.organization import Organization
from app.schemas.product import (
    CategoryResponse, CategoryCreate, CategoryUpdate,
    BrandResponse, BrandCreate,
    UnitResponse, UnitCreate
)
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.models.user import User

router = APIRouter()

# Categories
@router.get("", response_model=List[CategoryResponse])
def list_categories(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(Category).filter(Category.organization_id == tenant.id).all()

@router.post("", response_model=CategoryResponse)
def create_category(
    data: CategoryCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    category = Category(
        organization_id=tenant.id,
        name_en=data.name_en,
        name_kh=data.name_kh,
        parent_id=data.parent_id,
        description=data.description,
        status=data.status
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: str,
    data: CategoryUpdate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id, Category.organization_id == tenant.id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)
    return category

@router.delete("/{category_id}")
def delete_category(
    category_id: str,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin"])),
    db: Session = Depends(get_db)
):
    category = db.query(Category).filter(Category.id == category_id, Category.organization_id == tenant.id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}

# Brands
@router.get("/brands/all", response_model=List[BrandResponse])
def list_brands(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(Brand).filter(Brand.organization_id == tenant.id).all()

@router.post("/brands/all", response_model=BrandResponse)
def create_brand(
    data: BrandCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    brand = Brand(
        organization_id=tenant.id,
        name=data.name,
        description=data.description
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand

# Units
@router.get("/units/all", response_model=List[UnitResponse])
def list_units(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(Unit).filter(Unit.organization_id == tenant.id).all()

@router.post("/units/all", response_model=UnitResponse)
def create_unit(
    data: UnitCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Inventory Staff"])),
    db: Session = Depends(get_db)
):
    unit = Unit(
        organization_id=tenant.id,
        name_en=data.name_en,
        name_kh=data.name_kh,
        short_code=data.short_code
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit
