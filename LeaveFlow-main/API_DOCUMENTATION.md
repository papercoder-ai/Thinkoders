# LeaveFlow API Documentation

## Base URL
```
Local: http://localhost:8000
Production: https://your-app.vercel.app
```

## Authentication
Most endpoints require JWT authentication:
```bash
Authorization: Bearer <token>
```

Get token from `/auth/login` endpoint.

---

## 📋 Table of Contents
1. [Authentication](#authentication-endpoints)
2. [Users](#user-endpoints)
3. [Leave Requests](#leave-request-endpoints)
4. [Holidays](#holiday-endpoints)
5. [Dashboard](#dashboard-endpoints)
6. [WhatsApp Webhook](#whatsapp-webhook)

---

## Authentication Endpoints

### POST /auth/login
Login and get access token.

**Request:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@leaveflow.com&password=admin123"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors:**
- `401`: Invalid credentials
- `403`: Dashboard access restricted (worker role)

---

### POST /auth/signup
Create new user account.

**Request:**
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "8500454345",
    "email": "john@example.com",
    "password": "secure123",
    "role": "worker"
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "phone": "+918500454345",
  "email": "john@example.com",
  "role": "worker",
  "created_at": "2024-12-10T10:30:00"
}
```

**Notes:**
- Phone auto-adds +91 if missing
- Roles: `worker`, `manager`, `hr`, `admin`
- Password hashed before storage

---

### GET /auth/me
Get current user info.

**Request:**
```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "id": 1,
  "name": "Admin User",
  "phone": "+918500454345",
  "email": "admin@leaveflow.com",
  "role": "admin",
  "manager_id": null,
  "created_at": "2024-12-01T00:00:00"
}
```

---

## User Endpoints

### GET /users/
Get all users (HR/Admin only).

**Request:**
```bash
curl -X GET http://localhost:8000/users/ \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Admin User",
    "phone": "+918500454345",
    "email": "admin@leaveflow.com",
    "role": "admin",
    "manager_id": null,
    "created_at": "2024-12-01T00:00:00"
  },
  {
    "id": 2,
    "name": "Worker User",
    "phone": "+918500454346",
    "email": "worker@leaveflow.com",
    "role": "worker",
    "manager_id": 3,
    "created_at": "2024-12-02T00:00:00"
  }
]
```

**Notes:**
- HR doesn't see admin users
- Admin sees all users

---

### GET /users/{id}
Get specific user details.

**Request:**
```bash
curl -X GET http://localhost:8000/users/1 \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "id": 1,
  "name": "Admin User",
  "phone": "+918500454345",
  "email": "admin@leaveflow.com",
  "role": "admin",
  "manager_id": null,
  "created_at": "2024-12-01T00:00:00",
  "leave_balance": {
    "casual": 10,
    "sick": 7,
    "special": 3
  },
  "leave_requests": [
    {
      "id": 1,
      "start_date": "2024-12-15",
      "end_date": "2024-12-16",
      "days": 2,
      "leave_type": "casual",
      "status": "approved"
    }
  ]
}
```

---

### PUT /users/{id}
Update user (self only, unless HR/Admin).

**Request:**
```bash
curl -X PUT http://localhost:8000/users/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "email": "new@example.com",
    "phone": "9876543210"
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "Updated Name",
  "phone": "+919876543210",
  "email": "new@example.com",
  "role": "worker",
  "manager_id": null,
  "created_at": "2024-12-01T00:00:00"
}
```

**Errors:**
- `403`: Cannot edit other users (unless HR/Admin)

---

### PUT /users/{id}/admin
Update user (HR/Admin only) - allows role and manager changes.

**Request:**
```bash
curl -X PUT http://localhost:8000/users/1/admin \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "manager_id": 3,
    "role": "manager"
  }'
```

**Response:**
```json
{
  "id": 1,
  "name": "User Name",
  "phone": "+918500454345",
  "email": "user@example.com",
  "role": "manager",
  "manager_id": 3,
  "created_at": "2024-12-01T00:00:00"
}
```

**Notes:**
- Only HR/Admin can use this endpoint
- Can update role and manager_id

---

### DELETE /users/{id}
Delete user (Admin only).

**Request:**
```bash
curl -X DELETE http://localhost:8000/users/1 \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

---

## Leave Request Endpoints

### GET /leave/requests
Get all leave requests (filtered by role).

**Request:**
```bash
curl -X GET http://localhost:8000/leave/requests \
  -H "Authorization: Bearer <token>"
```

**Query Parameters:**
- `status`: Filter by status (`pending`, `approved`, `rejected`, `cancelled`)
- `user_id`: Filter by user ID
- `start_date`: Filter by start date (YYYY-MM-DD)
- `end_date`: Filter by end date (YYYY-MM-DD)

**Example:**
```bash
curl -X GET "http://localhost:8000/leave/requests?status=pending&start_date=2024-12-01" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 2,
    "start_date": "2024-12-15",
    "end_date": "2024-12-16",
    "days": 2,
    "leave_type": "casual",
    "duration_type": "full",
    "reason": "Family function",
    "status": "pending",
    "rejection_reason": null,
    "approved_by": null,
    "approved_at": null,
    "created_at": "2024-12-10T10:00:00",
    "user": {
      "id": 2,
      "name": "Worker User",
      "email": "worker@example.com"
    }
  }
]
```

**Notes:**
- Workers see only their requests
- Managers see their team's requests
- HR/Admin see all requests

---

### GET /leave/requests/{id}
Get specific leave request.

**Request:**
```bash
curl -X GET http://localhost:8000/leave/requests/1 \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "id": 1,
  "user_id": 2,
  "start_date": "2024-12-15",
  "end_date": "2024-12-16",
  "days": 2,
  "leave_type": "casual",
  "duration_type": "full",
  "reason": "Family function",
  "status": "pending",
  "rejection_reason": null,
  "approved_by": null,
  "approved_at": null,
  "created_at": "2024-12-10T10:00:00",
  "user": {
    "id": 2,
    "name": "Worker User",
    "email": "worker@example.com"
  },
  "attachments": [
    {
      "id": 1,
      "file_url": "https://example.com/file.pdf",
      "file_type": "application/pdf",
      "uploaded_at": "2024-12-10T10:00:00"
    }
  ]
}
```

---

### POST /leave/requests
Create new leave request.

**Request:**
```bash
curl -X POST http://localhost:8000/leave/requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-12-15",
    "end_date": "2024-12-16",
    "leave_type": "casual",
    "duration_type": "full",
    "reason": "Personal work"
  }'
```

**Response:**
```json
{
  "id": 1,
  "user_id": 2,
  "start_date": "2024-12-15",
  "end_date": "2024-12-16",
  "days": 2,
  "leave_type": "casual",
  "duration_type": "full",
  "reason": "Personal work",
  "status": "pending",
  "created_at": "2024-12-10T10:00:00"
}
```

**Fields:**
- `start_date`: YYYY-MM-DD format
- `end_date`: YYYY-MM-DD format
- `leave_type`: `casual`, `sick`, `special`
- `duration_type`: `full`, `half_morning`, `half_afternoon`
- `reason`: Optional string

**Errors:**
- `400`: Insufficient leave balance
- `400`: Invalid date range
- `400`: Overlapping leaves

---

### PUT /leave/requests/{id}
Update leave request status (Manager/HR/Admin only).

**Request:**
```bash
curl -X PUT http://localhost:8000/leave/requests/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'
```

**Reject with reason:**
```bash
curl -X PUT http://localhost:8000/leave/requests/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "rejection_reason": "Insufficient documentation"
  }'
```

**Response:**
```json
{
  "id": 1,
  "user_id": 2,
  "start_date": "2024-12-15",
  "end_date": "2024-12-16",
  "days": 2,
  "leave_type": "casual",
  "duration_type": "full",
  "reason": "Personal work",
  "status": "approved",
  "approved_by": 3,
  "approved_at": "2024-12-10T11:00:00",
  "created_at": "2024-12-10T10:00:00"
}
```

**Notes:**
- Manager gets WhatsApp notification on creation
- Employee gets notification on approval/rejection

---

### DELETE /leave/requests/{id}
Cancel leave request (own requests only).

**Request:**
```bash
curl -X DELETE http://localhost:8000/leave/requests/1 \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "message": "Leave request cancelled"
}
```

**Errors:**
- `400`: Cannot cancel approved/rejected requests
- `403`: Cannot cancel others' requests

---

## Holiday Endpoints

### GET /holidays/
Get all holidays.

**Request:**
```bash
curl -X GET http://localhost:8000/holidays/ \
  -H "Authorization: Bearer <token>"
```

**Query Parameters:**
- `year`: Filter by year (default: current year)

**Example:**
```bash
curl -X GET "http://localhost:8000/holidays/?year=2024" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
[
  {
    "id": 1,
    "date": "2024-12-25",
    "name": "Christmas",
    "description": "Christmas Day"
  },
  {
    "id": 2,
    "date": "2024-01-01",
    "name": "New Year",
    "description": "New Year's Day"
  }
]
```

---

### POST /holidays/
Create holiday (HR/Admin only).

**Request:**
```bash
curl -X POST http://localhost:8000/holidays/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-12-25",
    "name": "Christmas",
    "description": "Christmas Day"
  }'
```

**Response:**
```json
{
  "id": 1,
  "date": "2024-12-25",
  "name": "Christmas",
  "description": "Christmas Day"
}
```

---

### PUT /holidays/{id}
Update holiday (HR/Admin only).

**Request:**
```bash
curl -X PUT http://localhost:8000/holidays/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Christmas Day",
    "description": "Updated description"
  }'
```

---

### DELETE /holidays/{id}
Delete holiday (HR/Admin only).

**Request:**
```bash
curl -X DELETE http://localhost:8000/holidays/1 \
  -H "Authorization: Bearer <token>"
```

---

## Dashboard Endpoints

### GET /dashboard/stats
Get dashboard statistics (Manager/HR/Admin).

**Request:**
```bash
curl -X GET http://localhost:8000/dashboard/stats \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "pending_count": 5,
  "approved_today": 2,
  "rejected_today": 1,
  "on_leave_today": [
    {
      "id": 2,
      "name": "Worker User",
      "email": "worker@example.com"
    }
  ]
}
```

---

## WhatsApp Webhook

### GET /webhook/whatsapp
Webhook verification (Meta requirement).

**Request:**
```bash
curl "http://localhost:8000/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=leaveflow-verify&hub.challenge=test123"
```

**Response:**
```
test123
```

---

### POST /webhook/whatsapp
Receive WhatsApp messages.

**Request** (from Meta):
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "918500454345",
          "text": {
            "body": "Apply 2 days casual leave from tomorrow"
          }
        }]
      }
    }]
  }]
}
```

**Response:**
```json
{
  "status": "ok"
}
```

**Supported Commands:**

#### Apply Leave
```
Apply 2 days sick leave from tomorrow
Need 3 days casual leave from 15th Dec
```

#### Check Balance
```
balance
check balance
my leave balance
```

#### Check Status
```
status 123
check status of request 123
```

#### Cancel Request
```
cancel 123
cancel request 123
```

#### Manager - View Pending
```
pending
show pending requests
```

#### Manager - Approve/Reject
```
approve 123
reject 123 Not eligible
```

---

## Error Responses

### Validation Error (422)
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "detail": "Could not validate credentials"
}
```

### Forbidden (403)
```json
{
  "detail": "Not authorized to perform this action"
}
```

### Not Found (404)
```json
{
  "detail": "User not found"
}
```

### Server Error (500)
```json
{
  "detail": "Internal server error"
}
```

### Service Unavailable (503)
```json
{
  "detail": "Database connection failed. Please try again."
}
```

---

## Rate Limiting
- No rate limiting currently implemented
- Consider adding for production (e.g., slowapi)

---

## Example: Complete Leave Request Flow

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=worker@leaveflow.com&password=worker123" | jq -r '.access_token')

# 2. Check balance
curl -s -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq '.leave_balance'

# 3. Create request
REQUEST_ID=$(curl -s -X POST http://localhost:8000/leave/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-12-15",
    "end_date": "2024-12-16",
    "leave_type": "casual",
    "duration_type": "full",
    "reason": "Personal"
  }' | jq -r '.id')

echo "Created request: $REQUEST_ID"

# 4. Check status
curl -s -X GET http://localhost:8000/leave/requests/$REQUEST_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.status'
```

---

## Postman Collection
Import this JSON for quick testing:

```json
{
  "info": {
    "name": "LeaveFlow API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "urlencoded",
              "urlencoded": [
                {"key": "username", "value": "admin@leaveflow.com"},
                {"key": "password", "value": "admin123"}
              ]
            },
            "url": "{{base_url}}/auth/login"
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000"
    }
  ]
}
```

---

For interactive API docs, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
