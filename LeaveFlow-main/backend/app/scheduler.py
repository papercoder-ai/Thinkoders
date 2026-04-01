"""
Scheduler for automated tasks

- Daily summary for managers
- Escalation for unprocessed requests
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select, and_
from datetime import datetime, timedelta

from app.database import async_session_maker
from app.models import LeaveRequest, User, LeaveStatus, UserRole
from app.services.whatsapp import whatsapp, format_daily_summary
from app.config import get_settings

settings = get_settings()
scheduler = AsyncIOScheduler()


async def send_daily_summary():
    """Send daily leave summary to managers at 8 AM."""
    async with async_session_maker() as db:
        # Get managers
        result = await db.execute(
            select(User).where(User.role.in_([UserRole.manager, UserRole.hr]))
        )
        managers = result.scalars().all()
        
        # Get today's leaves
        from datetime import date
        today = date.today()
        
        result = await db.execute(
            select(LeaveRequest).join(User, LeaveRequest.user_id == User.id).where(
                and_(
                    LeaveRequest.status == LeaveStatus.approved,
                    LeaveRequest.start_date <= today,
                    LeaveRequest.end_date >= today
                )
            )
        )
        leaves = result.scalars().all()
        
        # Format leave list
        leave_list = []
        for leave in leaves:
            result = await db.execute(select(User).where(User.id == leave.user_id))
            user = result.scalar_one_or_none()
            if user:
                leave_list.append({
                    "name": user.name,
                    "type": leave.leave_type.value
                })
        
        # Send to each manager
        message = format_daily_summary(leave_list)
        for manager in managers:
            await whatsapp.send_text(manager.phone, message)


async def check_escalations():
    """Check for pending requests that need escalation."""
    async with async_session_maker() as db:
        # Get requests pending for more than X hours
        threshold = datetime.utcnow() - timedelta(hours=settings.escalation_hours)
        
        result = await db.execute(
            select(LeaveRequest).join(User, LeaveRequest.user_id == User.id).where(
                and_(
                    LeaveRequest.status == LeaveStatus.pending,
                    LeaveRequest.created_at < threshold
                )
            )
        )
        pending_requests = result.scalars().all()
        
        if not pending_requests:
            return
        
        # Get HR users for escalation
        result = await db.execute(
            select(User).where(User.role == UserRole.hr)
        )
        hr_users = result.scalars().all()
        
        for request in pending_requests:
            result = await db.execute(select(User).where(User.id == request.user_id))
            employee = result.scalar_one_or_none()
            
            if not employee:
                continue
            
            message = (
                f"⚠️ *Escalation Alert*\n\n"
                f"Leave request #{request.id} from {employee.name} "
                f"has been pending for over {settings.escalation_hours} hours.\n\n"
                f"Please review: `approve {request.id}` or `reject {request.id} <reason>`"
            )
            
            # Notify HR
            for hr in hr_users:
                await whatsapp.send_text(hr.phone, message)


def start_scheduler():
    """Start the scheduler with configured jobs."""
    # Daily summary at 8 AM
    scheduler.add_job(
        send_daily_summary,
        CronTrigger(hour=8, minute=0),
        id="daily_summary",
        replace_existing=True
    )
    
    # Check escalations every hour
    scheduler.add_job(
        check_escalations,
        CronTrigger(minute=0),  # Every hour
        id="check_escalations",
        replace_existing=True
    )
    
    scheduler.start()


def stop_scheduler():
    """Stop the scheduler."""
    if scheduler.running:
        scheduler.shutdown()
