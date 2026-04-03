# Finance Dashboard Backend

A robust backend API for a finance dashboard system built with **Node.js**, **Express**, **TypeScript**, and **PostgreSQL** (hosted on Neon). Features JWT authentication, role-based access control (RBAC), financial records management with full CRUD operations, and dashboard analytics endpoints.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [User Management](#user-management)
  - [Financial Records](#financial-records)
  - [Dashboard Analytics](#dashboard-analytics)
- [Role-Based Access Control](#role-based-access-control)
- [Error Handling](#error-handling)
- [Design Decisions & Tradeoffs](#design-decisions--tradeoffs)

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

4. **Set up database & seed data** (one command)
   ```bash
   npm run setup
   ```
   This generates the Prisma client, pushes the schema to the database, and seeds sample data.

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

You can test all endpoints using either **Postman** or **cURL**.

### Using Postman

1. Import the API endpoints into Postman using the base URL `http://localhost:3000/api`
2. For authenticated requests, first call the Login endpoint and copy the `token` from the response
3. In subsequent requests, add an `Authorization` header with the value `Bearer <token>`
4. Set `Content-Type: application/json` for POST/PATCH requests

### Using cURL

Below are ready-to-use cURL commands for every endpoint. Replace `<token>` with the JWT you receive from login.

#### Health Check

```bash
curl http://localhost:3000/api/health
```

#### Authentication

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "name": "New User"
  }'
```

**Login (Admin):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@finance.com",
    "password": "admin123"
  }'
```

**Login (Analyst):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@finance.com",
    "password": "analyst123"
  }'
```

**Login (Viewer):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "viewer@finance.com",
    "password": "viewer123"
  }'
```

**Get current profile:**
```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

#### User Management (Admin Only)

**List all users (paginated):**
```bash
curl "http://localhost:3000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

**Search users:**
```bash
curl "http://localhost:3000/api/users?search=analyst" \
  -H "Authorization: Bearer <token>"
```

**Get user by ID:**
```bash
curl http://localhost:3000/api/users/<user_id> \
  -H "Authorization: Bearer <token>"
```

**Update user role/status:**
```bash
curl -X PATCH http://localhost:3000/api/users/<user_id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "ANALYST",
    "status": "ACTIVE"
  }'
```

**Delete user:**
```bash
curl -X DELETE http://localhost:3000/api/users/<user_id> \
  -H "Authorization: Bearer <token>"
```

#### Financial Records

**Create a record (Admin only):**
```bash
curl -X POST http://localhost:3000/api/records \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "type": "INCOME",
    "category": "Salary",
    "description": "Monthly salary for April",
    "date": "2026-04-01"
  }'
```

**List all records with filters:**
```bash
# Basic listing
curl "http://localhost:3000/api/records?page=1&limit=10" \
  -H "Authorization: Bearer <token>"

# Filter by type
curl "http://localhost:3000/api/records?type=EXPENSE" \
  -H "Authorization: Bearer <token>"

# Filter by date range
curl "http://localhost:3000/api/records?startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer <token>"

# Filter by amount range
curl "http://localhost:3000/api/records?minAmount=100&maxAmount=5000" \
  -H "Authorization: Bearer <token>"

# Filter by category
curl "http://localhost:3000/api/records?category=Rent" \
  -H "Authorization: Bearer <token>"

# Sort by amount descending
curl "http://localhost:3000/api/records?sortBy=amount&order=desc" \
  -H "Authorization: Bearer <token>"

# Combined filters
curl "http://localhost:3000/api/records?type=EXPENSE&category=Rent&startDate=2026-01-01&endDate=2026-12-31&minAmount=100&maxAmount=5000&page=1&limit=10&sortBy=amount&order=desc" \
  -H "Authorization: Bearer <token>"
```

**Get a single record:**
```bash
curl http://localhost:3000/api/records/<record_id> \
  -H "Authorization: Bearer <token>"
```

**Update a record (Admin only):**
```bash
curl -X PATCH http://localhost:3000/api/records/<record_id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5500,
    "description": "Updated salary amount"
  }'
```

**Delete a record — soft delete (Admin only):**
```bash
curl -X DELETE http://localhost:3000/api/records/<record_id> \
  -H "Authorization: Bearer <token>"
```

#### Dashboard Analytics

**Financial summary (Analyst/Admin):**
```bash
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer <token>"
```

**Category-wise totals (Analyst/Admin):**
```bash
curl http://localhost:3000/api/dashboard/category-totals \
  -H "Authorization: Bearer <token>"
```

**Monthly trends — last 12 months (Analyst/Admin):**
```bash
curl http://localhost:3000/api/dashboard/trends \
  -H "Authorization: Bearer <token>"
```

**Recent activity (all authenticated users):**
```bash
curl "http://localhost:3000/api/dashboard/recent?limit=5" \
  -H "Authorization: Bearer <token>"
```

#### Testing Access Control

You can verify role restrictions by logging in with different roles and attempting restricted operations:

```bash
# 1. Login as Viewer
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "viewer@finance.com", "password": "viewer123"}'
# Copy the token from the response

# 2. Try to create a record as Viewer (should return 403 Forbidden)
curl -X POST http://localhost:3000/api/records \
  -H "Authorization: Bearer <viewer_token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "type": "INCOME", "category": "Test", "date": "2026-04-01"}'

# 3. Try to access dashboard summary as Viewer (should return 403 Forbidden)
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer <viewer_token>"

# 4. Viewer CAN view records (should return 200 OK)
curl http://localhost:3000/api/records \
  -H "Authorization: Bearer <viewer_token>"
```

> **Tip (Windows CMD):** If you're using Windows Command Prompt instead of Git Bash, replace `\` line continuations with `^` and use double quotes for the `-d` body.

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
