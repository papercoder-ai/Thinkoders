"""
Leave Service

Core business logic for leave operations.
"""

from datetime import date, datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload

from app.models import (
    User, LeaveRequest, LeaveBalance, AuditLog, Attachment,
    LeaveStatus, LeaveType, DurationType, UserRole
)
from app.services.validator import LeaveValidator, LeaveValidationError, deduct_balance, refund_balance
from app.services.whatsapp import (
    whatsapp, format_leave_request_notification, format_leave_confirmation,
    format_approval_notification, format_rejection_notification,
    format_cancellation_confirmation, format_balance_message, format_status_message
)


class LeaveService:
    """Service for managing leave requests."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.validator = LeaveValidator(db)
    
    async def create_leave_request(
        self,
        user_id: int,
        start_date: date,
        end_date: date,
        leave_type: str,
        reason: Optional[str] = None,
        is_half_day: bool = False,
        half_day_period: Optional[str] = None
    ) -> LeaveRequest:
        """Create a new leave request."""
        # Convert string type to enum
        l_type = LeaveType(leave_type) if isinstance(leave_type, str) else leave_type
        
        # Determine duration type
        if is_half_day:
            duration = DurationType.half_morning if half_day_period == "morning" else DurationType.half_afternoon
        else:
            duration = DurationType.full
        
        # Validate the request
        is_valid, days, warning = await self.validator.validate_leave_request(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            leave_type=l_type,
            is_half_day=is_half_day
        )
        
        # Create the request
        leave_request = LeaveRequest(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            days=days,
            leave_type=l_type,
            duration_type=duration,
            reason=reason,
            status=LeaveStatus.pending
        )
        
        self.db.add(leave_request)
        await self.db.commit()
        await self.db.refresh(leave_request)
        
        # Log the action AFTER commit (so leave_request.id exists)
        await self._log_action(leave_request.id, "created", user_id)
        await self.db.commit()
        
        # Get user and manager info for notifications
        user = await self._get_user(user_id)
        
        # Notify manager using dedicated function
        await self._notify_manager_of_new_request(
            leave_request_id=leave_request.id,
            user=user,
            start_date=start_date,
            end_date=end_date,
            days=days,
            leave_type=leave_type,
            reason=reason
        )
        
        # Confirm to employee
        if user:
            await whatsapp.send_text(
                user.phone,
                format_leave_confirmation(
                    request_id=leave_request.id,
                    start_date=str(start_date),
                    end_date=str(end_date),
                    days=days,
                    leave_type=leave_type,
                    warning=warning
                )
            )
        
        return leave_request
    
    async def approve_leave(
        self,
        request_id: int,
        approver_id: int
    ) -> LeaveRequest:
        """Approve a leave request."""
        leave_request = await self._get_leave_request(request_id)
        
        if not leave_request:
            raise LeaveValidationError("Leave request not found", "NOT_FOUND")
        
        if leave_request.status != LeaveStatus.pending:
            raise LeaveValidationError(f"Request is already {leave_request.status.value}", "ALREADY_PROCESSED")
        
        # Update status
        leave_request.status = LeaveStatus.approved
        leave_request.approved_by = approver_id
        leave_request.approved_at = datetime.utcnow()
        
        # Deduct balance
        await deduct_balance(
            self.db,
            leave_request.user_id,
            leave_request.leave_type,
            leave_request.days
        )
        
        # Log the action before commit
        await self._log_action(request_id, "approved", approver_id)
        
        await self.db.commit()
        await self.db.refresh(leave_request)
        
        # Notify employee
        user = await self._get_user(leave_request.user_id)
        approver = await self._get_user(approver_id)
        
        if user:
            await whatsapp.send_text(
                user.phone,
                format_approval_notification(request_id, approver.name if approver else "Manager")
            )
        
        return leave_request
    
    async def reject_leave(
        self,
        request_id: int,
        approver_id: int,
        reason: Optional[str] = None
    ) -> LeaveRequest:
        """Reject a leave request."""
        leave_request = await self._get_leave_request(request_id)
        
        if not leave_request:
            raise LeaveValidationError("Leave request not found", "NOT_FOUND")
        
        if leave_request.status != LeaveStatus.pending:
            raise LeaveValidationError(f"Request is already {leave_request.status.value}", "ALREADY_PROCESSED")
        
        # Update status
        leave_request.status = LeaveStatus.rejected
        leave_request.approved_by = approver_id
        leave_request.approved_at = datetime.utcnow()
        leave_request.rejection_reason = reason
        
        # Log the action before commit
        await self._log_action(request_id, "rejected", approver_id, reason)
        
        await self.db.commit()
        await self.db.refresh(leave_request)
        
        # Notify employee
        user = await self._get_user(leave_request.user_id)
        approver = await self._get_user(approver_id)
        
        if user:
            await whatsapp.send_text(
                user.phone,
                format_rejection_notification(request_id, approver.name if approver else "Manager", reason)
            )
        
        return leave_request
    
    async def cancel_leave(
        self,
        request_id: int,
        user_id: int
    ) -> LeaveRequest:
        """Cancel a leave request (by employee)."""
        leave_request = await self._get_leave_request(request_id)
        
        if not leave_request:
            raise LeaveValidationError("Leave request not found", "NOT_FOUND")
        
        if leave_request.user_id != user_id:
            raise LeaveValidationError("You can only cancel your own requests", "FORBIDDEN")
        
        if leave_request.status not in [LeaveStatus.pending, LeaveStatus.approved]:
            raise LeaveValidationError(f"Cannot cancel a {leave_request.status.value} request", "INVALID_STATUS")
        
        # If approved, refund balance
        if leave_request.status == LeaveStatus.approved:
            await refund_balance(
                self.db,
                leave_request.user_id,
                leave_request.leave_type,
                leave_request.days
            )
        
        # Update status
        leave_request.status = LeaveStatus.cancelled
        
        # Log the action before commit
        await self._log_action(request_id, "cancelled", user_id)
        
        await self.db.commit()
        await self.db.refresh(leave_request)
        
        # Notify employee
        user = await self._get_user(user_id)
        if user:
            await whatsapp.send_text(user.phone, format_cancellation_confirmation(request_id))
        
        return leave_request
    
    async def get_balance(self, user_id: int) -> Dict[str, float]:
        """Get user's leave balance."""
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
        
        return {
            "casual": balance.casual,
            "sick": balance.sick,
            "special": balance.special
        }
    
    async def get_status(self, request_id: int) -> Optional[LeaveRequest]:
        """Get leave request status."""
        return await self._get_leave_request(request_id)
    
    async def get_pending_requests(self, manager_id: Optional[int] = None) -> List[LeaveRequest]:
        """Get pending leave requests.
        
        Args:
            manager_id: If provided, only return requests from users with this manager.
                       If None, return all pending requests (for HR/Admin).
        """
        print(f"[LeaveService] get_pending_requests called with manager_id={manager_id}")
        
        # Build query with proper join order for SQLAlchemy
        if manager_id is not None:
            # For managers: filter by their team members
            print(f"[LeaveService] Adding manager filter for manager_id={manager_id}")
            query = (
                select(LeaveRequest)
                .join(User, LeaveRequest.user_id == User.id)
                .where(LeaveRequest.status == LeaveStatus.pending)
                .where(User.manager_id == manager_id)
                .order_by(LeaveRequest.created_at.desc())
                .options(
                    selectinload(LeaveRequest.user),
                    selectinload(LeaveRequest.attachments)
                )
            )
        else:
            # For HR/Admin: get all pending requests
            print(f"[LeaveService] No manager filter - returning all pending requests")
            query = (
                select(LeaveRequest)
                .where(LeaveRequest.status == LeaveStatus.pending)
                .order_by(LeaveRequest.created_at.desc())
                .options(
                    selectinload(LeaveRequest.user),
                    selectinload(LeaveRequest.attachments)
                )
            )
        
        print(f"[LeaveService] Executing query...")
        result = await self.db.execute(query)
        requests = result.scalars().all()
        print(f"[LeaveService] Query returned {len(requests)} pending requests")
        for req in requests:
            print(f"  - LeaveRequest ID: {req.id}, User: {req.user.name if req.user else 'Unknown'}, Status: {req.status}")
        
        return requests
    
    async def get_today_leaves(self) -> List[Dict[str, Any]]:
        """Get employees on leave today."""
        today = date.today()
        
        result = await self.db.execute(
            select(LeaveRequest).options(
                selectinload(LeaveRequest.user),
                selectinload(LeaveRequest.attachments)
            ).where(
                and_(
                    LeaveRequest.status == LeaveStatus.approved,
                    LeaveRequest.start_date <= today,
                    LeaveRequest.end_date >= today
                )
            )
        )
        
        requests = result.scalars().all()
        # Return user objects instead of limited dict
        return [r.user for r in requests if r.user]
    
    async def get_history(
        self,
        user_id: Optional[int] = None,
        status: Optional[LeaveStatus] = None,
        limit: int = 100
    ) -> List[LeaveRequest]:
        """Get leave request history."""
        query = select(LeaveRequest).options(
            selectinload(LeaveRequest.user),
            selectinload(LeaveRequest.attachments)
        ).order_by(LeaveRequest.created_at.desc()).limit(limit)
        
        if user_id:
            query = query.where(LeaveRequest.user_id == user_id)
        
        if status:
            query = query.where(LeaveRequest.status == status)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_team_history(
        self,
        team_member_ids: List[int],
        status: Optional[LeaveStatus] = None,
        limit: int = 100
    ) -> List[LeaveRequest]:
        """Get leave request history for a manager's team."""
        if not team_member_ids:
            return []
        
        query = select(LeaveRequest).options(
            selectinload(LeaveRequest.user),
            selectinload(LeaveRequest.attachments)
        ).where(
            LeaveRequest.user_id.in_(team_member_ids)
        ).order_by(LeaveRequest.created_at.desc()).limit(limit)
        
        if status:
            query = query.where(LeaveRequest.status == status)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def _get_user(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def _get_leave_request(self, request_id: int) -> Optional[LeaveRequest]:
        """Get leave request by ID."""
        result = await self.db.execute(
            select(LeaveRequest).options(
                selectinload(LeaveRequest.user),
                selectinload(LeaveRequest.attachments)
            ).where(LeaveRequest.id == request_id)
        )
        return result.scalar_one_or_none()
    
    async def _notify_manager_of_new_request(
        self,
        leave_request_id: int,
        user: User,
        start_date: date,
        end_date: date,
        days: float,
        leave_type: str,
        reason: Optional[str] = None
    ):
        """Notify manager of a new leave request."""
        try:
            # Check if user has a manager assigned
            if not user:
                print(f"[LeaveService] [NOTIFY] User is None")
                return
            
            if not user.manager_id:
                print(f"[LeaveService] [NOTIFY] No manager assigned to user {user.id} ({user.name})")
                return
            
            # Get manager details
            manager = await self._get_user(user.manager_id)
            if not manager:
                print(f"[LeaveService] [NOTIFY] Manager {user.manager_id} not found in database")
                return
            
            # Check if manager has valid phone number
            if not manager.phone:
                print(f"[LeaveService] [NOTIFY] Manager {manager.name} (ID: {manager.id}) has no phone number configured")
                return
            
            print(f"[LeaveService] [NOTIFY] Preparing notification for manager {manager.name} (Phone: {manager.phone})")
            
            # Send notification to manager
            notification_text = format_leave_request_notification(
                request_id=leave_request_id,
                user_name=user.name,
                start_date=str(start_date),
                end_date=str(end_date),
                days=days,
                leave_type=leave_type,
                reason=reason
            )
            
            print(f"[LeaveService] [NOTIFY] Sending WhatsApp notification to manager {manager.phone}")
            success = await whatsapp.send_text(manager.phone, notification_text)
            
            if success:
                print(f"[LeaveService] [NOTIFY] ✓ Notification sent successfully to manager {manager.name}")
            else:
                print(f"[LeaveService] [NOTIFY] ✗ Failed to send notification to manager {manager.name}")
        except Exception as e:
            print(f"[LeaveService] [NOTIFY] Exception while notifying manager: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

    async def _log_action(
        self,
        request_id: int,
        action: str,
        actor_id: int,
        details: Optional[str] = None
    ):
        """Log an action to audit log."""
        try:
            log = AuditLog(
                leave_request_id=request_id,
                action=action,
                actor_id=actor_id,
                details=details
            )
            self.db.add(log)
            # Don't commit here - let the caller handle transaction commits
            # to avoid nested transaction issues and duplicate key errors
        except Exception as e:
            # Log error but don't fail the main operation
            print(f"[AuditLog] Error preparing audit log: {e}")
