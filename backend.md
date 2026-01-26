# Backend Documentation - CoopNest Server

## Overview

The CoopNest backend is a TypeScript-based Express.js application that provides a comprehensive API for managing cooperative savings and loan operations. It uses Prisma ORM with PostgreSQL for data persistence, Redis for caching and rate limiting, and implements robust security measures including JWT authentication and role-based access control.

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL 17
- **Cache/Sessions**: Redis 7
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi, Zod, class-validator
- **Documentation**: Swagger (swagger-jsdoc, swagger-ui-express)
- **Logging**: Winston
- **Testing**: Jest with Supertest
- **SMS/OTP**: Twilio
- **File Processing**: ExcelJS, PDFKit, Multer

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma        # Database schema definition
│   └── seed.ts              # Database seeding script
├── src/
│   ├── app/
│   │   └── index.ts         # Express app initialization & middleware setup
│   ├── config/
│   │   ├── env.ts           # Environment variables configuration
│   │   └── redis.ts         # Redis client configuration
│   ├── middlewares/
│   │   ├── auth.ts          # Authentication & authorization middlewares
│   │   ├── errorHandler.ts # Global error handling
│   │   ├── validateRequest.ts # Request validation
│   │   ├── rateLimiter.ts   # Rate limiting configuration
│   │   └── csrf.ts          # CSRF protection
│   ├── modules/
│   │   ├── user/            # User management & authentication
│   │   ├── biodata/         # Member profile management
│   │   ├── account/         # Bank account management
│   │   ├── savings/         # Monthly savings operations
│   │   ├── personal-savings/ # Personal savings plans
│   │   ├── loan/            # Loan management
│   │   ├── transaction/     # Transaction tracking
│   │   ├── request/         # Approval workflow
│   │   ├── notification/    # Notification system
│   │   └── system/          # System settings
│   ├── routes/
│   │   └── index.ts         # Route aggregation
│   ├── services/
│   │   └── health.service.ts # Health check service
│   ├── utils/
│   │   ├── prisma.ts        # Prisma client instance
│   │   ├── logger.ts        # Winston logger configuration
│   │   ├── apiError.ts      # Custom error classes
│   │   ├── apiResponse.ts   # Standardized API responses
│   │   ├── permissionSync.ts # Permission synchronization
│   │   └── ...
│   ├── types/
│   │   ├── express.ts       # Express type extensions
│   │   └── permissions.ts   # Permission definitions
│   ├── docs/
│   │   └── swaggerDocs.ts   # Swagger configuration
│   └── server.ts            # Application entry point
└── package.json
```

## Module Architecture

Each module follows a consistent structure:

```
module-name/
├── controllers/      # Request handlers, orchestrate business logic
├── services/         # Core business logic & database operations
├── routes/           # Route definitions & middleware application
├── validations/      # Request validation schemas (Joi/Zod)
├── interfaces/       # TypeScript type definitions
├── types/            # Enums and type definitions
└── index.ts          # Module exports
```

## Core Modules

### 1. User Module (`modules/user/`)
**Purpose**: Authentication, user management, and role-based access control

**Key Features**:
- User registration and authentication (JWT-based)
- Password hashing with bcrypt
- Role assignment with approval levels
- Permission management
- Session management with device tracking
- Admin user profiles

**Key Services**:
- `auth.service.ts` - Authentication logic (login, logout, OTP verification)
- `user.service.ts` - User CRUD operations and permission checking
- `role.service.ts` - Role management and assignment
- `token.service.ts` - JWT token generation and validation

**Important Routes**:
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Session termination
- `POST /api/auth/refresh` - Token refresh
- `GET /api/users` - List users (protected)
- `POST /api/users` - Create user (protected)

### 2. Biodata Module (`modules/biodata/`)
**Purpose**: Member profile and personal information management

**Key Features**:
- Member registration with ERP integration (erpId, ippisId)
- Profile photo upload
- Email and phone number verification
- Next of kin management
- Member status tracking (PENDING, ACTIVE, SUSPENDED, etc.)

**Database Fields**:
- Unique identifiers: `erpId`, `ippisId`, `staffNo`
- Personal info: names, contact details, address
- Employment: department, date of employment
- Verification flags: `isVerified`, `isApproved`

### 3. Account Module (`modules/account/`)
**Purpose**: Bank account management and verification

**Key Features**:
- Bank account registration
- BVN verification
- Bank details validation via external API
- Account-to-member linking
- Bank registry management

**Integration**:
- Uses `BANK_VERIFICATION_API_URL` for account verification
- Supports multiple bank accounts per member

### 4. Savings Module (`modules/savings/`)
**Purpose**: Monthly savings tracking and management

**Key Features**:
- Monthly savings deduction tracking (by month/year)
- Automatic split between savings and shares
- Withdrawal request handling
- Balance management
- Target amount setting

**Important Patterns**:
- Unique constraint on `(erpId, month, year)` prevents duplicate entries
- Links to Shares module for automatic share allocation
- Uses Request module for withdrawal approvals

**Key Services**:
- `savings.service.ts` - Savings CRUD and balance calculations
- `savings-upload.service.ts` - Bulk savings upload processing
- `pdf.service.ts` - Savings statement generation

### 5. Personal Savings Module (`modules/personal-savings/`)
**Purpose**: Individual voluntary savings plans (separate from monthly savings)

**Key Features**:
- Custom savings plans (e.g., "Holiday Fund", "Emergency Savings")
- Target amount setting
- Flexible deposit schedules
- Independent from monthly deductions

**Difference from Savings**:
- **Savings**: Mandatory monthly deductions split into savings + shares
- **Personal Savings**: Voluntary, goal-based savings accounts

### 6. Loan Module (`modules/loan/`)
**Purpose**: Comprehensive loan management system

**Key Features**:
- Multiple loan types with different terms
- Loan eligibility calculation based on savings
- Multi-level approval workflow
- Automatic payment schedule generation
- Repayment tracking (manual and bulk upload)
- Interest calculation
- Late payment tracking

**Key Services**:
- `loan.service.ts` - Loan CRUD and lifecycle management
- `eligibility.service.ts` - Loan eligibility calculations
- `calculator.service.ts` - Interest and repayment calculations
- `repayment.service.ts` - Repayment processing and reconciliation
- `notification.service.ts` - Loan-related notifications

**Loan Workflow**:
1. Member applies for loan → `Loan` created with `PENDING` status
2. Creates `Request` for approval
3. Multi-level approval via `RequestApproval`
4. Status → `APPROVED`
5. Disbursement creates `Transaction`, status → `DISBURSED`
6. Generate `LoanSchedule` records for payment tracking
7. Repayments update `LoanRepayment` and `LoanSchedule`
8. Status → `COMPLETED` when fully paid

**Bulk Repayment**:
- Uses `BulkRepaymentUpload` to track batch uploads
- Links individual `LoanRepayment` records to upload batch
- Reconciliation support

### 7. Transaction Module (`modules/transaction/`)
**Purpose**: Financial transaction logging and audit trail

**Key Features**:
- Comprehensive transaction tracking
- Module-based categorization (SAVINGS, LOAN, SHARES)
- Transaction types (CREDIT/DEBIT with specific operations)
- Balance tracking
- Parent-child transaction relationships
- Approval tracking (initiator/approver)

**Transaction Types**:
- Savings: DEPOSIT, WITHDRAWAL, INTEREST
- Shares: PURCHASE, LIQUIDATION, DIVIDEND
- Loan: DISBURSEMENT, REPAYMENT, INTEREST, PENALTY
- System: FEE, REVERSAL, ADJUSTMENT

**Key Services**:
- `transaction.service.ts` - Transaction creation and management
- `transaction-query.service.ts` - Advanced querying and filtering
- `transaction-reporting.service.ts` - Reports and analytics

### 8. Request Module (`modules/request/`)
**Purpose**: Multi-level approval workflow management

**Key Features**:
- Generic approval system for various request types
- Multi-level approval chain
- Priority management
- Status tracking through approval stages
- Assignee and approver management

**Request Types**:
- `LOAN_APPLICATION`
- `SAVINGS_WITHDRAWAL`
- `ACCOUNT_CLOSURE`
- `BIODATA_UPDATE`
- `PERSONAL_SAVINGS_WITHDRAWAL`
- `BULK_UPLOAD`
- `SYSTEM_ADJUSTMENT`

**Approval Flow**:
1. Initiator creates `Request` with `PENDING` status
2. System creates `RequestApproval` records based on required levels
3. Each level is approved sequentially
4. Request status: PENDING → IN_REVIEW → APPROVED → COMPLETED
5. Links to related entities (Loan, Savings, etc.)

### 9. Notification Module (`modules/notification/`)
**Purpose**: User notification system

**Key Features**:
- Multi-type notifications (TRANSACTION, REQUEST_UPDATE, SYSTEM_ALERT)
- Priority levels
- Read/unread tracking
- Expiration management
- Links to related entities (requests, transactions)

### 10. System Module (`modules/system/`)
**Purpose**: System configuration and settings management

**Key Features**:
- Dynamic system settings (e.g., DEFAULT_SHARE_AMOUNT)
- Settings history tracking
- Grouped settings (SHARES, SAVINGS, LOANS)
- Type-safe value storage

**Key Service**:
- `systemSettings.service.ts` - Singleton service for settings management
- Initialized on app startup

## Authentication & Authorization

### Authentication Flow

1. **Login** (`POST /api/auth/login`):
   - Validates username/password
   - Generates JWT access token (1h) and refresh token (7d)
   - Creates `Session` record with device info
   - Returns tokens and user info

2. **Token Verification** (middleware):
   - Extracts token from `Authorization: Bearer <token>`
   - Verifies JWT signature
   - Checks token blacklist in Redis
   - Validates active session in database
   - Loads user with roles and permissions
   - Updates session `lastActive` timestamp

3. **Logout** (`POST /api/auth/logout`):
   - Blacklists token in Redis
   - Revokes session in database

### Authorization Middlewares

**`authenticateUser`** (`middlewares/auth.ts:35`):
- Validates JWT token
- Checks session validity
- Loads user permissions
- Attaches `req.user` and `req.userPermissions`

**`authorizeRoles(roles: string[])`** (`middlewares/auth.ts:153`):
- Checks if user has one of specified roles
- SUPER_ADMIN bypass

**`checkPermission(permission: string)`** (`middlewares/auth.ts:197`):
- Validates specific permission
- Uses PERMISSIONS array from `types/permissions.ts`

**`checkModuleAccess(module: string)`** (`middlewares/auth.ts:229`):
- Checks module-level access
- Admin bypass

**`checkApprovalLevel(requiredLevel: number)`** (`middlewares/auth.ts:261`):
- Validates approval authority
- Checks both level and `canApprove` flag

**`checkPermissionAndLevel(permission, level)`** (`middlewares/auth.ts:292`):
- Combined permission and approval level check
- Used for approval actions

### Permission System

Permissions are defined in `types/permissions.ts`:

```typescript
export enum Module {
  ADMIN, ACCOUNT, USER, LOAN, SAVINGS,
  SHARES, SYSTEM, REPORTS, TRANSACTION, REQUEST
}

export enum Action {
  CREATE, READ, UPDATE, DELETE, APPROVE,
  REVIEW, VERIFY, MANAGE, DISBURSE, WITHDRAW
}

interface Permission {
  name: string;              // e.g., "APPROVE_LOAN"
  description: string;
  module: Module;
  action: Action;
  requiredApprovalLevel?: number;
}
```

Permissions are synced to database on startup via `PermissionSyncService`.

### Role Structure

```typescript
model Role {
  name: string              // e.g., "LOAN_OFFICER", "SUPER_ADMIN"
  permissions: string[]     // Array of permission names
  approvalLevel: int        // 1, 2, 3, etc.
  canApprove: boolean
  moduleAccess: string[]    // Modules accessible
}
```

## Database Schema Highlights

### Key Relationships

**User → Biodata (Member)**:
- Users represent system accounts (with authentication)
- Biodata represents member profiles (can exist without user account)
- One-to-many: A Biodata can have multiple Users (but typically one)

**Savings → Shares**:
- Monthly savings are split into savings + shares
- One Savings record can generate one Shares record per month
- Linked via `savingsId` field in Shares

**Loan → LoanSchedule → LoanRepayment**:
- Loan has multiple LoanSchedule entries (payment schedule)
- Each schedule can have multiple LoanRepayment entries
- Reconciliation links repayments to schedules

**Request → RequestApproval**:
- One Request has multiple RequestApproval entries (one per level)
- Sequential approval process

**Transaction → All Modules**:
- Transactions link to related entities (loanId, savingsId, sharesId, etc.)
- Parent-child relationships for split transactions

### Important Constraints

- **Biodata**: Composite unique `(id, erpId)` for ERP integration
- **Savings**: Unique `(erpId, month, year)` prevents duplicate monthly entries
- **Shares**: Unique `(erpId, month, year)` prevents duplicate monthly entries
- **LoanRepayment**: Unique `(loanId, repaymentMonth, repaymentYear)` prevents duplicate monthly repayments
- **Session**: Unique `(userId, token)` for session tracking

### Enums

Key enums that drive business logic:
- `MembershipStatus`: PENDING, ACTIVE, SUSPENDED, RESIGNED, TERMINATED
- `LoanStatus`: PENDING, IN_REVIEW, APPROVED, DISBURSED, ACTIVE, COMPLETED, DEFAULTED
- `RequestStatus`: PENDING, IN_REVIEW, APPROVED, REJECTED, CANCELLED, COMPLETED
- `TransactionType`: 20+ types covering all financial operations
- `TransactionStatus`: PENDING, PROCESSING, COMPLETED, FAILED, REVERSED

## API Response Standards

### Success Response (`utils/apiResponse.ts`)

```typescript
{
  success: true,
  status: "success",
  message: "Operation successful",
  data: { ... },
  code: 200 // or 201 for created
}
```

### Error Response (`utils/apiError.ts`)

```typescript
{
  success: false,
  status: "error",
  message: "Error description",
  code: 400, // or 401, 403, 404, 500
  errors?: [...], // Validation errors
  context?: { ... } // Additional error context
}
```

### Custom Error Classes

- `ApiError` - Base error class with status code
- `ValidationError` - Extends ApiError for validation failures
- `AuthError` - Authentication-specific errors

## Middleware Chain

The middleware execution order (from `app/index.ts`):

1. **CORS** - Cross-origin resource sharing
2. **Body parsing** - JSON and URL-encoded
3. **Cookie parser** - Parse cookies
4. **Security headers** - Security-related headers
5. **Request logger** - Winston logging
6. **Request context** - Adds request ID and context
7. **Routes** - Application routes
8. **Authentication** - Applied to protected routes
9. **CSRF validation** - For mutating operations
10. **Error handler** - Global error handling

## Environment Variables

Required variables (see `.env.test`):

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=coop-nest_db

# Server
PORT=5001
NODE_ENV=development
APPLICATION_URL=http://localhost

# JWT
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_URL=redis://localhost:6379

# Twilio (OTP)
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
TWILIO_VERIFICATION_SERVICE_SID=<sid>
TWILIO_PHONE_NUMBER=<phone>
OTP_EXPIRY_TIME=600000 # 10 minutes

# Bank Verification
BANK_VERIFICATION_API_URL=https://api.example.com/verify
BANK_VERIFICATION_TOKEN=<token>
```

## Development Workflow

### Running the Application

```bash
# Install dependencies
npm install

# Run in development mode (with nodemon)
npm run dev

# Build TypeScript
npm run build

# Run tests
npm test
```

### Database Management

```bash
# Run migrations
npm run migrate:db
# or
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Seed database
npm run seed

# Reset database (backs up first)
npm run reset:db

# Backup database
npm run backup:db

# Restore database
npm run restore:db
```

### Prisma Studio

```bash
npx prisma studio
```

Opens GUI for database exploration at http://localhost:5555

## Testing

Tests are written using Jest and Supertest:

```typescript
// Example test structure
describe('Module Name', () => {
  describe('Feature', () => {
    it('should do something', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .send({ data })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
```

Test files use `*.spec.ts` pattern and are excluded from builds.

## Logging

Winston logger configuration (`utils/logger.ts`):

- **Development**: Console output with colors
- **Production**: File-based logging with rotation
- Log levels: error, warn, info, http, debug

Usage:
```typescript
import logger from '@/utils/logger';

logger.info('User logged in', { userId: user.id });
logger.error('Operation failed', { error, context });
```

## API Documentation

Swagger documentation is available at `/api-docs` when the server is running.

Configuration: `docs/swaggerDocs.ts`

Each route can have JSDoc comments for automatic documentation:

```typescript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
```

## Security Features

1. **JWT Authentication**: Secure token-based auth with refresh tokens
2. **Password Hashing**: Bcrypt with salt rounds
3. **Session Management**: Database-backed sessions with device tracking
4. **Token Blacklist**: Redis-based revoked token tracking
5. **CSRF Protection**: Token-based CSRF for protected routes
6. **Rate Limiting**: Redis-based rate limiting (configurable)
7. **Input Validation**: Joi/Zod schemas for all inputs
8. **SQL Injection Protection**: Prisma ORM parameterized queries
9. **Role-Based Access Control**: Granular permissions
10. **Audit Trail**: Comprehensive transaction logging

## Common Patterns

### Creating a Transaction

```typescript
const transaction = await prisma.transaction.create({
  data: {
    transactionType: TransactionType.LOAN_DISBURSEMENT,
    baseType: TransactionType.CREDIT,
    module: TransactionModule.LOAN,
    amount: loanAmount,
    balanceAfter: newBalance,
    status: TransactionStatus.COMPLETED,
    initiatedBy: userId,
    approvedBy: approverId,
    loanId: loan.id,
    metadata: { ... }
  }
});
```

### Creating a Request with Approval Chain

```typescript
const request = await prisma.request.create({
  data: {
    type: RequestType.LOAN_APPLICATION,
    module: RequestModule.LOAN,
    status: RequestStatus.PENDING,
    initiatorId: userId,
    loanId: loan.id,
    content: { ... },
    approvalSteps: {
      create: [
        { level: 1, approverRole: 'LOAN_OFFICER', status: ApprovalStatus.PENDING },
        { level: 2, approverRole: 'MANAGER', status: ApprovalStatus.PENDING },
      ]
    }
  }
});
```

### Checking Permissions

```typescript
// In route definition
router.post(
  '/loans/approve/:id',
  authenticate,
  checkPermissionAndLevel('APPROVE_LOAN', 2),
  loanController.approveLoan
);

// In controller/service
const userPerms = await userService.getUserPermissions(userId);
if (!userPerms.permissions.includes('APPROVE_LOAN')) {
  throw new ApiError('Insufficient permissions', 403);
}
```

## Performance Considerations

1. **Database Indexes**: Strategic indexes on frequently queried fields (see schema.prisma `@@index` directives)
2. **Redis Caching**: Session data and rate limiting
3. **Query Optimization**: Use Prisma includes sparingly, select only needed fields
4. **Pagination**: Implement cursor-based or offset pagination for large datasets
5. **Transaction Batching**: Use Prisma transactions for related operations

## Deployment

Docker Compose setup includes:
- PostgreSQL container (port 5432)
- Redis container (port 6379)
- Server container (port 5001)

Environment differences:
- **Development**: `localhost` for database host
- **Docker**: Service name `postgres` for database host

## Troubleshooting

### Common Issues

1. **Prisma Client outdated**: Run `npx prisma generate`
2. **Migration conflicts**: Reset database with `npm run reset:db`
3. **Port conflicts**: Check if ports 5001, 5432, 6379 are available
4. **Redis connection errors**: Ensure Redis is running
5. **JWT errors**: Verify JWT_SECRET is set in environment

### Debug Mode

Enable detailed logging:
```typescript
// In config/env.ts or .env
LOG_LEVEL=debug
```

## Best Practices

1. **Always use transactions** for related database operations
2. **Validate input** at both controller and service levels
3. **Log important operations** with context
4. **Use ApiError** for consistent error handling
5. **Follow module structure** for new features
6. **Write tests** for new services and controllers
7. **Document complex business logic** with comments
8. **Use TypeScript types** strictly, avoid `any`
9. **Check permissions** before operations
10. **Create audit trail** via Transaction records

## Additional Resources

- Prisma Documentation: https://www.prisma.io/docs
- Express.js Guide: https://expressjs.com/
- TypeScript Handbook: https://www.typescriptlang.org/docs/
