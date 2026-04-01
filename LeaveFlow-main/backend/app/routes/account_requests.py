"""
Account Creation Request Routes

Managers/HR submit requests to create accounts, admins approve/reject.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_user_required, require_manager, require_admin, require_hr_admin
from app.models import User, AccountCreationRequest, AccountCreationRequestStatus, UserRole, LeaveBalance
from app.schemas import (
    AccountCreationRequestResponse, 
    AccountCreationRequestCreate,
    AccountCreationRequestApprove,
    UserResponse
)

router = APIRouter(prefix="/account-requests", tags=["Account Requests"])


@router.post("/", response_model=AccountCreationRequestResponse)
async def create_account_request(
    request_data: AccountCreationRequestCreate,
    db: AsyncSession = Depends(get_db),
    requester: User = Depends(require_manager)
):
    """
    Manager/HR requests to create a new account.
    Only managers and HR can request. Admin must approve.
    """
    # Managers can only request worker/manager roles, HR can request any role
    if requester.role == UserRole.manager:
        if request_data.requested_role not in [UserRole.worker, UserRole.manager]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers can only request worker or manager accounts"
            )
    
    # Check if phone already exists in users or pending requests
    existing_user = await db.execute(
        select(User).where(User.phone == request_data.phone)
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    existing_request = await db.execute(
        select(AccountCreationRequest).where(
            and_(
                AccountCreationRequest.phone == request_data.phone,
                AccountCreationRequest.status == AccountCreationRequestStatus.pending
            )
        )
    )
    if existing_request.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Pending request for this phone already exists")
    
    # Validate manager_id if provided
    if request_data.manager_id:
        manager_check = await db.execute(
            select(User).where(User.id == request_data.manager_id)
        )
        if not manager_check.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Manager not found")
    
    # Create the request
    account_request = AccountCreationRequest(
        name=request_data.name,
        phone=request_data.phone,
        email=request_data.email,
        requested_role=request_data.requested_role,
        manager_id=request_data.manager_id,
        requested_by=requester.id
    )
    
    db.add(account_request)
    await db.commit()
    await db.refresh(account_request)
    
    # Notify requester of successful submission
    from app.services.whatsapp import whatsapp
    print(f"[AccountRequests] [OK] New account request #{account_request.id} created by {requester.name}")
    await whatsapp.send_text(
        requester.phone,
        f"✅ *Account Request Submitted*\n\n"
        f"Your request has been submitted for approval:\n"
        f"👤 Name: {request_data.name}\n"
        f"📱 Phone: {request_data.phone}\n"
        f"👔 Role: {request_data.requested_role.value.capitalize()}\n\n"
        f"Request ID: #{account_request.id}\n"
        f"Status: Pending Admin Approval"
    )
    
    return account_request


@router.get("/", response_model=List[AccountCreationRequestResponse])
async def list_account_requests(
    status: Optional[AccountCreationRequestStatus] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_hr_admin)
):
    """
    HR and Admin can view all account creation requests.
    Can filter by status (pending, approved, rejected).
    """
    query = select(AccountCreationRequest)
    
    if status:
        query = query.where(AccountCreationRequest.status == status)
    
    query = query.order_by(AccountCreationRequest.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/pending-count", response_model=dict)
async def get_pending_count(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_hr_admin)
):
    """Get count of pending account creation requests (HR and Admin)."""
    result = await db.execute(
        select(AccountCreationRequest).where(
            AccountCreationRequest.status == AccountCreationRequestStatus.pending
        )
    )
    count = len(result.scalars().all())
    return {"pending_count": count}


@router.get("/{request_id}", response_model=AccountCreationRequestResponse)
async def get_account_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_hr_admin)
):
    """Get details of a specific account creation request (HR and Admin)."""
    result = await db.execute(
        select(AccountCreationRequest)
        .options(
            selectinload(AccountCreationRequest.requester),
            selectinload(AccountCreationRequest.assigned_manager)
        )
        .where(AccountCreationRequest.id == request_id)
    )
    request_obj = result.scalar_one_or_none()
    
    if not request_obj:
        raise HTTPException(status_code=404, detail="Account request not found")
    
    return request_obj


@router.post("/{request_id}/approve", response_model=UserResponse)
async def approve_account_request(
    request_id: int,
    approval_data: AccountCreationRequestApprove,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_hr_admin)
):
    """
    HR and Admin can approve/reject an account creation request.
    If approved: creates the user account
    If rejected: marks request as rejected with reason
    """
    result = await db.execute(
        select(AccountCreationRequest).where(AccountCreationRequest.id == request_id)
    )
    request_obj = result.scalar_one_or_none()
    
    if not request_obj:
        raise HTTPException(status_code=404, detail="Account request not found")
    
    if request_obj.status != AccountCreationRequestStatus.pending:
        raise HTTPException(status_code=400, detail="Request already processed")
    
    if approval_data.approved:
        # Create the new user
        new_user = User(
            name=request_obj.name,
            phone=request_obj.phone,
            email=request_obj.email,
            role=request_obj.requested_role,
            manager_id=request_obj.manager_id
        )
        
        db.add(new_user)
        await db.flush()  # Flush to get the user ID
        
        # Create leave balance for non-admin users
        if request_obj.requested_role != UserRole.admin:
            from datetime import datetime
            leave_balance = LeaveBalance(
                user_id=new_user.id,
                casual=12.0,
                sick=12.0,
                special=5.0,
                year=datetime.now().year
            )
            db.add(leave_balance)
        
        # Mark request as approved
        request_obj.status = AccountCreationRequestStatus.approved
        request_obj.approved_by = admin.id
        
        await db.commit()
        await db.refresh(new_user)
        
        # Notify requester about approval
        from app.services.whatsapp import whatsapp
        requester_result = await db.execute(
            select(User).where(User.id == request_obj.requester_id)
        )
        requester = requester_result.scalar_one_or_none()
        
        if requester:
            print(f"[AccountRequests] [OK] Account request #{request_id} approved by {admin.name}")
            await whatsapp.send_text(
                requester.phone,
                f"✅ *Account Request Approved*\n\n"
                f"Your request to create account for:\n"
                f"👤 Name: {new_user.name}\n"
                f"📱 Phone: {new_user.phone}\n"
                f"👔 Role: {new_user.role.value.capitalize()}\n\n"
                f"The account has been created successfully!"
            )
        
        return new_user
    
    else:
        # Reject the request
        request_obj.status = AccountCreationRequestStatus.rejected
        request_obj.rejection_reason = approval_data.rejection_reason
        request_obj.approved_by = admin.id
        
        await db.commit()
        
        # Notify requester about rejection
        from app.services.whatsapp import whatsapp
        requester_result = await db.execute(
            select(User).where(User.id == request_obj.requester_id)
        )
        requester = requester_result.scalar_one_or_none()
        
        if requester:
            print(f"[AccountRequests] [REJECTED] Account request #{request_id} rejected by {admin.name}")
            await whatsapp.send_text(
                requester.phone,
                f"❌ *Account Request Rejected*\n\n"
                f"Your request to create account for:\n"
                f"👤 Name: {request_obj.name}\n"
                f"📱 Phone: {request_obj.phone}\n\n"
                f"Reason: {approval_data.rejection_reason or 'No reason provided'}"
            )
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Account request rejected. Reason: {approval_data.rejection_reason or 'No reason provided'}"
        )
