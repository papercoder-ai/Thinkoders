"""
Holiday Management Routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import date

from app.database import get_db
from app.auth import get_current_user_required, require_hr_admin
from app.models import User, Holiday
from app.schemas import HolidayResponse, HolidayCreate

router = APIRouter(prefix="/holidays", tags=["Holiday Management"])


@router.get("/", response_model=List[HolidayResponse])
async def list_holidays(
    year: int = Query(default=None, description="Filter by year"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user_required)
):
    """List all holidays."""
    query = select(Holiday).order_by(Holiday.date)
    
    if year:
        query = query.where(
            Holiday.date >= date(year, 1, 1),
            Holiday.date <= date(year, 12, 31)
        )
    
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=HolidayResponse)
async def create_holiday(
    holiday_data: HolidayCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_hr_admin)
):
    """Create a new holiday (HR/Admin only)."""
    # Check if holiday already exists
    result = await db.execute(
        select(Holiday).where(Holiday.date == holiday_data.date)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Holiday already exists for {holiday_data.date}"
        )
    
    holiday = Holiday(
        date=holiday_data.date,
        name=holiday_data.name,
        description=holiday_data.description
    )
    
    db.add(holiday)
    await db.commit()
    await db.refresh(holiday)
    
    return holiday


@router.delete("/{holiday_id}")
async def delete_holiday(
    holiday_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_hr_admin)
):
    """Delete a holiday (HR/Admin only)."""
    result = await db.execute(select(Holiday).where(Holiday.id == holiday_id))
    holiday = result.scalar_one_or_none()
    
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    
    await db.delete(holiday)
    await db.commit()
    
    return {"status": "deleted"}
