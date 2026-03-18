# RU Data Role Mapping - Implementation Summary

## Overview
Users with `userType: CLUB` in the RU data now automatically receive `CLUB_HEAD` role and all associated permissions.

## How It Works

### 1. **Role Mapping** (`lib/ru-data-mapper.js`)
Maps RU userType values to application roles:
- `CLUB` or `CLUB_HEAD` → `CLUB_HEAD` (full club access)
- `CLAN` or `CLAN_HEAD` → `CLAN_HEAD` (clan management)
- `ADMIN` → `ADMIN` (full system access)
- `FINANCE` → `FINANCE` (budget permissions)
- `LX` or `LX_TEAM` → `LX_TEAM` (event management)
- Other → `GUEST` (limited access)

### 2. **API Endpoints**

#### `/api/ru-users/[email]`
Fetches role from RU data JSON
```
GET /api/ru-users/user@example.com
Response: { role: 'CLUB_HEAD', found: true }
```

#### `/api/users/[email]`
Fetches role from database (fallback if not in RU data)
```
GET /api/users/user@example.com
Response: { role: 'GUEST' }
```

### 3. **Role Assignment Flow**

**First Login (AuthGuard):**
1. User signs in with Clerk
2. AuthGuard checks RU data for their userType
3. Role assigned based on mapping (CLUB → CLUB_HEAD)
4. User created in database with assigned role

**Subsequent Logins:**
1. DashboardSidebar checks RU data first
2. If found in RU data, uses that role
3. Falls back to database role if not in RU data
4. Dynamically loads permissions based on role

### 4. **CLUB_HEAD Permissions**
Users with CLUB userType now have access to:
- ✅ Create events
- ✅ Upload files
- ✅ View all clubs
- ✅ Create achievements
- ✅ Access dashboard/feed/calendar/events
- ✅ Full club management capabilities

## File Changes

| File | Change |
|------|--------|
| `lib/ru-data-mapper.js` | New - Maps RU userType to roles |
| `app/api/ru-users/[email]/route.js` | New - API endpoint for RU role lookup |
| `components/auth-guard.tsx` | Updated - Fetches role from RU data on signup |
| `components/dashboard/sidebar.jsx` | Updated - Checks RU data for role first |

## Testing

To test:
1. Sign up with an email that has `userType: "CLUB"` in the RU data
2. User automatically gets CLUB_HEAD role
3. Dashboard shows club-related permissions/navigation

## Data Source
RU data loaded from: `/all RU data 2 (1).json`

Expected JSON structure:
```json
[
  {
    "email": "user@rishihood.edu.in",
    "userType": "CLUB",
    ...other fields
  }
]
```
