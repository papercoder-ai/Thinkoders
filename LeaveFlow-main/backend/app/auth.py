"""
Authentication utilities
"""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.database import get_db
from app.models import User, UserRole

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=True
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    # Bcrypt has a 72-byte limit, so truncate if necessary
    try:
        truncated_password = plain_password[:72] if len(plain_password.encode('utf-8')) > 72 else plain_password
        return pwd_context.verify(truncated_password, hashed_password)
    except Exception as e:
        # Handle passlib/bcrypt compatibility errors gracefully
        error_msg = str(e).lower()
        if "bcrypt" in error_msg or "version" in error_msg or "trapped" in error_msg:
            # Try direct bcrypt comparison as fallback
            try:
                import bcrypt
                truncated = plain_password[:72] if len(plain_password.encode('utf-8')) > 72 else plain_password
                return bcrypt.checkpw(truncated.encode('utf-8'), hashed_password.encode('utf-8'))
            except:
                return False
        return False


def get_password_hash(password: str) -> str:
    """Hash a password."""
    # Bcrypt has a 72-byte limit, so truncate if necessary
    truncated_password = password[:72] if len(password.encode('utf-8')) > 72 else password
    return pwd_context.hash(truncated_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})
    
    # Ensure 'sub' is a string (JWT standard)
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        
        # Convert sub to int (sub is stored as string in JWT)
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            raise credentials_exception
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check account status
    from app.models import AccountStatus
    if hasattr(user, 'account_status'):
        # Managers, HR, and Admin can access even if pending
        # Only workers (role='worker') need to be fully approved
        user_role_str = str(user.role).lower() if user.role else ""
        
        if (user.account_status == AccountStatus.pending and 
            user_role_str == 'worker'):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is pending admin approval"
            )
        elif user.account_status == AccountStatus.suspended:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended"
            )
        
    return user


async def get_current_user_required(
    user: User = Depends(get_current_user)
) -> User:
    """Get the current user or raise 401."""
    return user


async def require_manager(
    user: User = Depends(get_current_user_required)
) -> User:
    """Require manager, HR, or Admin role."""
    if user.role not in [UserRole.manager, UserRole.hr, UserRole.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager, HR, or Admin role required"
        )
    return user


async def require_admin(
    user: User = Depends(get_current_user_required)
) -> User:
    """Require admin role."""
    if user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )
    return user


async def require_hr_admin(
    user: User = Depends(get_current_user_required)
) -> User:
    """Require HR or Admin role."""
    if user.role not in [UserRole.hr, UserRole.admin]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="HR or Admin role required"
        )
    return user


def check_user_access(current_user: User, target_user: User) -> bool:
    """
    Centralized user access checker.
    Returns True if current_user can access target_user's information.
    """
    # Admin can access everything
    if current_user.role == UserRole.admin:
        return True
    
    # HR can access everything except Admin users
    if current_user.role == UserRole.hr:
        return target_user.role != UserRole.admin
    
    # Manager can access their team members and other managers
    if current_user.role == UserRole.manager:
        is_team_member = target_user.manager_id == current_user.id
        is_manager = target_user.role == UserRole.manager
        is_self = target_user.id == current_user.id
        return is_team_member or is_manager or is_self
    
    # Workers can only access themselves and their manager
    if current_user.role == UserRole.worker:
        is_self = target_user.id == current_user.id
        is_manager = target_user.id == current_user.manager_id
        return is_self or is_manager
    
    return False


def normalize_phone_number(phone: str, default_country_code: str = "91") -> str:
    """Normalize phone number by adding country code if missing.
    
    Args:
        phone: Phone number (may or may not have country code)
        default_country_code: Default country code to use (default: 91 for India)
    
    Returns:
        Phone number with country code in format: +{code}{number}
    
    Examples:
        '8500454345' -> '+918500454345'
        '918500454345' -> '+918500454345'
        '+918500454345' -> '+918500454345'
        '14155551234' -> '+14155551234' (US number)
    """
    # Remove all spaces, dashes, and parentheses
    phone = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    
    # If already has +, return as is
    if phone.startswith("+"):
        return phone
    
    # If starts with country code digits but no +, add +
    # Common country codes: 1 (US/Canada), 91 (India), 44 (UK), 86 (China), etc.
    if phone.startswith("91") and len(phone) >= 12:  # India: 91 + 10 digits
        return f"+{phone}"
    if phone.startswith("1") and len(phone) == 11:  # US/Canada: 1 + 10 digits
        return f"+{phone}"
    if phone.startswith("44") and len(phone) >= 12:  # UK: 44 + 10 digits
        return f"+{phone}"
    if phone.startswith("86") and len(phone) >= 13:  # China: 86 + 11 digits
        return f"+{phone}"
    
    # Otherwise, add default country code
    return f"+{default_country_code}{phone}"


async def get_user_by_phone(db: AsyncSession, phone: str) -> Optional[User]:
    """Get a user by phone number. Normalizes phone number first."""
    normalized_phone = normalize_phone_number(phone)
    result = await db.execute(select(User).where(User.phone == normalized_phone))
    user = result.scalar_one_or_none()
    
    # If not found with normalized, try original (for backward compatibility)
    if not user and phone != normalized_phone:
        result = await db.execute(select(User).where(User.phone == phone))
        user = result.scalar_one_or_none()
    
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Get a user by email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()
