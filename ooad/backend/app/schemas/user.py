from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.user import UserRole


class CustomerProfileBase(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None


class CustomerProfileCreate(CustomerProfileBase):
    pass


class CustomerProfileUpdate(CustomerProfileBase):
    pass


class CustomerProfileResponse(CustomerProfileBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class MechanicProfileResponse(BaseModel):
    id: int
    user_id: int
    specialization: Optional[str] = None
    experience_years: int = 0
    is_available: bool = True

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    role: Optional[UserRole] = UserRole.customer
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    customer_profile: Optional[CustomerProfileResponse] = None
    mechanic_profile: Optional[MechanicProfileResponse] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    user: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
