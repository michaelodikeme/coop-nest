# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coop Nest is a cooperative savings and loan management application built with a Next.js frontend and Express/TypeScript backend using Prisma ORM with PostgreSQL.

## Key Development Rules

**CRITICAL: Follow these rules for all development work in this repository.**

1. **End-to-End Debugging**
   - When debugging any problem, always do an end-to-end review from client to server
   - Trace the entire request/response flow: Frontend → API Service → Backend Route → Controller → Service → Database
   - Check both frontend and backend logs, network requests, and database queries
   - Don't focus only on one side of the stack

2. **Task Planning & Documentation**
   - **Before implementing**: Create a `task.md` file breaking down the task into clear, actionable steps
   - **After completing**: Create a `summary.md` file documenting what was done, changes made, and any important notes
   - Include rationale for architectural decisions in task breakdown
   - Document any gotchas or important considerations

3. **Build Validation**
   - Always run a build to check for TypeScript errors before completing any task
   - For backend: Run `cd server && npm run build`
   - For frontend: Run `cd client && npm run build`
   - Fix all TypeScript errors - do not ignore type issues
   - Ensure zero compilation errors before marking work as complete

4. **No Assumptions - Ask Questions**
   - Never make assumptions about requirements or implementation details
   - If anything is unclear or ambiguous, ask clarifying questions
   - Confirm understanding of business logic before implementing
   - When multiple approaches are possible, present options and ask for preference
   - Better to ask and be certain than to assume and be wrong

## Development Commands

### Root Level
```bash
npm run install-all  # Install dependencies for both client and server
npm run dev          # Run both client and server concurrently
npm run client       # Run client only
npm run server       # Run server only
npm run redis        # Start Redis server (WSL)
```

### Server (backend)
```bash
cd server
npm run dev          # Development server with nodemon
npm run build        # Compile TypeScript
npm test             # Run Jest tests
npm run seed         # Seed database with initial data

# Database management
npm run migrate:db   # Run Prisma migrations
npm run reset:db     # Backup and reset database
npm run backup:db    # Backup database to backups/db/
npm run restore:db   # Restore database from backup
```

### Client (frontend)
```bash
cd client
npm run dev          # Development server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Docker
```bash
docker-compose up    # Start all services (postgres, redis, server, client)
```

## Architecture

### Backend Structure

The server follows a modular architecture where each domain has its own module with the following structure:
- `controllers/` - Request handlers and business logic orchestration
- `services/` - Core business logic and database operations
- `routes/` - Route definitions and middleware application
- `validations/` - Request validation schemas
- `interfaces/` - TypeScript type definitions

**Core Modules:**
- `user/` - Authentication, authorization, role management
- `biodata/` - Member profile management
- `account/` - Bank account management and verification
- `savings/` - Monthly savings tracking and withdrawal requests
- `personal-savings/` - Individual savings plans (different from monthly savings)
- `shares/` - Share purchase and liquidation
- `loan/` - Loan applications, disbursements, repayments, and schedule tracking
- `transaction/` - Financial transaction logging and tracking
- `request/` - Approval workflow management
- `notification/` - User notification system
- `system/` - System settings and configuration

### Database Schema (Prisma)

The application uses a sophisticated multi-entity schema (`server/prisma/schema.prisma`) with these key relationships:

**User Management:**
- `User` - System users with authentication
- `Role` - Flexible role-based permissions with approval levels
- `UserRole` - User-to-role assignments with expiration support
- `AdminUserProfile` - Admin-specific profile information
- `Session` - Session management with device tracking

**Member Management:**
- `Biodata` - Member personal information (linked to ERP system via erpId/ippisId)
- `AccountInfo` - Member bank account details
- `Bank` - Bank registry with codes

**Financial Modules:**
- `Savings` - Monthly savings by member (month/year combination)
- `PersonalSavings` - Individual savings plans separate from monthly savings
- `PersonalSavingsPlan` - Pre-defined plan types for personal savings
- `Shares` - Share units linked to savings
- `Loan` - Loan applications and tracking
- `LoanType` - Loan product definitions
- `LoanSchedule` - Payment schedules
- `LoanRepayment` - Actual repayment records
- `BulkRepaymentUpload` - Batch upload tracking

**System:**
- `Request` - Generic approval workflow tracking (loan applications, withdrawals, etc.)
- `RequestApproval` - Multi-level approval chain
- `Transaction` - All financial transactions with module tracking
- `Notification` - User notifications
- `SystemSettings` - Application configuration with history tracking

**Important Patterns:**
- Most entities use UUID primary keys
- Biodata uses composite unique constraint `(id, erpId)` for ERP integration
- Savings and Shares have unique constraints on `(erpId, month, year)` to prevent duplicates
- Request module handles multi-level approval workflows
- Transactions use enum-based type system (CREDIT/DEBIT, module-specific types)

### Frontend Structure

Next.js 15 application using App Router:
- `app/` - Next.js pages and layouts
- `components/` - Reusable React components
- `lib/` - API clients, Redux store, utilities
- `types/` - TypeScript type definitions
- `utils/` - Helper functions
- `validations/` - Form validation schemas

**Key Technologies:**
- State: Redux Toolkit + React Query (TanStack Query)
- UI: Material-UI (MUI) + Tailwind CSS
- Forms: React Hook Form + Yup/Zod validation
- Charts: Chart.js, Recharts

### Authentication & Authorization

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC) with permission arrays
- Multi-level approval system tied to role approval levels
- Session management with device tracking
- CSRF protection for protected routes
- Rate limiting (currently disabled for development - see `server/src/app/index.ts:80`)

### Key Architectural Patterns

**Approval Workflow:**
The Request/RequestApproval system handles multi-step approvals:
1. User initiates request (loan application, withdrawal, etc.)
2. Request assigned based on role approval levels
3. Multi-level approval chain tracked via RequestApproval
4. Status transitions: PENDING → IN_REVIEW → APPROVED/REJECTED → COMPLETED

**Transaction Tracking:**
All financial operations create Transaction records with:
- Module reference (SAVINGS, LOAN, SHARES)
- Type (specific operation like LOAN_DISBURSEMENT)
- Base type (CREDIT/DEBIT for accounting)
- Links to related entities (loan, savings, shares, request)
- Approval tracking (initiator/approver)

**System Initialization:**
On startup (`server/src/app/index.ts`):
1. Syncs permissions to database
2. Initializes default system settings (e.g., DEFAULT_SHARE_AMOUNT)
3. Sets up middleware chain
4. Configures Swagger docs at `/api-docs`

## Important Files

- `server/src/app/index.ts` - Express app initialization and middleware configuration
- `server/src/routes/index.ts` - API route aggregation and authentication boundaries
- `server/src/middlewares/auth.ts` - JWT authentication middleware
- `server/src/utils/permissionSync.ts` - Permission synchronization utility
- `server/prisma/schema.prisma` - Complete database schema
- `server/prisma/seed.ts` - Database seeding script
- `.env.test` - Environment variables template

## Testing

- Backend tests use Jest with Supertest
- Test files follow `*.spec.ts` pattern (excluded from build)
- Database operations should use transactions for test isolation

## Environment Setup

Required environment variables (see `.env.test`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - Authentication secrets
- `REDIS_URL` - Redis connection for rate limiting
- `TWILIO_*` - SMS/OTP verification (Twilio)
- `BANK_VERIFICATION_API_URL` / `BANK_VERIFICATION_TOKEN` - Bank account verification

## Development Notes

**Database Migrations:**
- Always run `npx prisma migrate dev` after schema changes
- Use `npx prisma generate` to update Prisma Client
- Seed script available via `npm run seed` in server directory

**Savings vs Personal Savings:**
- **Savings**: Monthly deductions tracked by month/year, split into savings + shares
- **Personal Savings**: Individual voluntary savings plans, separate account balances

**Loan Workflow:**
1. Member applies for loan (creates Loan with PENDING status)
2. Creates Request for approval
3. Multi-level approval via RequestApproval
4. Upon approval, loan status → APPROVED
5. Disbursement creates Transaction and updates status → DISBURSED
6. Repayments update LoanRepayment and LoanSchedule records
7. Bulk repayment uploads via BulkRepaymentUpload tracking

**Module Organization:**
Each module exports its routes via an index file. Routes are protected at two levels:
1. Authentication: Applied to all routes except `/auth`, `/biodata`, `/users`, `/requests`
2. Authorization: Permission-based checks within controllers using role permissions

**Swagger Documentation:**
API documentation available at `http://localhost:5001/api-docs` when server is running. Swagger specs are in `server/src/docs/`.

## Docker Development

The docker-compose setup includes:
- PostgreSQL 17 (port 5432)
- Redis 7 (port 6379)
- Server (port 5001)
- Client (port 3000)

Services communicate via `coop-nest-network`. Database host in Docker is `postgres`, locally is `localhost`.
