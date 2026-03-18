# LX Management Platform - API Documentation

## Overview

RESTful API for the LX Management Platform. All endpoints require authentication unless specified.

**Base URL:** `http://localhost:3000/api` (development)

---

## Authentication

### Login
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "admin@lxos.edu",
  "password": "admin123"
}
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@lxos.edu",
    "role": "ADMIN"
  }
}
```

---

## Events

### List Events
```http
GET /api/events?type=CLUB&status=APPROVED
```

**Query Parameters:**
- `type` (optional): CLUB | CLAN | LX
- `status` (optional): PENDING | APPROVED | REJECTED | COMPLETED
- `clubId` (optional): Filter by club ID

**Response:**
```json
[
  {
    "_id": "...",
    "title": "Tech Fest 2024",
    "type": "CLUB",
    "status": "APPROVED",
    "startDate": "2024-03-15T10:00:00Z",
    "endDate": "2024-03-15T18:00:00Z",
    "budgetAllocated": 50000,
    "budgetSpent": 25000,
    "clubId": { "_id": "...", "name": "Tech Club" },
    "requirements": [...]
  }
]
```

### Create Event
```http
POST /api/events
Content-Type: application/json

{
  "title": "Annual Hackathon",
  "description": "24-hour coding competition",
  "type": "CLUB",
  "clubId": "...",
  "startDate": "2024-04-01T09:00:00Z",
  "endDate": "2024-04-02T09:00:00Z",
  "roomId": "...",
  "budgetAllocated": 100000,
  "attendees": 150,
  "requirements": [
    {
      "item": "Laptops",
      "quantity": 50,
      "estimatedCost": 25000
    }
  ]
}
```

**Permissions:** Admin, LX Team, Club Head

### Get Event
```http
GET /api/events/:id
```

### Update Event
```http
PATCH /api/events/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "budgetAllocated": 120000
}
```

**Permissions:** Admin, LX Team, Creator (if not approved)

### Delete Event
```http
DELETE /api/events/:id
```

**Permissions:** Admin only

### Approve/Reject Event
```http
POST /api/events/:id/approve
Content-Type: application/json

{
  "action": "approve" | "reject",
  "rejectionReason": "..." (if rejecting)
}
```

**Permissions:** Admin, LX Team

---

## Expenses

### List Expenses
```http
GET /api/expenses?status=PENDING&eventId=...
```

**Query Parameters:**
- `status` (optional): PENDING | APPROVED | REJECTED
- `eventId` (optional): Filter by event

### Create Expense
```http
POST /api/expenses
Content-Type: application/json

{
  "eventId": "...",
  "title": "Catering Services",
  "description": "Food for 200 attendees",
  "amount": 50000,
  "category": "Food",
  "paidDate": "2024-03-20"
}
```

**Permissions:** Admin, LX Team, Club Head

### Verify Expense
```http
POST /api/expenses/:id/verify
Content-Type: application/json

{
  "action": "approve" | "reject",
  "rejectionReason": "..." (if rejecting)
}
```

**Permissions:** Admin, Finance

**Note:** Approving an expense automatically updates the event's `budgetSpent`.

---

## Achievements

### List Achievements
```http
GET /api/achievements?category=Competition&clubId=...
```

**Query Parameters:**
- `category` (optional): Competition | Award | Recognition | Milestone | Other
- `clubId` (optional): Filter by club
- `clanId` (optional): Filter by clan

### Create Achievement
```http
POST /api/achievements
Content-Type: application/json

{
  "title": "First Place - Hackathon",
  "description": "Won first place in national hackathon",
  "category": "Competition",
  "date": "2024-03-15",
  "eventId": "...",
  "clubId": "...",
  "clanId": "...",
  "pointsAwarded": 100,
  "participants": ["John Doe", "Jane Smith"]
}
```

**Permissions:** Admin, LX Team

**Note:** Creating an achievement with `pointsAwarded` automatically updates the clan's points.

---

## Clubs

### List Clubs
```http
GET /api/clubs
```

### Create Club
```http
POST /api/clubs
Content-Type: application/json

{
  "name": "AI & ML Club",
  "description": "Exploring artificial intelligence",
  "category": "Technical",
  "budgetAllocated": 200000
}
```

**Permissions:** Admin only

### Get Club
```http
GET /api/clubs/:id
```

### Update Club
```http
PATCH /api/clubs/:id
Content-Type: application/json

{
  "budgetAllocated": 250000
}
```

**Permissions:** Admin only

---

## Rooms

### List Rooms
```http
GET /api/rooms
```

### Check Availability
```http
POST /api/rooms/availability
Content-Type: application/json

{
  "roomId": "...",
  "startDate": "2024-04-01T09:00:00Z",
  "endDate": "2024-04-01T18:00:00Z",
  "excludeEventId": "..." (optional, for editing)
}
```

**Response:**
```json
{
  "available": true,
  "room": {
    "_id": "...",
    "name": "Auditorium",
    "capacity": 500
  }
}
```

Or if conflicts exist:
```json
{
  "available": false,
  "conflicts": [
    {
      "_id": "...",
      "title": "Existing Event",
      "startDate": "...",
      "endDate": "..."
    }
  ]
}
```

---

## Analytics

### Get Analytics Data
```http
GET /api/analytics
```

**Response:**
```json
{
  "clubActivity": [...],
  "eventsByType": [...],
  "budgetTrends": [...],
  "clanPerformance": [...],
  "stats": {
    "totalEvents": 45,
    "totalBudget": 5000000,
    "totalExpenses": 2500000,
    "totalAchievements": 23
  }
}
```

---

## Files

### List Files
```http
GET /api/files?eventId=...&tag=report
```

**Query Parameters:**
- `eventId` (optional): Filter by event
- `clubId` (optional): Filter by club
- `tag` (optional): Filter by tag

### Create File Record
```http
POST /api/files
Content-Type: application/json

{
  "fileName": "event-report.pdf",
  "filePath": "/uploads/...",
  "fileType": "application/pdf",
  "fileSize": 1024000,
  "description": "Event summary report",
  "eventId": "...",
  "tags": ["report", "2024"]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "error": "Event not found"
}
```

### 409 Conflict
```json
{
  "error": "Room is not available for the selected time slot",
  "conflicts": [...]
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting in production using packages like `express-rate-limit`.

---

## Webhooks (Future)

Planned webhook support for:
- Event approvals
- Expense verifications
- Budget alerts
- Achievement notifications

---

## Best Practices

1. **Always include authentication** (except public endpoints)
2. **Validate input data** before sending requests
3. **Handle errors gracefully** with try-catch blocks
4. **Use appropriate HTTP methods** (GET, POST, PATCH, DELETE)
5. **Include Content-Type header** for JSON requests
6. **Check permissions** before making requests

---

## Example Usage (JavaScript)

```javascript
// Create an event
const response = await fetch('/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Tech Talk',
    type: 'CLUB',
    clubId: '...',
    startDate: '2024-04-01T14:00:00Z',
    endDate: '2024-04-01T16:00:00Z',
    budgetAllocated: 10000,
  }),
});

const event = await response.json();
console.log('Created event:', event);
```

---

For more details, see the source code in `/app/api/` directory.
