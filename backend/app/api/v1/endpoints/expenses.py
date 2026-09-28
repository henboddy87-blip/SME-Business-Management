import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.finance import Expense, ExpenseCategory, Payment
from app.models.organization import Organization
from app.models.user import User
from app.schemas.finance import (
    ExpenseResponse, ExpenseCreate,
    ExpenseCategoryResponse, ExpenseCategoryCreate
)
from app.dependencies.tenant import get_current_tenant
from app.dependencies.permissions import require_roles
from app.services.audit_service import log_audit_event

router = APIRouter()

# Categories
@router.get("/categories", response_model=List[ExpenseCategoryResponse])
def list_expense_categories(
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(ExpenseCategory).filter(ExpenseCategory.organization_id == tenant.id).all()

@router.post("/categories", response_model=ExpenseCategoryResponse)
def create_expense_category(
    data: ExpenseCategoryCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Accountant"])),
    db: Session = Depends(get_db)
):
    cat = ExpenseCategory(
        organization_id=tenant.id,
        name_en=data.name_en,
        name_kh=data.name_kh,
        description=data.description
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

# Expenses
@router.get("", response_model=List[ExpenseResponse])
def list_expenses(
    category_id: Optional[str] = None,
    tenant: Organization = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    query = db.query(Expense).filter(Expense.organization_id == tenant.id)
    if category_id:
        query = query.filter(Expense.category_id == category_id)

    expenses = query.order_by(Expense.date.desc()).all()
    res = []
    for exp in expenses:
        ed = ExpenseResponse.model_validate(exp)
        if exp.category:
            ed.category_name = exp.category.name_en
        res.append(ed)
    return res

@router.post("", response_model=ExpenseResponse)
def create_expense(
    data: ExpenseCreate,
    tenant: Organization = Depends(get_current_tenant),
    current_user: User = Depends(require_roles(["Business Owner", "Business Admin", "Accountant"])),
    db: Session = Depends(get_db)
):
    exp_num = "EXP-" + str(uuid.uuid4())[:8].upper()
    amount_khr = data.amount_usd * 4100.0 if data.currency == "USD" else (data.amount_usd if data.currency == "KHR" else data.amount_usd * 4100.0)

    expense = Expense(
        organization_id=tenant.id,
        expense_number=exp_num,
        category_id=data.category_id,
        amount_usd=data.amount_usd,
        amount_khr=amount_khr,
        currency=data.currency,
        payment_method=data.payment_method,
        date=data.date,
        description=data.description,
        receipt_url=data.receipt_url,
        created_by=current_user.id
    )
    db.add(expense)
    db.flush()

    # Record Outflow Payment Record
    db.add(Payment(
        organization_id=tenant.id,
        payment_number="PAY-" + str(uuid.uuid4())[:8].upper(),
        reference_type="Expense",
        reference_id=expense.id,
        amount_usd=data.amount_usd,
        amount_khr=amount_khr,
        currency=data.currency,
        payment_method=data.payment_method,
        status="Completed",
        payment_date=data.date,
        created_by=current_user.id
    ))

    log_audit_event(
        db,
        organization_id=tenant.id,
        action="CREATE_EXPENSE",
        entity="Expense",
        entity_id=exp_num,
        user=current_user,
        new_value=f"Recorded expense {exp_num} of ${data.amount_usd:.2f}"
    )

    db.commit()
    db.refresh(expense)

    ed = ExpenseResponse.model_validate(expense)
    if expense.category:
        ed.category_name = expense.category.name_en
    return ed
