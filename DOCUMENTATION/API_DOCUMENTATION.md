# RiskVision API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Health Check
- `GET /health` - Check API health status
- `GET /api-info` - Get API information

## Authentication Endpoints

### Login
```
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt_token_here"
}
```

### Get Current User
```
GET /api/users/me
Authorization: Bearer <token>

Response:
{
  "_id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "admin"
}
```

### Register User (Admin Only)
```
POST /api/users/register
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "compliance"
}
```

### Get All Users (Admin Only)
```
GET /api/users
Authorization: Bearer <admin_token>
```

### Update User Role (Admin Only)
```
PUT /api/users/:id/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "investigator"
}
```

## Transaction Endpoints

### Add Transaction
```
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 5000,
  "country": "United States"
}

Response:
{
  "transaction": { ... },
  "alertGenerated": true,
  "alert": { ... }
}
```

### Get All Transactions
```
GET /api/transactions
Authorization: Bearer <token>

Query Parameters:
- page: number (default: 1)
- limit: number (default: 50)
- sort: string (default: "-timestamp")
```

### Get Transactions by User
```
GET /api/transactions/user/:userId
Authorization: Bearer <token>
```

### Get Transaction Statistics
```
GET /api/transactions/stats
Authorization: Bearer <token>

Response:
{
  "totalTransactions": 150,
  "totalAmount": 2500000,
  "avgAmount": 16666.67,
  "maxAmount": 50000,
  "minAmount": 10,
  "recentTransactions24h": 25,
  "connectedUsers": 3
}
```

## Alert Endpoints

### Get All Alerts
```
GET /api/alerts
Authorization: Bearer <token>

Query Parameters:
- resolved: boolean (filter by resolution status)
- riskScore: number (filter by minimum risk score)
```

### Get Alert by ID
```
GET /api/alerts/:id
Authorization: Bearer <token>
```

### Resolve Alert (Compliance/Admin)
```
PUT /api/alerts/:id/resolve
Authorization: Bearer <token>
```

### Get Alert Statistics
```
GET /api/alerts/stats
Authorization: Bearer <token>

Response:
{
  "totalAlerts": 45,
  "resolvedAlerts": 30,
  "unresolvedAlerts": 15,
  "avgRiskScore": 75.5,
  "maxRiskScore": 95,
  "recentAlerts24h": 8
}
```

### Delete Alert (Admin Only)
```
DELETE /api/alerts/:id
Authorization: Bearer <admin_token>
```

## Case Endpoints

### Create Case (Compliance/Admin)
```
POST /api/cases
Authorization: Bearer <token>
Content-Type: application/json

{
  "alertId": "alert_id_here",
  "description": "Suspicious transaction pattern detected"
}
```

### Get All Cases
```
GET /api/cases
Authorization: Bearer <token>
```

### Get Case by ID
```
GET /api/cases/:id
Authorization: Bearer <token>
```

### Assign Investigator (Compliance/Admin)
```
PUT /api/cases/:id/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "investigatorId": "investigator_user_id"
}
```

### Update Case Status (Investigator/Admin)
```
PUT /api/cases/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "investigating"
}
```

### Add Comment (Investigator/Admin)
```
POST /api/cases/:id/comment
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Found suspicious pattern in transaction history"
}
```

### Upload Evidence (Investigator/Admin)
```
POST /api/cases/:id/evidence
Authorization: Bearer <token>
Content-Type: application/json

{
  "filename": "evidence.pdf",
  "fileUrl": "https://storage.example.com/evidence.pdf"
}
```

### Close Case (Compliance/Admin)
```
PUT /api/cases/:id/close
Authorization: Bearer <token>
```

## Log Endpoints (Admin/Auditor)

### Get All Logs
```
GET /api/logs
Authorization: Bearer <token>

Query Parameters:
- startDate: ISO date string
- endDate: ISO date string
- action: string (filter by action type)
- userId: string (filter by user)
```

### Filter Logs
```
GET /api/logs/filter
Authorization: Bearer <token>

Query Parameters:
- startDate: ISO date string
- endDate: ISO date string
- action: string
- userId: string
- level: string (info, warning, error)
```

### Export Logs
```
GET /api/logs/export
Authorization: Bearer <token>

Query Parameters:
- format: string (json, csv)
- startDate: ISO date string
- endDate: ISO date string
```

## Rule Endpoints (Admin Only)

### Create Rule
```
POST /api/rules
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "High Amount Rule",
  "description": "Alert on transactions over $10,000",
  "condition": "amount > 10000",
  "riskScore": 80,
  "enabled": true
}
```

### Get All Rules
```
GET /api/rules
Authorization: Bearer <admin_token>
```

### Update Rule
```
PUT /api/rules/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "enabled": false
}
```

### Delete Rule
```
DELETE /api/rules/:id
Authorization: Bearer <admin_token>
```

## WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:5000');

// Authenticate
socket.emit('authenticate', { 
  userId: 'user_id', 
  userRole: 'admin' 
});

// Subscribe to streams
socket.emit('subscribe-transactions');
socket.emit('subscribe-alerts');
socket.emit('subscribe-cases');
```

### Listen for Events
```javascript
// New transaction
socket.on('new-transaction', (data) => {
  console.log('New transaction:', data);
});

// New alert
socket.on('new-alert', (data) => {
  console.log('New alert:', data);
});

// Case update
socket.on('case-update', (data) => {
  console.log('Case updated:', data);
});

// System message
socket.on('system-message', (data) => {
  console.log('System message:', data);
});
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": ["field1 error", "field2 error"] // for validation errors
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Role Permissions

| Endpoint | Admin | Compliance | Investigator | Auditor |
|----------|-------|------------|--------------|---------|
| User Management | ✅ | ❌ | ❌ | ❌ |
| Transactions | ✅ | ✅ | ✅ | ✅ |
| Alerts | ✅ | ✅ | ❌ | ❌ |
| Cases | ✅ | ✅ | ✅ | ❌ |
| Logs | ✅ | ❌ | ❌ | ✅ |
| Rules | ✅ | ❌ | ❌ | ❌ |

## Rate Limiting

Currently no rate limiting implemented. Consider implementing for production.

## CORS

CORS is enabled for all origins in development. Configure appropriately for production. 