from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class RegisterBusinessRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    business_name: str
    business_type: str = "Retail"
    phone: Optional[str] = None
    address: Optional[str] = None
    province: str = "Phnom Penh"
    currency: str = "USD"

class RoleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_system: bool = False

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    organization_id: Optional[str] = None
    is_super_admin: bool = False
    is_active: bool = True
    roles: List[RoleResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role_names: List[str] = ["Sales Staff"]

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    role_names: Optional[List[str]] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

Token.model_rebuild()
