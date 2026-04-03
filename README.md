# Finance Dashboard Backend

A robust backend API for a finance dashboard system built with **Node.js**, **Express**, **TypeScript**, and **PostgreSQL** (hosted on Neon). Features JWT authentication, role-based access control (RBAC), financial records management with full CRUD operations, and dashboard analytics endpoints.

---

## Table of Contents

- [Finance Dashboard Backend](#finance-dashboard-backend)
  - [Table of Contents](#table-of-contents)
  - [Tech Stack](#tech-stack)
  - [Project Structure](#project-structure)
  - [Setup \& Installation](#setup--installation)
    - [Prerequisites](#prerequisites)
    - [Steps](#steps)
    - [Seeded Credentials](#seeded-credentials)
  - [Environment Variables](#environment-variables)
  - [Database Schema](#database-schema)
    - [User](#user)
    - [FinancialRecord](#financialrecord)
  - [API Documentation](#api-documentation)
    - [Health Check](#health-check)
    - [Authentication](#authentication)
      - [Register](#register)
      - [Login](#login)
      - [Get Profile](#get-profile)
    - [User Management](#user-management)
    - [Financial Records](#financial-records)
      - [Create Record](#create-record)
      - [List Records with Filters](#list-records-with-filters)
    - [Dashboard Analytics](#dashboard-analytics)
      - [Summary Response](#summary-response)
      - [Trends Response (monthly)](#trends-response-monthly)
  - [Testing the API](#testing-the-api)
    - [Quick start: Automated smoke test](#quick-start-automated-smoke-test)
    - [Manual testing in Postman](#manual-testing-in-postman)
    - [1. Create Postman environment variables](#1-create-postman-environment-variables)
    - [2. Global request setup](#2-global-request-setup)
    - [3. Authentication tests](#3-authentication-tests)
    - [4. User Management tests (ADMIN only)](#4-user-management-tests-admin-only)
    - [5. Financial Records tests](#5-financial-records-tests)
    - [6. Dashboard tests](#6-dashboard-tests)
    - [7. Access-control negative tests (must fail)](#7-access-control-negative-tests-must-fail)
  - [Role-Based Access Control](#role-based-access-control)
  - [Error Handling](#error-handling)
  - [Design Decisions \& Tradeoffs](#design-decisions--tradeoffs)

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js + Express | Runtime & HTTP framework |
| TypeScript | Type safety & developer experience |
| PostgreSQL (Neon) | Relational database (cloud-hosted) |
| Prisma ORM | Database access & migrations |
| JSON Web Tokens | Stateless authentication |
| Zod | Request validation |
| bcryptjs | Password hashing |
| Helmet | Security HTTP headers |
| express-rate-limit | Rate limiting on auth routes |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database models & enums
│   └── seed.ts                # Seed script (sample users + records)
├── src/
│   ├── index.ts               # Server entry point
│   ├── app.ts                 # Express app configuration
│   ├── config/
│   │   └── env.ts             # Environment variable loading & validation
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication middleware
│   │   ├── rbac.ts            # Role-based access control middleware
│   │   ├── validate.ts        # Zod validation middleware
│   │   └── errorHandler.ts    # Global error handler
│   ├── modules/
│   │   ├── auth/              # Authentication (register, login, profile)
│   │   ├── users/             # User management (CRUD, roles, status)
│   │   ├── records/           # Financial records (CRUD, filters, soft delete)
│   │   └── dashboard/         # Analytics (summary, trends, categories)
│   ├── utils/
│   │   ├── apiError.ts        # Custom error class
│   │   ├── apiResponse.ts     # Standardized response helper
│   │   └── prisma.ts          # Prisma client singleton
│   └── types/
│       └── express.d.ts       # Express type augmentation
├── .env.example               # Environment template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Setup & Installation

### Prerequisites

- **Node.js** v18+ and **npm**
- A **PostgreSQL** database (or a [Neon](https://neon.tech) account)

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and JWT secret
   ```

4. **Set up database & seed data**
   ```bash
   npm run setup
   ```
   This single command handles:
   - `prisma generate` — Generate Prisma client
   - `prisma db push` — Push schema to database
   - `prisma seed` — Seed sample users and records
   
   Or run individually if preferred:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   npm run prisma:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```
   The server starts at `http://localhost:3000`.

### Seeded Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@finance.com` | `admin123` |
| Analyst | `analyst@finance.com` | `analyst123` |
| Viewer | `viewer@finance.com` | `viewer123` |

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | *required* |
| `JWT_SECRET` | Secret key for JWT signing | *required* |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

---

## Database Schema

### User

| Field | Type | Description |
|---|---|---|
| id | `String (cuid)` | Primary key |
| email | `String` | Unique email address |
| password | `String` | Bcrypt hashed password |
| name | `String` | Display name |
| role | `Enum` | VIEWER, ANALYST, or ADMIN |
| status | `Enum` | ACTIVE or INACTIVE |
| createdAt | `DateTime` | Auto-generated |
| updatedAt | `DateTime` | Auto-updated |

### FinancialRecord

| Field | Type | Description |
|---|---|---|
| id | `String (cuid)` | Primary key |
| amount | `Float` | Transaction amount |
| type | `Enum` | INCOME or EXPENSE |
| category | `String` | Category label |
| description | `String?` | Optional notes |
| date | `DateTime` | Transaction date |
| deletedAt | `DateTime?` | Soft delete timestamp |
| userId | `String` | Foreign key → User |

---

## API Documentation

> **Base URL**: `http://localhost:3000/api`

### Health Check

```
GET /api/health
```

Returns server status. No authentication required.

---

### Authentication

#### Register

```
POST /api/auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response** `201`:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "VIEWER", "status": "ACTIVE" },
    "token": "eyJhbGciOi..."
  }
}
```

#### Login

```
POST /api/auth/login
```

**Body:**
```json
{
  "email": "admin@finance.com",
  "password": "admin123"
}
```

**Response** `200`: Returns user object and JWT token.

#### Get Profile

```
GET /api/auth/me
Authorization: Bearer <token>
```

**Response** `200`: Returns authenticated user's profile.

---

### User Management

> All endpoints require **ADMIN** role.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List users (paginated) |
| `GET` | `/api/users/:id` | Get user by ID |
| `PATCH` | `/api/users/:id` | Update user (name, role, status) |
| `DELETE` | `/api/users/:id` | Delete user |

**Query params for listing:** `page`, `limit`, `search`

**Update body example:**
```json
{
  "role": "ANALYST",
  "status": "INACTIVE"
}
```

> Admins cannot modify their own role/status or delete themselves.

---

### Financial Records

| Method | Endpoint | Auth | Roles |
|---|---|---|---|
| `POST` | `/api/records` | ✅ | ADMIN |
| `GET` | `/api/records` | ✅ | ALL |
| `GET` | `/api/records/:id` | ✅ | ALL |
| `PATCH` | `/api/records/:id` | ✅ | ADMIN |
| `DELETE` | `/api/records/:id` | ✅ | ADMIN |

#### Create Record

```
POST /api/records
Authorization: Bearer <token>
```

**Body:**
```json
{
  "amount": 5000,
  "type": "INCOME",
  "category": "Salary",
  "description": "Monthly salary",
  "date": "2026-04-01"
}
```

#### List Records with Filters

```
GET /api/records?type=EXPENSE&category=Rent&startDate=2026-01-01&endDate=2026-12-31&minAmount=100&maxAmount=5000&page=1&limit=10&sortBy=amount&order=desc
```

| Filter | Type | Description |
|---|---|---|
| `type` | `INCOME \| EXPENSE` | Filter by record type |
| `category` | `string` | Search by category (case-insensitive) |
| `startDate` | `ISO date` | Records on or after this date |
| `endDate` | `ISO date` | Records on or before this date |
| `minAmount` | `number` | Minimum amount |
| `maxAmount` | `number` | Maximum amount |
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 10) |
| `sortBy` | `string` | Sort field: date, amount, category, type, createdAt |
| `order` | `asc \| desc` | Sort direction (default: desc) |

> Delete performs a **soft delete** (sets `deletedAt` timestamp). Soft-deleted records are excluded from all queries.

---

### Dashboard Analytics

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | ANALYST, ADMIN | Total income, expenses, net balance, counts |
| `GET` | `/api/dashboard/category-totals` | ANALYST, ADMIN | Category-wise totals grouped by type |
| `GET` | `/api/dashboard/trends` | ANALYST, ADMIN | Monthly income/expense trends (12 months) |
| `GET` | `/api/dashboard/recent?limit=10` | ALL | Recent financial activity |

#### Summary Response

```json
{
  "success": true,
  "message": "Dashboard summary retrieved successfully",
  "data": {
    "totalIncome": 125000.50,
    "totalExpenses": 45000.75,
    "netBalance": 79999.75,
    "totalRecords": 96,
    "incomeCount": 40,
    "expenseCount": 56
  }
}
```

#### Trends Response (monthly)

```json
{
  "data": [
    {
      "month": "Apr 2025",
      "income": 12000,
      "expenses": 5500,
      "net": 6500,
      "incomeCount": 4,
      "expenseCount": 7
    }
  ]
}
```

---

## Testing the API

### Quick start: Automated smoke test

Run all 24 API tests in one command (no manual setup required):

```bash
npm run test:api
```

Output example:
```
Running API smoke tests against http://localhost:3000/api
PASS - Health check
PASS - Login admin
PASS - Login analyst (seeded account, optional)
...
Summary: 24 passed, 0 failed
```

The smoke test automatically:
- Logs in as admin and viewer
- Registers a temporary user and promotes to ANALYST role
- Tests all CRUD operations on users and records
- Verifies dashboard analytics endpoints
- Validates role-based access control (401/403 failures)
- Cleans up temporary data

**Environment variables (optional):**
- `API_BASE_URL` (default: `http://localhost:3000/api`)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (default: `admin@finance.com` / `admin123`)
- `VIEWER_EMAIL`, `VIEWER_PASSWORD` (default: `viewer@finance.com` / `viewer123`)

Example:
```bash
API_BASE_URL=https://api.example.com npm run test:api
```

---

### Manual testing in Postman

Test all endpoints in Postman with this workflow. Every request below is directly usable.

### 1. Create Postman environment variables

Create an environment (for example: Local Finance API) with:

- `baseUrl` = `http://localhost:3000/api`
- `adminToken` = empty
- `analystToken` = empty
- `viewerToken` = empty
- `userId` = empty
- `recordId` = empty

### 2. Global request setup

- For all `POST` and `PATCH` requests: Header `Content-Type: application/json`
- For authenticated requests: Header `Authorization: Bearer {{tokenVariable}}`
- Use tokens saved from login requests:
  - `{{adminToken}}`
  - `{{analystToken}}`
  - `{{viewerToken}}`

### 3. Authentication tests

1. **Health Check**
   - Method: `GET`
   - URL: `{{baseUrl}}/health`
   - Auth: none
   - Expected: `200`, `success: true`

2. **Register User**
   - Method: `POST`
   - URL: `{{baseUrl}}/auth/register`
   - Body:
   ```json
   {
     "email": "newuser@example.com",
     "password": "password123",
     "name": "New User"
   }
   ```
   - Expected: `201`, response contains `data.token`

3. **Login Admin**
   - Method: `POST`
   - URL: `{{baseUrl}}/auth/login`
   - Body:
   ```json
   {
     "email": "admin@finance.com",
     "password": "admin123"
   }
   ```
   - Expected: `200`, response contains `data.token`
   - Tests tab script (save token):
   ```javascript
   const json = pm.response.json();
   pm.environment.set("adminToken", json.data.token);
   pm.test("Admin login success", () => pm.response.to.have.status(200));
   ```

4. **Login Analyst**
   - Method: `POST`
   - URL: `{{baseUrl}}/auth/login`
   - Body:
   ```json
   {
     "email": "analyst@finance.com",
     "password": "analyst123"
   }
   ```
   - Tests tab script:
   ```javascript
   const json = pm.response.json();
   pm.environment.set("analystToken", json.data.token);
   ```

5. **Login Viewer**
   - Method: `POST`
   - URL: `{{baseUrl}}/auth/login`
   - Body:
   ```json
   {
     "email": "viewer@finance.com",
     "password": "viewer123"
   }
   ```
   - Tests tab script:
   ```javascript
   const json = pm.response.json();
   pm.environment.set("viewerToken", json.data.token);
   ```

6. **Get Current Profile**
   - Method: `GET`
   - URL: `{{baseUrl}}/auth/me`
   - Header: `Authorization: Bearer {{adminToken}}`
   - Expected: `200`

### 4. User Management tests (ADMIN only)

1. **List Users**
   - Method: `GET`
   - URL: `{{baseUrl}}/users?page=1&limit=10`
   - Header: `Authorization: Bearer {{adminToken}}`
   - Expected: `200`, array in `data`

2. **Search Users**
   - Method: `GET`
   - URL: `{{baseUrl}}/users?search=analyst`
   - Header: `Authorization: Bearer {{adminToken}}`
   - Expected: `200`

3. **Get User by ID**
   - First, copy one user `id` from List Users response into `userId`
   - Method: `GET`
   - URL: `{{baseUrl}}/users/{{userId}}`
   - Header: `Authorization: Bearer {{adminToken}}`
   - Expected: `200`

4. **Update User**
   - Method: `PATCH`
   - URL: `{{baseUrl}}/users/{{userId}}`
   - Header: `Authorization: Bearer {{adminToken}}`
   - Body:
   ```json
   {
     "role": "ANALYST",
     "status": "ACTIVE"
   }
   ```
   - Expected: `200`

5. **Delete User**
   - Method: `DELETE`
   - URL: `{{baseUrl}}/users/{{userId}}`
   - Header: `Authorization: Bearer {{adminToken}}`
   - Expected: `200`
   - Note: Deleting your own logged-in admin account is rejected.

### 5. Financial Records tests

1. **Create Record (ADMIN)**
   - Method: `POST`
   - URL: `{{baseUrl}}/records`
   - Header: `Authorization: Bearer {{adminToken}}`
   - Body:
   ```json
   {
     "amount": 5000,
     "type": "INCOME",
     "category": "Salary",
     "description": "Monthly salary for April",
     "date": "2026-04-01"
   }
   ```
   - Expected: `201`
   - Tests tab script (save record id):
   ```javascript
   const json = pm.response.json();
   pm.environment.set("recordId", json.data.id);
   ```

2. **List Records (All authenticated roles)**
   - Method: `GET`
   - URL examples:
     - `{{baseUrl}}/records?page=1&limit=10`
     - `{{baseUrl}}/records?type=EXPENSE`
     - `{{baseUrl}}/records?category=Rent`
     - `{{baseUrl}}/records?startDate=2026-01-01&endDate=2026-12-31`
     - `{{baseUrl}}/records?minAmount=100&maxAmount=5000`
     - `{{baseUrl}}/records?sortBy=amount&order=desc`
   - Header: `Authorization: Bearer {{viewerToken}}`
   - Expected: `200`

3. **Get Record by ID**
   - Method: `GET`
   - URL: `{{baseUrl}}/records/{{recordId}}`
   - Header: `Authorization: Bearer {{viewerToken}}`
   - Expected: `200`

4. **Update Record (ADMIN)**
   - Method: `PATCH`
   - URL: `{{baseUrl}}/records/{{recordId}}`
   - Header: `Authorization: Bearer {{adminToken}}`
   - Body:
   ```json
   {
     "amount": 5500,
     "description": "Updated salary amount"
   }
   ```
   - Expected: `200`

5. **Delete Record (ADMIN, soft delete)**
   - Method: `DELETE`
   - URL: `{{baseUrl}}/records/{{recordId}}`
   - Header: `Authorization: Bearer {{adminToken}}`
   - Expected: `200`

### 6. Dashboard tests

1. **Summary (ANALYST/ADMIN)**
   - Method: `GET`
   - URL: `{{baseUrl}}/dashboard/summary`
   - Header: `Authorization: Bearer {{analystToken}}`
   - Expected: `200`

2. **Category Totals (ANALYST/ADMIN)**
   - Method: `GET`
   - URL: `{{baseUrl}}/dashboard/category-totals`
   - Header: `Authorization: Bearer {{analystToken}}`
   - Expected: `200`

3. **Trends (ANALYST/ADMIN)**
   - Method: `GET`
   - URL: `{{baseUrl}}/dashboard/trends`
   - Header: `Authorization: Bearer {{analystToken}}`
   - Expected: `200`

4. **Recent Activity (all authenticated roles)**
   - Method: `GET`
   - URL: `{{baseUrl}}/dashboard/recent?limit=5`
   - Header: `Authorization: Bearer {{viewerToken}}`
   - Expected: `200`

### 7. Access-control negative tests (must fail)

1. **Viewer cannot create record**
   - Method: `POST`
   - URL: `{{baseUrl}}/records`
   - Header: `Authorization: Bearer {{viewerToken}}`
   - Body:
   ```json
   {
     "amount": 100,
     "type": "INCOME",
     "category": "Test",
     "date": "2026-04-01"
   }
   ```
   - Expected: `403`

2. **Viewer cannot access summary**
   - Method: `GET`
   - URL: `{{baseUrl}}/dashboard/summary`
   - Header: `Authorization: Bearer {{viewerToken}}`
   - Expected: `403`

3. **Missing token on protected endpoint**
   - Method: `GET`
   - URL: `{{baseUrl}}/records`
   - No Authorization header
   - Expected: `401`

---

## Role-Based Access Control

| Action | VIEWER | ANALYST | ADMIN |
|---|---|---|---|
| Register / Login | ✅ | ✅ | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| View records | ✅ | ✅ | ✅ |
| View recent activity | ✅ | ✅ | ✅ |
| View dashboard analytics | ❌ | ✅ | ✅ |
| Create / update / delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

Access control is enforced via two middleware layers:
1. **`authenticate`** — Verifies JWT token and attaches user to request
2. **`authorize(...roles)`** — Checks user role against allowed roles

---

## Error Handling

All errors return a consistent JSON format:

```json
{
  "success": false,
  "message": "Description of what went wrong",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

| Scenario | Status Code |
|---|---|
| Validation error | `400` |
| Missing/invalid token | `401` |
| Insufficient role | `403` |
| Resource not found | `404` |
| Duplicate entry | `409` |
| Rate limit exceeded | `429` |
| Server error | `500` |

---

## Design Decisions & Tradeoffs

1. **Soft Delete**: Financial records use soft delete (`deletedAt` timestamp) rather than hard delete to preserve audit trails. All queries filter out soft-deleted records automatically.

2. **Modular Architecture**: The codebase follows a module-based structure (`modules/auth`, `modules/records`, etc.) where each module encapsulates its own routes, controller, and service. This promotes separation of concerns and makes the codebase scalable.

3. **Service Layer Pattern**: Business logic lives in service classes rather than controllers. Controllers only handle HTTP request/response, making the logic reusable and testable.

4. **Raw SQL for Trends**: The monthly trends endpoint uses Prisma's `$queryRaw` with `DATE_TRUNC` for efficient monthly aggregation, as Prisma's `groupBy` doesn't natively support date truncation.

5. **Rate Limiting**: Applied only to auth routes (register/login) to prevent brute-force attacks without impacting normal API usage.

6. **New users default to VIEWER role**: New registrations get the most restrictive role. Only admins can promote users to higher roles.

7. **Password Hashing**: Uses bcryptjs with 12 salt rounds — a strong default that balances security and performance.

8. **Zod Validation**: Chosen over alternatives (Joi, class-validator) for its TypeScript-first design and smaller bundle size.
