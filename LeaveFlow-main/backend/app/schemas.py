from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional, List
from app.models import UserRole, LeaveType, LeaveStatus, DurationType, AccountCreationRequestStatus, AccountStatus


# ========== Auth Schemas ==========

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ========== User Schemas ==========

class UserBase(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.worker


class UserCreate(UserBase):
    password: Optional[str] = None
    manager_id: Optional[int] = None


class UserUpdate(BaseModel):
    """Schema for users updating their own profile (limited fields)."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class UserResponse(UserBase):
    id: int
    manager_id: Optional[int] = None
    account_status: AccountStatus = AccountStatus.active
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserWithBalance(UserResponse):
    leave_balance: Optional["LeaveBalanceResponse"] = None


# ========== Leave Request Schemas ==========

class LeaveRequestBase(BaseModel):
    start_date: date
    end_date: date
    leave_type: LeaveType
    duration_type: DurationType = DurationType.full
    reason: Optional[str] = None


class LeaveRequestCreate(LeaveRequestBase):
    user_id: int


class LeaveRequestResponse(LeaveRequestBase):
    id: int
    user_id: int
    days: float
    status: LeaveStatus
    rejection_reason: Optional[str] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    user: Optional[UserResponse] = None
    attachments: List["AttachmentResponse"] = []
    
    class Config:
        from_attributes = True


class LeaveRequestWithUser(LeaveRequestResponse):
    user: UserResponse


class ApproveRequest(BaseModel):
    pass


class RejectRequest(BaseModel):
    reason: str = Field(..., min_length=1)


# ========== Leave Balance Schemas ==========

class LeaveBalanceBase(BaseModel):
    casual: float = 12.0
    sick: float = 12.0
    special: float = 5.0


class LeaveBalanceResponse(LeaveBalanceBase):
    id: int
    user_id: int
    year: int
    
    class Config:
        from_attributes = True


class LeaveBalanceHistoryResponse(BaseModel):
    """Leave balance change history"""
    id: int
    user_id: int
    leave_type: LeaveType
    days_changed: float
    balance_after: float
    reason: str
    leave_request_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Holiday Schemas ==========

class HolidayBase(BaseModel):
    date: date
    name: str
    description: Optional[str] = None


class HolidayCreate(HolidayBase):
    pass


class HolidayResponse(HolidayBase):
    id: int
    
    class Config:
        from_attributes = True


# ========== Attachment Schemas ==========

class AttachmentResponse(BaseModel):
    id: int
    file_url: str
    file_type: Optional[str] = None
    uploaded_at: datetime
    
    class Config:
        from_attributes = True


# ========== Audit Log Schemas ==========

class AuditLogResponse(BaseModel):
    id: int
    leave_request_id: Optional[int]
    action: str
    actor_id: Optional[int]
    details: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== Dashboard Stats ==========

class DashboardStats(BaseModel):
    pending_count: int
    approved_today: int
    rejected_today: int
    on_leave_today: List[UserResponse]


class TodayLeaveResponse(BaseModel):
    employees: List[UserResponse]
    count: int


# ========== Account Creation Request Schemas ==========

class AccountCreationRequestCreate(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    requested_role: UserRole
    manager_id: Optional[int] = None


class AccountCreationRequestResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str]
    requested_role: UserRole
    manager_id: Optional[int]
    requested_by: int
    status: AccountCreationRequestStatus
    rejection_reason: Optional[str]
    approved_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AccountCreationRequestApprove(BaseModel):
    """Admin approves account creation"""
    approved: bool
    rejection_reason: Optional[str] = None


# Forward refs
UserWithBalance.model_rebuild()
LeaveRequestResponse.model_rebuild()
