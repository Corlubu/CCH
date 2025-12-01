# SQL Sequence for Administrator and Staff User Login

## Overview

This document describes the database operations executed when an administrator or staff user logs into the system. The application uses **Prisma ORM** with **PostgreSQL** as the database engine.

## Database Schema

### User Table Structure

```sql
CREATE TABLE "User" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT,
  "phoneNumber" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'CITIZEN');

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE INDEX "User_username_idx" ON "User"("username");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");
```

## Login Process SQL Sequence

### Step 1: User Lookup by Username

**Prisma Query:**
```typescript
const user = await db.user.findUnique({
  where: { username: input.username },
});
```

**Generated SQL:**
```sql
SELECT 
  "id",
  "username",
  "passwordHash",
  "role",
  "fullName",
  "email",
  "phoneNumber",
  "isActive",
  "createdAt"
FROM "User"
WHERE "username" = $1
LIMIT 1;
```

**Parameters:**
- `$1`: The username provided in the login form (e.g., 'admin', 'staff_user')

**Index Used:**
- `User_username_key` (UNIQUE index) - Provides O(log n) lookup performance

**Query Purpose:**
- Retrieves the complete user record for authentication
- Returns `passwordHash` for password verification
- Returns `role` to determine user permissions (ADMIN, STAFF, or CITIZEN)
- Returns user profile data for the session

**Possible Outcomes:**
1. **User Found**: Returns user object with all fields
2. **User Not Found**: Returns `null`, triggers UNAUTHORIZED error

---

### Step 2: Password Verification (Application Layer)

**Process:**
```typescript
const isValidPassword = await bcryptjs.compare(
  input.password,
  user.passwordHash
);
```

**Note:** This step does NOT involve SQL. The password verification happens in the application layer using bcryptjs:
- Compares the plain-text password from the login form
- Against the bcrypt hash stored in `user.passwordHash`
- Uses bcrypt's built-in salt and hashing algorithm

**Possible Outcomes:**
1. **Password Valid**: Proceeds to token generation
2. **Password Invalid**: Throws UNAUTHORIZED error

---

### Step 3: JWT Token Generation (Application Layer)

**Process:**
```typescript
const token = jwt.sign(
  {
    userId: user.id,
    role: user.role,        // 'ADMIN' or 'STAFF'
    username: user.username,
  },
  env.JWT_SECRET,
  { expiresIn: "24h" }
);
```

**Note:** This step does NOT involve SQL. The JWT token is generated in memory and contains:
- `userId`: Database ID for the user
- `role`: User's role (ADMIN, STAFF, or CITIZEN) - used for authorization
- `username`: Username for display purposes
- Expiration: 24 hours from generation

---

## Complete SQL Transaction Log

For a successful administrator or staff login, the complete database interaction is:

```sql
-- Transaction Start (Implicit in Prisma)
BEGIN;

-- Query 1: Find user by username
SELECT 
  "id",
  "username",
  "passwordHash",
  "role",
  "fullName",
  "email",
  "phoneNumber",
  "isActive",
  "createdAt"
FROM "User"
WHERE "username" = 'admin_username'
LIMIT 1;

-- Transaction End
COMMIT;
```

**Total Database Queries:** 1 SELECT query

**No Write Operations:** The login process is read-only; no INSERT, UPDATE, or DELETE operations occur.

---

## Performance Characteristics

### Query Performance
- **Index Usage**: The query uses the `User_username_key` unique index
- **Time Complexity**: O(log n) for username lookup
- **Expected Response Time**: < 5ms for typical database sizes

### Database Load
- **Read Operations**: 1 per login attempt
- **Write Operations**: 0
- **Connection Pool**: Uses single connection from pool
- **Transaction Overhead**: Minimal (single SELECT query)

---

## Security Considerations

### What is Stored in Database
- ✅ **Password Hash**: bcrypt hash with salt (secure)
- ✅ **Username**: Plain text (indexed for lookup)
- ✅ **Role**: Enum value (ADMIN, STAFF, CITIZEN)

### What is NOT Stored in Database
- ❌ **Plain-text Password**: Never stored
- ❌ **JWT Token**: Generated on-demand, not persisted
- ❌ **Session Data**: Stateless JWT authentication

### Authentication Flow Security
1. **Password Verification**: Uses bcryptjs with automatic salt handling
2. **Role-Based Access**: Role is embedded in JWT for authorization checks
3. **Token Expiration**: 24-hour expiration enforces re-authentication
4. **No Session Table**: Stateless design prevents session fixation attacks

---

## Distinguishing Admin vs Staff Login

The SQL query itself is **identical** for both administrator and staff users. The distinction is made by the `role` field in the returned data:

```sql
-- Admin user result:
-- role = 'ADMIN'

-- Staff user result:
-- role = 'STAFF'
```

The `role` value is then:
1. Embedded in the JWT token payload
2. Used by the frontend to determine UI/UX (which pages to show)
3. Used by backend procedures to enforce authorization rules

---

## Error Scenarios and SQL Impact

### Scenario 1: Invalid Username
```sql
-- Query executes normally
SELECT ... FROM "User" WHERE "username" = 'nonexistent_user' LIMIT 1;
-- Returns: 0 rows
-- Application Response: UNAUTHORIZED error (does not reveal if username exists)
```

### Scenario 2: Invalid Password
```sql
-- Query executes normally and returns user
SELECT ... FROM "User" WHERE "username" = 'valid_user' LIMIT 1;
-- Returns: 1 row with passwordHash
-- Application verifies password in-memory
-- Application Response: UNAUTHORIZED error (same message as invalid username)
```

### Scenario 3: Inactive User Account
```sql
-- Query executes normally
SELECT ... FROM "User" WHERE "username" = 'inactive_user' LIMIT 1;
-- Returns: 1 row with isActive = false
-- Note: Current implementation does NOT check isActive during login
-- The user can still log in even if isActive = false
```

---

## Database Connection Details

### Connection String
```
postgresql://postgres:postgres@postgres/app
```

### Connection Pool
- Managed by Prisma Client
- Default pool size: 10 connections
- Connection timeout: 10 seconds

---

## Monitoring and Logging

### SQL Query Logging
To enable Prisma query logging, set in `src/server/db.ts`:
```typescript
const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### Expected Log Output for Login
```
prisma:query SELECT "id", "username", "passwordHash", "role", "fullName", "email", "phoneNumber", "isActive", "createdAt" FROM "User" WHERE "username" = $1 LIMIT 1
```

---

## Related Files

- **Schema Definition**: `prisma/schema.prisma`
- **Login Procedure**: `src/server/trpc/procedures/login.ts`
- **Database Client**: `src/server/db.ts`
- **Environment Config**: `src/server/env.ts`

---

## Summary

The SQL sequence for administrator and staff user login consists of:

1. **Single SELECT Query**: Lookup user by username
2. **Application-Layer Password Check**: bcryptjs comparison (no SQL)
3. **Application-Layer Token Generation**: JWT signing (no SQL)

**Total Database Operations: 1 read query**

The login process is efficient, secure, and stateless, relying on JWT tokens for session management rather than database-backed sessions.
