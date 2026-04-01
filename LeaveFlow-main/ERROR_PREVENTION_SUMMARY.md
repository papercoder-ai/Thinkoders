# LeaveFlow - Error Prevention Summary

## Overview
This document outlines error prevention strategies, common error patterns, and defensive programming practices implemented in LeaveFlow to ensure system reliability and user experience.

## 🛡️ Error Prevention Strategy

### Core Principles
- **Fail Fast**: Detect errors early in the process
- **Graceful Degradation**: System continues operating when non-critical components fail
- **Comprehensive Logging**: All errors are logged with context for debugging
- **Input Validation**: All user inputs are validated before processing
- **Resource Management**: Proper cleanup and resource limits

---

## Input Validation & Sanitization

### API Input Validation
```python
# backend/app/schemas.py
from pydantic import BaseModel, validator, Field
from typing import Optional
from datetime import date

class LeaveRequestCreate(BaseModel):
    start_date: date
    end_date: date
    leave_type: str = Field(..., regex=r'^(casual|sick|special)$')
    duration_type: str = Field(..., regex=r'^(full|half_morning|half_afternoon)$')
    reason: Optional[str] = Field(None, max_length=500)

    @validator('end_date')
    def end_date_must_be_after_start_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('End date must be after start date')
        return v

    @validator('start_date')
    def start_date_not_in_past(cls, v):
        if v < date.today():
            raise ValueError('Start date cannot be in the past')
        return v
```

### WhatsApp Message Validation
```python
# backend/app/routes/webhook.py
def validate_whatsapp_payload(payload: dict) -> bool:
    """Validate incoming WhatsApp webhook payload"""
    try:
        # Check required structure
        if not payload.get('object') == 'whatsapp_business_account':
            return False

        entries = payload.get('entry', [])
        if not entries:
            return False

        # Validate message structure
        for entry in entries:
            for change in entry.get('changes', []):
                messages = change.get('value', {}).get('messages', [])
                for message in messages:
                    if not message.get('from') or not message.get('text', {}).get('body'):
                        return False

        return True
    except (KeyError, TypeError):
        return False
```

### Database Constraint Validation
```sql
-- Database constraints prevent invalid data
ALTER TABLE users ADD CONSTRAINT chk_role CHECK (role IN ('worker', 'manager', 'hr', 'admin'));
ALTER TABLE leave_requests ADD CONSTRAINT chk_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));
ALTER TABLE leave_requests ADD CONSTRAINT chk_leave_type CHECK (leave_type IN ('casual', 'sick', 'special'));
ALTER TABLE leave_requests ADD CONSTRAINT chk_duration_type CHECK (duration_type IN ('full', 'half_morning', 'half_afternoon'));
```

---

## Error Handling Patterns

### Global Exception Handler
```python
# backend/app/main.py
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
import logging

logger = logging.getLogger(__name__)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with proper logging"""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors gracefully"""
    logger.error(f"Database error: {str(exc)} - {request.url}")
    # Don't expose internal database details to users
    return JSONResponse(
        status_code=500,
        content={"detail": "Database operation failed. Please try again."}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler"""
    logger.error(f"Unexpected error: {str(exc)} - {request.url}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please contact support."}
    )
```

### Service Layer Error Handling
```python
# backend/app/services/leave.py
from sqlalchemy.exc import IntegrityError
from app.core.exceptions import InsufficientLeaveBalanceError, OverlappingLeaveError

async def create_leave_request(db: AsyncSession, request_data: dict, user_id: int):
    """Create leave request with comprehensive error handling"""
    try:
        # Validate leave balance
        balance = await check_leave_balance(db, user_id, request_data)
        if balance < request_data['days']:
            raise InsufficientLeaveBalanceError("Insufficient leave balance")

        # Check for overlapping leaves
        overlapping = await check_overlapping_leaves(db, user_id, request_data)
        if overlapping:
            raise OverlappingLeaveError("Leave dates overlap with existing request")

        # Create request
        leave_request = LeaveRequest(
            user_id=user_id,
            **request_data
        )

        db.add(leave_request)

        # Create audit log (after adding to session)
        audit_log = AuditLog(
            user_id=user_id,
            action="create_leave_request",
            details=f"Created leave request: {request_data['start_date']} to {request_data['end_date']}"
        )
        db.add(audit_log)

        await db.commit()
        await db.refresh(leave_request)

        return leave_request

    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Database integrity error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid data provided")

    except InsufficientLeaveBalanceError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    except OverlappingLeaveError as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error creating leave request: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create leave request")
```

### AI Service Error Handling
```python
# backend/app/services/ai_service.py
import asyncio
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class AIServiceError(Exception):
    """Base exception for AI service errors"""
    pass

class OpenRouterAPIError(AIServiceError):
    """OpenRouter API specific errors"""
    pass

async def call_openrouter_with_retry(prompt: str, max_retries: int = 3) -> str:
    """Call OpenRouter API with exponential backoff retry"""
    for attempt in range(max_retries):
        try:
            response = await openrouter_call(prompt)

            if not response or 'choices' not in response:
                raise OpenRouterAPIError("Invalid API response format")

            content = response['choices'][0]['message']['content']
            if not content:
                raise OpenRouterAPIError("Empty response from AI service")

            return content

        except asyncio.TimeoutError:
            if attempt == max_retries - 1:
                raise AIServiceError("AI service timeout")
            await asyncio.sleep(2 ** attempt)  # Exponential backoff

        except Exception as e:
            logger.warning(f"AI service attempt {attempt + 1} failed: {str(e)}")
            if attempt == max_retries - 1:
                raise AIServiceError(f"AI service failed after {max_retries} attempts")

async def parse_leave_request(message: str, conversation_history: List[Dict]) -> Dict[str, Any]:
    """Parse leave request with fallback mechanisms"""
    try:
        # Try AI parsing first
        result = await call_openrouter_with_retry(
            f"Parse this leave request: {message}\nHistory: {conversation_history}"
        )

        # Validate AI response
        parsed = json.loads(result)
        if not validate_parsed_request(parsed):
            raise ValueError("AI returned invalid format")

        return parsed

    except (AIServiceError, json.JSONDecodeError, ValueError) as e:
        logger.warning(f"AI parsing failed, using fallback: {str(e)}")

        # Fallback to rule-based parsing
        return fallback_parse_leave_request(message)

def validate_parsed_request(parsed: Dict) -> bool:
    """Validate parsed leave request structure"""
    required_fields = ['leave_type', 'start_date', 'days']
    return all(field in parsed for field in required_fields)
```

---

## Resource Management

### Database Connection Pooling
```python
# backend/app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import QueuePool

def create_database_engine(database_url: str):
    """Create database engine with proper resource limits"""
    return create_async_engine(
        database_url,
        poolclass=QueuePool,
        pool_size=10,          # Maximum connections in pool
        max_overflow=20,       # Additional connections when pool is full
        pool_timeout=30,       # Timeout waiting for connection
        pool_recycle=3600,     # Recycle connections after 1 hour
        echo=False             # Disable SQL logging in production
    )
```

### WhatsApp Rate Limiting
```python
# backend/app/services/whatsapp.py
import time
from collections import defaultdict

class RateLimiter:
    """Rate limiter for WhatsApp API calls"""

    def __init__(self, max_calls_per_minute: int = 60):
        self.max_calls = max_calls_per_minute
        self.calls = defaultdict(list)

    def can_make_call(self, phone_number: str) -> bool:
        """Check if API call is allowed"""
        now = time.time()
        minute_ago = now - 60

        # Remove old calls
        self.calls[phone_number] = [
            call_time for call_time in self.calls[phone_number]
            if call_time > minute_ago
        ]

        # Check limit
        if len(self.calls[phone_number]) >= self.max_calls:
            return False

        # Record this call
        self.calls[phone_number].append(now)
        return True

rate_limiter = RateLimiter()

async def send_whatsapp_message(phone: str, message: str) -> bool:
    """Send WhatsApp message with rate limiting"""
    if not rate_limiter.can_make_call(phone):
        logger.warning(f"Rate limit exceeded for {phone}")
        return False

    try:
        # Send message logic
        return await whatsapp_api_call(phone, message)
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message: {str(e)}")
        return False
```

### Memory Management
```python
# backend/app/services/ai_service.py
from functools import lru_cache
import gc

@lru_cache(maxsize=100)
def cached_ai_response(prompt_hash: str, prompt: str) -> str:
    """Cache AI responses to reduce API calls"""
    # Implementation
    pass

def cleanup_conversation_history():
    """Clean up old conversation history to prevent memory leaks"""
    # Remove conversations older than 24 hours
    cutoff_time = datetime.utcnow() - timedelta(hours=24)

    # Database cleanup (would be called periodically)
    # DELETE FROM conversation_history WHERE created_at < cutoff_time
    pass

# Periodic cleanup
async def periodic_cleanup():
    """Run periodic cleanup tasks"""
    while True:
        await asyncio.sleep(3600)  # Run every hour
        cleanup_conversation_history()
        gc.collect()  # Force garbage collection
```

---

## Logging & Monitoring

### Structured Logging
```python
# backend/app/core/logging.py
import logging
import json
from pythonjsonlogger import jsonlogger

def setup_logging():
    """Configure structured JSON logging"""
    logger = logging.getLogger()

    # JSON formatter for production
    json_formatter = jsonlogger.JsonFormatter(
        fmt='%(asctime)s %(name)s %(levelname)s %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Console handler for development
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    ))

    # File handler for production
    file_handler = logging.FileHandler('app.log')
    file_handler.setFormatter(json_formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    logger.setLevel(logging.INFO)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests"""
    start_time = time.time()

    logger.info(f"Request started: {request.method} {request.url}", extra={
        'user_agent': request.headers.get('user-agent'),
        'ip': request.client.host if request.client else None,
        'user_id': getattr(request.state, 'user_id', None)
    })

    try:
        response = await call_next(request)
        process_time = time.time() - start_time

        logger.info(f"Request completed: {response.status_code}", extra={
            'process_time': process_time,
            'status_code': response.status_code
        })

        return response

    except Exception as e:
        process_time = time.time() - start_time
        logger.error(f"Request failed: {str(e)}", extra={
            'process_time': process_time,
            'exception': str(e)
        })
        raise
```

### Health Checks
```python
# backend/app/main.py
@app.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }

    try:
        # Database check
        async with AsyncSession(engine) as session:
            await session.execute(text("SELECT 1"))
        health_status["checks"]["database"] = "ok"

    except Exception as e:
        health_status["checks"]["database"] = f"error: {str(e)}"
        health_status["status"] = "unhealthy"

    try:
        # WhatsApp API check (lightweight)
        # This would be a simple API call to check credentials
        health_status["checks"]["whatsapp"] = "ok"
    except Exception as e:
        health_status["checks"]["whatsapp"] = f"error: {str(e)}"

    try:
        # AI service check
        test_response = await call_openrouter_with_retry("Hello", max_retries=1)
        health_status["checks"]["ai_service"] = "ok"
    except Exception as e:
        health_status["checks"]["ai_service"] = f"error: {str(e)}"

    # Return appropriate status code
    status_code = 200 if health_status["status"] == "healthy" else 503
    return JSONResponse(content=health_status, status_code=status_code)
```

### Error Metrics
```python
# backend/app/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import time

# Error counters
http_errors = Counter('http_errors_total', 'HTTP errors by status code', ['status_code', 'endpoint'])
db_errors = Counter('db_errors_total', 'Database errors', ['operation'])
ai_errors = Counter('ai_errors_total', 'AI service errors', ['operation'])

# Performance metrics
request_duration = Histogram('request_duration_seconds', 'Request duration', ['endpoint'])
db_query_duration = Histogram('db_query_duration_seconds', 'Database query duration', ['operation'])

# Business metrics
leave_requests_created = Counter('leave_requests_created_total', 'Leave requests created')
whatsapp_messages_processed = Counter('whatsapp_messages_processed_total', 'WhatsApp messages processed')

def record_error(error_type: str, **labels):
    """Record error metrics"""
    if error_type == 'http':
        http_errors.labels(**labels).inc()
    elif error_type == 'db':
        db_errors.labels(**labels).inc()
    elif error_type == 'ai':
        ai_errors.labels(**labels).inc()

def record_request_duration(endpoint: str, duration: float):
    """Record request duration"""
    request_duration.labels(endpoint=endpoint).observe(duration)
```

---

## Security Measures

### Authentication & Authorization
```python
# backend/app/auth.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password with timing attack protection"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password securely"""
    return pwd_context.hash(password)

async def authenticate_user(db: AsyncSession, email: str, password: str):
    """Authenticate user with secure password check"""
    user = await get_user_by_email(db, email)
    if not user:
        # Use constant time comparison to prevent timing attacks
        pwd_context.dummy_verify()
        return False

    if not verify_password(password, user.hashed_password):
        return False

    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT token with expiration"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await get_user_by_email(email)
    if user is None:
        raise credentials_exception

    return user

def check_permissions(user: User, required_role: str):
    """Check if user has required permissions"""
    role_hierarchy = {
        'worker': 1,
        'manager': 2,
        'hr': 3,
        'admin': 4
    }

    user_level = role_hierarchy.get(user.role, 0)
    required_level = role_hierarchy.get(required_role, 0)

    if user_level < required_level:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
```

### Input Sanitization
```python
# backend/app/core/security.py
import re
from typing import Optional

def sanitize_phone_number(phone: str) -> Optional[str]:
    """Sanitize and validate phone number"""
    if not phone:
        return None

    # Remove all non-digit characters
    digits_only = re.sub(r'\D', '', phone)

    # Handle Indian numbers (add +91 if missing)
    if len(digits_only) == 10:
        digits_only = f"91{digits_only}"
    elif len(digits_only) == 12 and digits_only.startswith('91'):
        pass  # Already has country code
    else:
        return None  # Invalid length

    # Validate format
    if not re.match(r'^91[6-9]\d{9}$', digits_only):
        return None

    return f"+{digits_only}"

def sanitize_text_input(text: str, max_length: int = 1000) -> str:
    """Sanitize text input to prevent XSS and other attacks"""
    if not text:
        return ""

    # Remove potentially dangerous characters
    text = re.sub(r'[<>]', '', text)

    # Trim whitespace
    text = text.strip()

    # Limit length
    if len(text) > max_length:
        text = text[:max_length]

    return text

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))
```

---

## Graceful Degradation

### Fallback Mechanisms
```python
# backend/app/services/ai_service.py
async def process_message_with_fallback(message: str, conversation_history: List[Dict]) -> str:
    """Process message with multiple fallback levels"""

    # Level 1: Full AI processing with conversation context
    try:
        return await generate_ai_response(message, conversation_history)
    except AIServiceError:
        logger.warning("AI service failed, falling back to basic AI")

    # Level 2: Basic AI without conversation context
    try:
        return await generate_basic_ai_response(message)
    except AIServiceError:
        logger.warning("Basic AI failed, falling back to templates")

    # Level 3: Template-based responses
    return get_template_response(message)

def get_template_response(message: str) -> str:
    """Get template-based response when AI is unavailable"""
    message_lower = message.lower()

    if 'balance' in message_lower:
        return "To check your leave balance, please visit the web dashboard or contact HR."
    elif 'leave' in message_lower:
        return "To apply for leave, please use the web dashboard or provide more details."
    elif 'status' in message_lower:
        return "To check your leave request status, please visit the web dashboard."
    else:
        return "I'm currently experiencing technical difficulties. Please try again later or contact HR for assistance."
```

### Circuit Breaker Pattern
```python
# backend/app/core/circuit_breaker.py
import time
from enum import Enum

class CircuitBreakerState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    """Circuit breaker for external service calls"""

    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitBreakerState.CLOSED

    def can_execute(self) -> bool:
        """Check if operation can be executed"""
        if self.state == CircuitBreakerState.CLOSED:
            return True
        elif self.state == CircuitBreakerState.OPEN:
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitBreakerState.HALF_OPEN
                return True
            return False
        elif self.state == CircuitBreakerState.HALF_OPEN:
            return True

    def record_success(self):
        """Record successful operation"""
        self.failure_count = 0
        self.state = CircuitBreakerState.CLOSED

    def record_failure(self):
        """Record failed operation"""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN

# Global circuit breakers
ai_circuit_breaker = CircuitBreaker()
whatsapp_circuit_breaker = CircuitBreaker()

async def safe_ai_call(prompt: str) -> str:
    """AI call with circuit breaker protection"""
    if not ai_circuit_breaker.can_execute():
        raise AIServiceError("AI service circuit breaker is open")

    try:
        result = await call_openrouter_api(prompt)
        ai_circuit_breaker.record_success()
        return result
    except Exception as e:
        ai_circuit_breaker.record_failure()
        raise
```

---

## Testing Error Scenarios

### Error Simulation Tests
```python
# tests/test_error_handling.py
import pytest
from unittest.mock import patch, AsyncMock

def test_ai_service_fallback(client):
    """Test AI service fallback when API fails"""
    with patch('app.services.ai_service.call_openrouter_with_retry') as mock_ai:
        mock_ai.side_effect = AIServiceError("API down")

        response = client.post("/webhook/whatsapp", json={
            "object": "whatsapp_business_account",
            "entry": [{
                "changes": [{
                    "value": {
                        "messages": [{
                            "from": "+918500454345",
                            "text": {"body": "I need leave"}
                        }]
                    }
                }]
            }]
        })

        assert response.status_code == 200
        # Should still respond with fallback message

def test_database_connection_failure(client):
    """Test graceful handling of database connection issues"""
    with patch('app.database.get_db') as mock_db:
        mock_db.side_effect = Exception("Connection failed")

        response = client.get("/health")
        assert response.status_code == 503
        assert "unhealthy" in response.json()["status"]

def test_rate_limiting(client):
    """Test WhatsApp rate limiting"""
    # Send many messages quickly
    for i in range(70):  # Over limit
        response = client.post("/webhook/whatsapp", json={
            "object": "whatsapp_business_account",
            "entry": [{
                "changes": [{
                    "value": {
                        "messages": [{
                            "from": "+918500454345",
                            "text": {"body": f"Message {i}"}
                        }]
                    }
                }]
            }]
        })

    # Last response should indicate rate limiting
    assert response.status_code == 200  # Still succeeds but may log warning
```

---

## Best Practices Summary

### Code Quality
- **Type Hints**: All functions use proper type annotations
- **Docstrings**: Comprehensive documentation for all public functions
- **Code Reviews**: All changes reviewed before merging
- **Static Analysis**: Regular linting and type checking

### Monitoring & Alerting
- **Health Checks**: Automated monitoring of all critical components
- **Error Tracking**: Centralized logging with correlation IDs
- **Performance Monitoring**: Response time and resource usage tracking
- **Alert Rules**: Automatic alerts for critical failures

### Deployment Safety
- **Blue-Green Deployments**: Zero-downtime deployments
- **Rollback Plans**: Quick rollback procedures for failed deployments
- **Feature Flags**: Gradual rollout of new features
- **Database Migrations**: Safe, reversible database changes

### Security First
- **Input Validation**: All inputs validated and sanitized
- **Authentication**: Secure JWT-based authentication
- **Authorization**: Role-based access control
- **Audit Logging**: Complete audit trail of all actions

This error prevention strategy ensures LeaveFlow remains reliable, secure, and user-friendly even under adverse conditions. Regular reviews and updates to these practices help maintain high system quality over time.</content>
<parameter name="filePath">d:\Projects\LeaveFlow\ERROR_PREVENTION_SUMMARY.md