from sqlalchemy import Column, Integer, String, Date, DateTime, Text, ForeignKey, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    worker = "worker"
    manager = "manager"
    hr = "hr"
    admin = "admin"


class AccountStatus(str, enum.Enum):
    pending = "pending"  # Awaiting admin approval
    active = "active"    # Approved and active
    suspended = "suspended"  # Temporarily disabled


class LeaveType(str, enum.Enum):
    casual = "casual"
    sick = "sick"
    special = "special"


class LeaveStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    cancelled = "cancelled"


class DurationType(str, enum.Enum):
    full = "full"
    half_morning = "half_morning"
    half_afternoon = "half_afternoon"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=True)  # For dashboard login
    role = Column(SQLEnum(UserRole), default=UserRole.worker, nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    account_status = Column(SQLEnum(AccountStatus), default=AccountStatus.active, nullable=False)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who approved
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    leave_requests = relationship("LeaveRequest", back_populates="user", foreign_keys="LeaveRequest.user_id")
    leave_balance = relationship("LeaveBalance", back_populates="user", uselist=False)
    manager = relationship("User", remote_side=[id], foreign_keys=[manager_id], backref="team_members")
    approver = relationship("User", remote_side=[id], foreign_keys=[approved_by])


class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    days = Column(Float, nullable=False)  # Support half days (0.5)
    leave_type = Column(SQLEnum(LeaveType), nullable=False)
    duration_type = Column(SQLEnum(DurationType), default=DurationType.full)
    reason = Column(Text, nullable=True)
    status = Column(SQLEnum(LeaveStatus), default=LeaveStatus.pending, index=True)
    rejection_reason = Column(Text, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="leave_requests", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])
    attachments = relationship("Attachment", back_populates="leave_request")
    logs = relationship("AuditLog", back_populates="leave_request")


class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    casual = Column(Float, default=12.0)
    sick = Column(Float, default=12.0)
    special = Column(Float, default=5.0)
    year = Column(Integer, nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="leave_balance")


class Holiday(Base):
    __tablename__ = "holidays"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    leave_request_id = Column(Integer, ForeignKey("leave_requests.id"), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    leave_request = relationship("LeaveRequest", back_populates="attachments")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    leave_request_id = Column(Integer, ForeignKey("leave_requests.id"), nullable=True)
    action = Column(String(50), nullable=False)  # created, approved, rejected, cancelled
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    actor_phone = Column(String(20), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    leave_request = relationship("LeaveRequest", back_populates="logs")
    actor = relationship("User")


class LeaveBalanceHistory(Base):
    """Track all leave balance changes for audit trail"""
    __tablename__ = "leave_balance_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    leave_type = Column(SQLEnum(LeaveType), nullable=False)
    days_changed = Column(Float, nullable=False)  # Positive for credit, negative for debit
    balance_after = Column(Float, nullable=False)
    reason = Column(String(200), nullable=False)  # "Annual credit", "Leave approved #123"
    leave_request_id = Column(Integer, ForeignKey("leave_requests.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    leave_request = relationship("LeaveRequest")


class AccountCreationRequestStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class AccountCreationRequest(Base):
    """Account creation requests from managers/HR pending admin approval"""
    __tablename__ = "account_creation_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True)
    requested_role = Column(SQLEnum(UserRole), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(SQLEnum(AccountCreationRequestStatus), default=AccountCreationRequestStatus.pending, index=True)
    rejection_reason = Column(Text, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    requester = relationship("User", foreign_keys=[requested_by])
    assigned_manager = relationship("User", foreign_keys=[manager_id])
    approver = relationship("User", foreign_keys=[approved_by])


class ProcessedMessage(Base):
    """For idempotency - track processed WhatsApp messages"""
    __tablename__ = "processed_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String(100), unique=True, nullable=False, index=True)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())


class ConversationHistory(Base):
    """Store WhatsApp conversation history for context-aware responses"""
    __tablename__ = "conversation_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    phone = Column(String(20), nullable=False, index=True)
    message = Column(Text, nullable=False)
    is_from_user = Column(Integer, nullable=False)  # 1 = user sent, 0 = bot replied
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User")
