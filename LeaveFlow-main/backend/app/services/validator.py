"""
Leave Validation Engine

Handles all business logic for leave validation:
- Overlap detection
- Leave balance checks
- Holiday detection
- Weekend skipping
- Date range calculations
"""

from datetime import date, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models import LeaveRequest, LeaveBalance, Holiday, LeaveStatus, LeaveType, DurationType


class LeaveValidationError(Exception):
    """Custom exception for validation errors."""
    def __init__(self, message: str, code: str = "VALIDATION_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class LeaveValidator:
    """Validates leave requests against business rules."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def validate_leave_request(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
        leave_type: LeaveType,
        is_half_day: bool = False
    ) -> Tuple[bool, float, Optional[str]]:
        """
        Validate a leave request.
        
        Returns:
            Tuple of (is_valid, calculated_days, warning_message)
        """
        warnings = []
        
        # 1. Validate date range
        if end_date < start_date:
            raise LeaveValidationError("End date cannot be before start date", "INVALID_DATE_RANGE")
        
        if start_date < date.today():
            raise LeaveValidationError("Cannot apply for leave in the past", "PAST_DATE")
        
        # 2. Calculate working days (excluding weekends and holidays)
        holidays = await self._get_holidays(start_date, end_date)
        working_days = self._calculate_working_days(start_date, end_date, holidays)
        
        if is_half_day:
            working_days = 0.5
        
        if working_days <= 0:
            raise LeaveValidationError(
                "No working days in the selected range (all weekends/holidays)",
                "NO_WORKING_DAYS"
            )
        
        # 3. Check for overlapping leaves
        has_overlap = await self._check_overlap(user_id, start_date, end_date)
        if has_overlap:
            raise LeaveValidationError(
                "You already have a leave request for these dates",
                "OVERLAPPING_LEAVE"
            )
        
        # 4. Check for pending requests
        has_pending = await self._check_pending_requests(user_id)
        if has_pending:
            warnings.append("You have other pending leave requests")
        
        # 5. Check leave balance
        balance = await self._get_balance(user_id, leave_type)
        if balance < working_days:
            raise LeaveValidationError(
                f"Insufficient {leave_type.value} leave balance. Available: {balance}, Required: {working_days}",
                "INSUFFICIENT_BALANCE"
            )
        
        # 6. Check if dates include holidays (warning only)
        if holidays:
            holiday_names = [h.name for h in holidays]
            warnings.append(f"Your leave includes holidays: {', '.join(holiday_names)}")
        
        warning_msg = "; ".join(warnings) if warnings else None
        return True, working_days, warning_msg
    
    async def _get_holidays(self, start_date: date, end_date: date) -> List[Holiday]:
        """Get holidays within the date range."""
        result = await self.db.execute(
            select(Holiday).where(
                and_(
                    Holiday.date >= start_date,
                    Holiday.date <= end_date
                )
            )
        )
        return result.scalars().all()
    
    def _calculate_working_days(
        self,
        start_date: date,
        end_date: date,
        holidays: List[Holiday]
    ) -> float:
        """Calculate working days excluding weekends and holidays."""
        holiday_dates = {h.date for h in holidays}
        working_days = 0
        current = start_date
        
        while current <= end_date:
            # Skip weekends (5 = Saturday, 6 = Sunday)
            if current.weekday() < 5 and current not in holiday_dates:
                working_days += 1
            current += timedelta(days=1)
        
        return float(working_days)
    
    async def _check_overlap(self, user_id: int, start_date: date, end_date: date) -> bool:
        """Check if user has overlapping leave requests."""
        result = await self.db.execute(
            select(LeaveRequest).where(
                and_(
                    LeaveRequest.user_id == user_id,
                    LeaveRequest.status.in_([LeaveStatus.pending, LeaveStatus.approved]),
                    or_(
                        and_(
                            LeaveRequest.start_date <= start_date,
                            LeaveRequest.end_date >= start_date
                        ),
                        and_(
                            LeaveRequest.start_date <= end_date,
                            LeaveRequest.end_date >= end_date
                        ),
                        and_(
                            LeaveRequest.start_date >= start_date,
                            LeaveRequest.end_date <= end_date
                        )
                    )
                )
            )
        )
        return result.first() is not None
    
    async def _check_pending_requests(self, user_id: int) -> bool:
        """Check if user has other pending requests."""
        result = await self.db.execute(
            select(LeaveRequest).where(
                and_(
                    LeaveRequest.user_id == user_id,
                    LeaveRequest.status == LeaveStatus.pending
                )
            )
        )
        return result.first() is not None
    
    async def _get_balance(self, user_id: int, leave_type: LeaveType) -> float:
        """Get user's leave balance for the given type."""
        result = await self.db.execute(
            select(LeaveBalance).where(LeaveBalance.user_id == user_id)
        )
        balance = result.scalar_one_or_none()
        
        if not balance:
            # Create default balance
            balance = LeaveBalance(
                user_id=user_id,
                year=date.today().year,
                casual=12.0,
                sick=12.0,
                special=5.0
            )
            self.db.add(balance)
            await self.db.commit()
            await self.db.refresh(balance)
        
        return getattr(balance, leave_type.value)


async def deduct_balance(db: AsyncSession, user_id: int, leave_type: LeaveType, days: float) -> bool:
    """Deduct leave balance after approval."""
    result = await db.execute(
        select(LeaveBalance).where(LeaveBalance.user_id == user_id)
    )
    balance = result.scalar_one_or_none()
    
    if not balance:
        return False
    
    current = getattr(balance, leave_type.value)
    if current < days:
        return False
    
    setattr(balance, leave_type.value, current - days)
    await db.commit()
    return True


async def refund_balance(db: AsyncSession, user_id: int, leave_type: LeaveType, days: float) -> bool:
    """Refund leave balance after cancellation or rejection."""
    result = await db.execute(
        select(LeaveBalance).where(LeaveBalance.user_id == user_id)
    )
    balance = result.scalar_one_or_none()
    
    if not balance:
        return False
    
    current = getattr(balance, leave_type.value)
    setattr(balance, leave_type.value, current + days)
    await db.commit()
    return True
