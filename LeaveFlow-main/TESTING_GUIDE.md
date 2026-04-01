# LeaveFlow - Testing Guide

## Overview
This guide covers comprehensive testing procedures for the LeaveFlow application, including backend API tests, frontend integration tests, WhatsApp bot testing, and end-to-end workflows.

## 🧪 Testing Strategy

### Test Types
- **Unit Tests**: Individual functions and methods
- **Integration Tests**: API endpoints and database interactions
- **End-to-End Tests**: Complete user workflows
- **WhatsApp Bot Tests**: Message parsing and response generation
- **Performance Tests**: Load testing and response times

---

## Backend Testing

### Prerequisites
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
pip install -r tests/requirements-test.txt
```

### Running Tests
```bash
# Run all tests
pytest tests/ -v --cov=app --cov-report=html

# Run specific test file
pytest tests/test_api.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=term-missing

# Run tests in parallel
pytest tests/ -n auto
```

### Test Structure
```
backend/tests/
├── __init__.py
├── conftest.py              # Test fixtures and configuration
├── test_api.py              # API endpoint tests
├── test_auth.py             # Authentication tests
├── test_leave.py            # Leave request business logic
├── test_whatsapp.py         # WhatsApp integration tests
├── test_ai_service.py       # AI service tests
├── test_database.py         # Database operations
└── requirements-test.txt    # Test dependencies
```

### Key Test Fixtures
```python
# conftest.py
@pytest.fixture
async def client():
    """FastAPI test client"""
    from app.main import app
    from app.database import create_test_database

    # Create test database
    await create_test_database()

    # Override dependencies
    app.dependency_overrides[get_db] = get_test_db

    yield TestClient(app)

@pytest.fixture
async def test_user():
    """Create test user"""
    user = User(
        name="Test User",
        email="test@example.com",
        phone="+918500454345",
        role="worker"
    )
    db.add(user)
    await db.commit()
    return user
```

### API Endpoint Tests
```python
def test_create_leave_request(client, test_user, auth_token):
    """Test leave request creation"""
    response = client.post(
        "/leave/requests",
        json={
            "start_date": "2024-12-15",
            "end_date": "2024-12-16",
            "leave_type": "casual",
            "duration_type": "full",
            "reason": "Personal work"
        },
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["leave_type"] == "casual"
    assert data["status"] == "pending"
```

### WhatsApp Bot Tests
```python
def test_whatsapp_message_parsing():
    """Test AI message parsing"""
    from app.services.ai_service import parse_leave_request

    message = "I need 2 days sick leave from tomorrow"
    result = parse_leave_request(message, conversation_history=[])

    assert result["leave_type"] == "sick"
    assert result["days"] == 2
    assert result["start_date"] is not None

def test_conversation_memory():
    """Test conversation context preservation"""
    from app.services.ai_service import process_greeting

    # First message
    response1 = process_greeting("Hi", [])

    # Follow-up with context
    history = [
        {"message": "Hi", "is_from_user": True},
        {"message": response1, "is_from_user": False}
    ]

    response2 = process_greeting("I need leave", history)
    assert "when" in response2.lower()  # Should ask for date
```

### AI Service Tests
```python
def test_ai_response_generation():
    """Test AI response quality"""
    from app.services.ai_service import generate_natural_response

    action = {
        "type": "clarify_date",
        "message": "When do you need the leave?"
    }

    response = generate_natural_response(action, tone="professional_friendly")
    assert len(response) > 10
    assert any(word in response.lower() for word in ["please", "help", "need"])
```

---

## Frontend Testing

### Prerequisites
```bash
cd dashboard
npm install
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- AuthContext.test.tsx

# Watch mode
npm test -- --watch
```

### Component Tests
```tsx
// components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### API Integration Tests
```tsx
// lib/__tests__/api.test.ts
import { apiClient } from '../api'
import { jest } from '@jest/globals'

describe('API Client', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('fetches leave requests successfully', async () => {
    const mockResponse = {
      data: [{ id: 1, status: 'pending' }],
      status: 200
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const result = await apiClient.getLeaveRequests()
    expect(result).toEqual(mockResponse.data)
  })
})
```

### Auth Context Tests
```tsx
// lib/__tests__/auth-context.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../auth-context'

function TestComponent() {
  const { user, login } = useAuth()
  return (
    <div>
      <div data-testid="user">{user?.name || 'No user'}</div>
      <button onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  it('provides auth context to children', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('No user')

    fireEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    })
  })
})
```

---

## WhatsApp Integration Testing

### Manual Testing Steps

#### 1. Webhook Verification
```bash
# Test webhook endpoint
curl "http://localhost:8000/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=leaveflow-verify&hub.challenge=test123"

# Should return: test123
```

#### 2. Message Processing Test
```bash
# Simulate WhatsApp message (requires ngrok)
curl -X POST http://localhost:8000/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "918500454345",
            "text": {"body": "Apply 2 days casual leave from tomorrow"}
          }]
        }
      }]
    }]
  }'
```

#### 3. Conversation Memory Test
```bash
# Test conversation flow
# Message 1: "Hi"
# Message 2: "I need leave"
# Message 3: "Tomorrow"

# Verify conversation history is stored
# Check database: conversation_history table
```

### Automated WhatsApp Tests
```python
def test_whatsapp_webhook_verification(client):
    """Test WhatsApp webhook verification"""
    response = client.get(
        "/webhook/whatsapp",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "leaveflow-verify",
            "hub.challenge": "test123"
        }
    )

    assert response.status_code == 200
    assert response.text == "test123"

def test_whatsapp_message_processing(client, test_user):
    """Test WhatsApp message processing"""
    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "changes": [{
                "value": {
                    "messages": [{
                        "from": test_user.phone,
                        "text": {"body": "Apply 2 days casual leave from tomorrow"}
                    }]
                }
            }]
        }]
    }

    response = client.post("/webhook/whatsapp", json=payload)
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

---

## End-to-End Testing

### Complete User Workflow Test
```python
async def test_complete_leave_request_workflow(client):
    """Test complete leave request flow"""

    # 1. User registration
    user_data = {
        "name": "Test User",
        "email": "test@example.com",
        "phone": "+918500454345",
        "password": "test123",
        "role": "worker"
    }

    response = client.post("/auth/signup", json=user_data)
    assert response.status_code == 200

    # 2. Login
    login_data = {
        "username": "test@example.com",
        "password": "test123"
    }

    response = client.post("/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]

    # 3. Check initial balance
    response = client.get("/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    initial_balance = response.json()["leave_balance"]

    # 4. Create leave request
    leave_data = {
        "start_date": "2024-12-15",
        "end_date": "2024-12-16",
        "leave_type": "casual",
        "duration_type": "full",
        "reason": "Personal work"
    }

    response = client.post("/leave/requests",
        json=leave_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    request_id = response.json()["id"]

    # 5. Verify request created
    response = client.get(f"/leave/requests/{request_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "pending"

    # 6. Manager approval (switch to manager role)
    # ... approval workflow test

    # 7. Verify balance updated
    response = client.get("/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    # Balance should be reduced after approval
```

### WhatsApp E2E Test
```python
async def test_whatsapp_conversation_flow():
    """Test complete WhatsApp conversation"""

    # 1. Greeting
    response1 = await simulate_whatsapp_message("Hi")
    assert "how can I help" in response1.lower()

    # 2. Leave request initiation
    response2 = await simulate_whatsapp_message("I need leave")
    assert "when" in response2.lower()

    # 3. Date specification
    response3 = await simulate_whatsapp_message("tomorrow")
    assert "submitted" in response3.lower()

    # 4. Verify database
    # Check conversation_history has 6 entries (3 user + 3 bot)
    # Check leave_requests has new entry with status 'pending'
```

---

## Performance Testing

### Load Testing Setup
```bash
# Install locust
pip install locust

# Run load test
locust -f tests/load_test.py --host=http://localhost:8000
```

### Load Test Script
```python
# tests/load_test.py
from locust import HttpUser, task, between

class LeaveFlowUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def view_requests(self):
        self.client.get("/leave/requests",
            headers={"Authorization": f"Bearer {self.token}"})

    @task(2)
    def create_request(self):
        self.client.post("/leave/requests",
            json={
                "start_date": "2024-12-15",
                "end_date": "2024-12-16",
                "leave_type": "casual",
                "duration_type": "full",
                "reason": "Load test"
            },
            headers={"Authorization": f"Bearer {self.token}"})

    @task(1)
    def check_balance(self):
        self.client.get("/auth/me",
            headers={"Authorization": f"Bearer {self.token}"})

    def on_start(self):
        # Login and get token
        response = self.client.post("/auth/login",
            data={"username": "worker1@leaveflow.com", "password": "worker123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        self.token = response.json()["access_token"]
```

### Performance Benchmarks
- **API Response Time**: < 200ms for simple queries
- **Concurrent Users**: Support 100+ simultaneous users
- **Database Queries**: < 50ms average response time
- **WhatsApp Messages**: < 3 seconds end-to-end processing

---

## CI/CD Testing

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'

    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install -r tests/requirements-test.txt

    - name: Run tests
      run: |
        cd backend
        pytest tests/ -v --cov=app --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml
```

### Pre-commit Hooks
```bash
# Install pre-commit
pip install pre-commit

# Setup hooks
pre-commit install

# Run on all files
pre-commit run --all-files
```

### Pre-commit Configuration
```yaml
# .pre-commit-config.yaml
repos:
- repo: https://github.com/pre-commit/pre-commit-hooks
  rev: v4.4.0
  hooks:
  - id: trailing-whitespace
  - id: end-of-file-fixer
  - id: check-yaml
  - id: check-added-large-files

- repo: https://github.com/psf/black
  rev: 23.7.0
  hooks:
  - id: black
    language_version: python3.11

- repo: https://github.com/pycqa/flake8
  rev: 6.0.0
  hooks:
  - id: flake8
```

---

## Test Data Management

### Demo Data Setup
```python
# backend/seed_demo_data.py
async def seed_demo_data():
    """Create comprehensive test data"""

    # Create users with different roles
    users = [
        User(name="Admin User", email="admin@leaveflow.com", role="admin", ...),
        User(name="Manager User", email="manager1@leaveflow.com", role="manager", ...),
        User(name="Worker User", email="worker1@leaveflow.com", role="worker", ...),
        # ... more users
    ]

    # Create leave requests in various states
    leave_requests = [
        LeaveRequest(user_id=1, status="approved", ...),
        LeaveRequest(user_id=2, status="pending", ...),
        LeaveRequest(user_id=3, status="rejected", ...),
    ]

    # Create holidays
    holidays = [
        Holiday(date="2024-12-25", name="Christmas"),
        Holiday(date="2025-01-01", name="New Year"),
    ]

    # Insert all data
    async with AsyncSession(engine) as session:
        session.add_all(users + leave_requests + holidays)
        await session.commit()
```

### Test Database Management
```python
# tests/conftest.py
@pytest.fixture(scope="session")
async def test_database():
    """Create test database"""
    # Create test database
    await create_database("leaveflow_test")

    # Run migrations
    await run_migrations("leaveflow_test")

    # Seed test data
    await seed_test_data()

    yield

    # Cleanup
    await drop_database("leaveflow_test")
```

---

## Monitoring & Debugging Tests

### Test Logging
```python
# Enable debug logging in tests
import logging

logging.basicConfig(level=logging.DEBUG)

# Test with logging
def test_api_with_logging(client, caplog):
    with caplog.at_level(logging.DEBUG):
        response = client.get("/health")
        assert "Health check" in caplog.text
```

### Test Metrics
```python
# tests/test_metrics.py
def test_response_times(client):
    """Test API response times"""
    import time

    start_time = time.time()
    response = client.get("/leave/requests")
    end_time = time.time()

    response_time = end_time - start_time
    assert response_time < 0.5  # Should respond within 500ms
```

### Database Query Analysis
```python
# Test for N+1 queries
def test_no_n_plus_one_queries(client, test_db):
    """Ensure no N+1 query problems"""
    from sqlalchemy import event

    queries = []

    def count_queries(conn, cursor, statement, parameters, context, executemany):
        queries.append(statement)

    event.listen(test_db, "before_cursor_execute", count_queries)

    # Perform operation
    response = client.get("/leave/requests")

    # Should not have excessive queries
    assert len(queries) < 10  # Reasonable limit
```

---

## Best Practices

### Test Organization
- **One concept per test**: Each test should verify one behavior
- **Descriptive names**: `test_user_can_create_leave_request()`
- **Independent tests**: Tests should not depend on each other
- **Fast execution**: Keep tests under 100ms each

### Test Data
- **Use factories**: Create test data programmatically
- **Clean state**: Each test starts with known state
- **Minimal data**: Only create what's needed for the test
- **Realistic data**: Use realistic values, not just "test123"

### CI/CD Integration
- **Fast feedback**: Run tests on every commit
- **Parallel execution**: Run tests in parallel for speed
- **Coverage reports**: Track code coverage over time
- **Quality gates**: Block merges if tests fail

### Debugging Failed Tests
```bash
# Run single failing test with debug
pytest tests/test_api.py::test_create_leave_request -v -s --pdb

# Show SQL queries
pytest tests/ --log-cli-level=DEBUG -k "test_database"

# Profile slow tests
pytest tests/ --durations=10
```

---

## Quick Test Checklist

### Before Committing
- [ ] All unit tests pass: `pytest tests/ -x`
- [ ] Code coverage > 80%: `pytest tests/ --cov=app --cov-fail-under=80`
- [ ] No linting errors: `flake8 app/ tests/`
- [ ] Type checking passes: `mypy app/`
- [ ] Frontend tests pass: `npm test`

### Before Deploying
- [ ] End-to-end tests pass
- [ ] Performance benchmarks met
- [ ] WhatsApp integration tested
- [ ] Database migrations tested
- [ ] Environment variables verified

### After Deploying
- [ ] Health checks pass
- [ ] Basic functionality verified
- [ ] WhatsApp messages work
- [ ] User login/logout works
- [ ] Leave request flow works

---

## Troubleshooting Test Issues

### Common Problems

**Tests failing randomly**
- Race conditions in async code
- Database state not isolated
- External dependencies (API calls)

**Slow test suite**
- Too many database operations
- Heavy fixtures
- Inefficient queries

**Flaky tests**
- Time-dependent logic
- Network calls without mocking
- Shared state between tests

### Solutions

**Isolate database state:**
```python
@pytest.fixture(autouse=True)
async def clean_database():
    """Clean database before each test"""
    async with AsyncSession(engine) as session:
        # Delete all data
        await session.execute(text("DELETE FROM audit_logs"))
        await session.execute(text("DELETE FROM leave_requests"))
        await session.execute(text("DELETE FROM users"))
        await session.commit()
```

**Mock external services:**
```python
@pytest.fixture
def mock_openrouter(monkeypatch):
    """Mock OpenRouter API calls"""
    async def mock_call(*args, **kwargs):
        return {"choices": [{"message": {"content": "Mock response"}}]}

    monkeypatch.setattr("app.services.ai_service.openrouter_call", mock_call)
```

**Speed up tests:**
```python
# Use in-memory database for fast tests
@pytest.fixture
def fast_db():
    """SQLite in-memory database for fast tests"""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    # ... setup schema
    return engine
```

---

This testing guide ensures LeaveFlow maintains high quality and reliability across all components. Regular testing prevents regressions and ensures new features work correctly with existing functionality.</content>
<parameter name="filePath">d:\Projects\LeaveFlow\TESTING_GUIDE.md