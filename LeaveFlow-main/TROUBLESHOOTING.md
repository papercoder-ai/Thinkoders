# LeaveFlow - Troubleshooting Guide

## 🔧 Common Issues & Solutions

---

## Backend Issues

### 1. Module Not Found Error
**Error:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

**Prevention:**
- Always activate virtual environment before running
- Keep requirements.txt updated

---

### 2. Database Connection Failed
**Error:**
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Solutions:**

**Check PostgreSQL is running:**
```bash
# Windows
Get-Service postgresql*

# Start if not running
Start-Service postgresql-x64-15
```

**Verify DATABASE_URL:**
```bash
# Check .env file
cat backend/.env

# Should look like:
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/leaveflow
```

**Test connection manually:**
```bash
psql -h localhost -U postgres -d leaveflow
```

**Common fixes:**
- Wrong password in DATABASE_URL
- Database 'leaveflow' doesn't exist (create it: `createdb leaveflow`)
- PostgreSQL not accepting connections (check `postgresql.conf`)

---

### 3. Pydantic Validation Error
**Error:**
```
pydantic.error_wrappers.ValidationError: 1 validation error for User
```

**Solution:**
- Check request body matches schema
- Ensure all required fields present
- Verify data types (string vs number)

**Example fix:**
```python
# Wrong
{"name": 123}  # name should be string

# Correct
{"name": "John Doe"}
```

---

### 4. JWT Token Expired
**Error:**
```
{"detail": "Could not validate credentials"}
```

**Solution:**
- Re-login to get new token
- Token expires after 24 hours (default)

**For development (extend expiration):**
```python
# backend/app/auth.py
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours
```

---

### 5. CORS Error
**Error:**
```
Access to fetch has been blocked by CORS policy
```

**Solution:**
```bash
# Check backend/.env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Add your frontend URL to the list
```

**Quick fix (development only):**
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### 6. Port Already in Use
**Error:**
```
OSError: [Errno 48] Address already in use
```

**Solution:**
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or use different port
uvicorn app.main:app --port 8001
```

---

### 7. Migration Failed
**Error:**
```
sqlalchemy.exc.ProgrammingError: relation "users" does not exist
```

**Solution:**
```bash
cd backend

# Drop all tables and recreate
python migrate.py

# Seed demo data
python seed_demo_data.py
```

**For production (preserve data):**
```bash
# Use Alembic for migrations
alembic revision --autogenerate -m "Add new column"
alembic upgrade head
```

---

## Frontend Issues

### 1. Module Not Found
**Error:**
```
Module not found: Can't resolve 'next'
```

**Solution:**
```bash
cd dashboard
npm install
```

**Clean install:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### 2. Hydration Error
**Error:**
```
Error: Hydration failed because the initial UI does not match
```

**Causes:**
- Server-rendered HTML differs from client
- Using `window` or `document` during SSR
- Date/time rendering differences

**Solution:**
```tsx
// Use client-side only rendering
"use client";

// Or check if window exists
if (typeof window !== 'undefined') {
  // Client-only code
}

// For dates, ensure consistent formatting
const date = new Date(dateString).toISOString();
```

---

### 3. API Connection Failed
**Error:**
```
Failed to fetch
```

**Solutions:**

**Check backend is running:**
```bash
curl http://localhost:8000/health
```

**Verify NEXT_PUBLIC_API_URL:**
```bash
# dashboard/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Check browser console for exact error**

**Common fixes:**
- Backend not running
- Wrong API URL
- CORS not configured
- Firewall blocking connection

---

### 4. Build Failed
**Error:**
```
Type error: Property 'user' does not exist
```

**Solution:**
```bash
# Check TypeScript errors
cd dashboard
npm run build

# Fix type issues (usually null checks needed)
const userName = user?.name || 'Unknown';
```

---

### 5. Blank Page After Login
**Causes:**
- JavaScript error (check console)
- Token not saved
- Redirect not working

**Solutions:**

**Check localStorage:**
```javascript
// Browser console
localStorage.getItem('auth_token')
```

**Check for errors:**
```
F12 → Console tab
```

**Force reload:**
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

---

## WhatsApp Integration Issues

### 1. Webhook Not Receiving Messages
**Check webhook URL:**
```bash
# Should be publicly accessible
curl https://your-ngrok-url.ngrok-free.app/webhook/whatsapp
```

**Verify webhook in Meta dashboard:**
- Go to Meta Developer Console
- App → WhatsApp → Configuration
- Check Webhook URL matches ngrok
- Verify token matches WHATSAPP_VERIFY_TOKEN

**Test webhook:**
```bash
curl "http://localhost:8000/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=leaveflow-verify&hub.challenge=test123"

# Should return: test123
```

---

### 2. Messages Not Sending
**Error:**
```
Failed to send WhatsApp message
```

**Solutions:**

**Check token:**
```bash
# backend/.env
WHATSAPP_TOKEN=your_actual_token_from_meta
```

**Verify phone number format:**
```
# Correct
+918500454345

# Wrong
8500454345 (missing country code)
```

**Check Meta Business account:**
- Phone number verified
- WhatsApp Business API enabled
- Not rate-limited

---

### 3. Test Mode Restrictions
**Error:**
```
Recipient phone number not allowed
```

**Cause:**
- WhatsApp in test mode
- Can only send to approved numbers

**Solutions:**
- Add recipient in Meta dashboard
- Or submit for App Review (production access)

**Add test number:**
1. Meta Developer Console
2. Your App → WhatsApp → API Setup
3. "To" field → Add recipient phone

---

### 4. AI Not Understanding Messages
**Issue:**
- Bot gives generic error
- Doesn't parse leave requests

**Solutions:**

**Check AI service:**
```bash
cd backend
python test_ai.py
```

**Verify OpenRouter API key:**
```bash
# backend/.env
OPENROUTER_API_KEY=your_key
```

**Test with clear format:**
```
Apply 2 days casual leave from 2024-12-15
```

**Check logs:**
```bash
# Backend terminal shows AI processing
```

---

## Database Issues

### 1. Database Doesn't Exist
**Error:**
```
database "leaveflow" does not exist
```

**Solution:**
```bash
# Create database
createdb leaveflow

# Or using psql
psql -U postgres
CREATE DATABASE leaveflow;
\q
```

---

### 2. Permission Denied
**Error:**
```
permission denied for table users
```

**Solution:**
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE leaveflow TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

---

### 3. Connection Pool Exhausted
**Error:**
```
TimeoutError: QueuePool limit exceeded
```

**Solution:**
```python
# backend/app/database.py
# Increase pool size
engine = create_async_engine(
    settings.database_url,
    pool_size=20,  # Default is 5
    max_overflow=40,  # Default is 10
)
```

---

## Deployment Issues

### 1. Render Build Failed
**Error:**
```
error: failed to compile `pydantic-core`
```

**Solution:**
```bash
# Update requirements.txt
pydantic==2.10.3  # Uses pre-built wheels
```

---

### 2. Railway Healthcheck Failed
**Issue:**
- Deployment times out
- Health endpoint not responding

**Solution:**
```python
# backend/app/main.py
@app.get("/health")
async def health():
    try:
        # Check database
        async with AsyncSession(engine) as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ok", "healthy": True}
    except Exception as e:
        # Always return 200 (for deployment)
        return {"status": "ok", "healthy": True, "note": "Minimal check"}
```

---

### 3. Environment Variables Not Loading
**Issue:**
- App works locally, fails in production

**Solution:**

**Render/Railway:**
1. Dashboard → Environment Variables
2. Add all variables from `.env`
3. Restart service

**Vercel (frontend):**
1. Project Settings → Environment Variables
2. Add `NEXT_PUBLIC_API_URL`
3. Redeploy

---

### 4. Database URL Format
**Error:**
```
No module named 'asyncpg'
```

**Cause:**
- Render gives `postgres://...`
- asyncpg needs `postgresql+asyncpg://...`

**Solution:**
```python
# backend/app/database.py
url = settings.database_url.replace("postgres://", "postgresql+asyncpg://")
```

---

## Testing Issues

### 1. Tests Not Found
**Error:**
```
collected 0 items
```

**Solution:**
```bash
cd backend
pytest tests/ -v

# Or specify file
pytest tests/test_api.py -v
```

---

### 2. Fixtures Not Working
**Error:**
```
fixture 'client' not found
```

**Solution:**
```bash
# Install test dependencies
pip install -r tests/requirements-test.txt

# Ensure conftest.py exists
ls tests/conftest.py
```

---

## Performance Issues

### 1. Slow API Responses
**Diagnose:**
```python
# Add timing middleware (backend/app/main.py)
import time

@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

**Common causes:**
- N+1 queries (add eager loading)
- Missing database indexes
- Large payload (add pagination)

---

### 2. Frontend Slow Loading
**Solutions:**

**Enable caching:**
```typescript
// dashboard/app/lib/api.ts
const response = await fetch(url, {
  cache: 'force-cache',
  next: { revalidate: 60 } // Revalidate every 60s
});
```

**Add loading states:**
```tsx
{loading ? <Spinner /> : <Content />}
```

**Optimize images:**
```tsx
import Image from 'next/image';

<Image 
  src="/logo.png"
  width={100}
  height={100}
  loading="lazy"
/>
```

---

## Security Issues

### 1. XSS Vulnerability
**Prevention:**
```tsx
// React automatically escapes
<div>{userInput}</div>  // Safe

// Dangerous (avoid)
<div dangerouslySetInnerHTML={{__html: userInput}} />
```

---

### 2. SQL Injection
**Prevention:**
```python
# Use parameterized queries (SQLAlchemy)
session.execute(
    select(User).where(User.email == email)  # Safe
)

# Dangerous (avoid)
session.execute(f"SELECT * FROM users WHERE email = '{email}'")
```

---

## Getting Help

### Check Logs
**Backend:**
```bash
# Terminal shows all logs
# Look for ERROR or WARNING
```

**Frontend:**
```
F12 → Console tab
F12 → Network tab (for API calls)
```

### Enable Debug Mode
**Backend:**
```bash
# backend/.env
LOG_LEVEL=DEBUG
```

**Frontend:**
```bash
# dashboard/.env.local
NEXT_PUBLIC_DEBUG=true
```

### Test in Isolation
```bash
# Test backend only
cd backend
python test_ai.py

# Test frontend only (mock API)
cd dashboard
npm run dev
```

---

## Quick Diagnostic Script

```bash
#!/bin/bash
echo "🔍 LeaveFlow Diagnostic Check"
echo ""

# Backend
echo "1️⃣ Backend Health:"
curl -s http://localhost:8000/health | jq || echo "❌ Backend not running"
echo ""

# Frontend
echo "2️⃣ Frontend:"
curl -s -I http://localhost:3000 | grep "200 OK" && echo "✅ Frontend running" || echo "❌ Frontend not running"
echo ""

# Database
echo "3️⃣ Database:"
psql -U postgres -d leaveflow -c "SELECT COUNT(*) FROM users;" 2>/dev/null && echo "✅ Database connected" || echo "❌ Database connection failed"
echo ""

# Environment
echo "4️⃣ Environment:"
test -f backend/.env && echo "✅ Backend .env exists" || echo "❌ Backend .env missing"
test -f dashboard/.env.local && echo "✅ Frontend .env exists" || echo "❌ Frontend .env missing"
echo ""

echo "Diagnostic complete!"
```

---

## Still Stuck?

1. **Check error logs** - Most issues show clear error messages
2. **Read error carefully** - Often tells you exactly what's wrong
3. **Test one thing at a time** - Isolate the problem
4. **Check recent changes** - What did you change last?
5. **Google the error** - Someone has likely seen it before

**Emergency reset:**
```bash
# Backend
cd backend
rm -rf __pycache__
pip install -r requirements.txt
python migrate.py

# Frontend
cd dashboard
rm -rf .next node_modules
npm install
```

---

**For critical issues:** Check `TESTING_GUIDE.md` for complete test procedures.
