
# Analyzing and Updating the CoopNest API Documentation
```markdown
After carefully comparing the Swagger documentation with your existing CoopNest API Doc.md file, I've found several discrepancies and missing endpoints. Below is a comprehensive update to ensure the documentation accurately reflects the implemented API endpoints.

The main discrepancies found:
1. Different endpoint paths in some cases
2. Missing endpoints, especially in loan repayment, biodata, and admin sections
3. Inconsistent naming conventions 

Here's the updated documentation:
```

# CoopNest API Documentation

This comprehensive API documentation outlines all endpoints implemented in the CoopNest Cooperative Management System. The system features sophisticated role-based access control with hierarchical approval levels (0-3) and module-specific permissions.

## Authentication

### Base URL
All endpoints are prefixed with `/api`

### Authentication Method
Most endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Approval Levels
- Level 0: Members (basic access)
- Level 1: Admin (verification, initial review)
- Level 2: Treasurer (financial operations)
- Level 3: Chairman (final approval authority)

## API Endpoints

## 1. Authentication

| Endpoint | Method | Description | Auth Required | Roles/Permissions |
|----------|--------|-------------|--------------|-------------------|
| `/auth/login` | POST | Authenticate user and get tokens | No | None |
| `/auth/user` | POST | Create new user account | No | None |
| `/auth/logout` | POST | Invalidate current session | Yes | Any |
| `/auth/me/sessions` | GET | Get active user sessions | Yes | Any |
| `/auth/me/sessions/invalidate-all` | POST | Invalidate all sessions except current | Yes | Any |

### Request Examples

#### Login
```json
POST /api/auth/login
{
  "username": "johndoe",
  "password": "securePassword123"
}
```

#### Create User
```json
POST /api/auth/user
{
  "biodataId": "550e8400-e29b-41d4-a716-446655440000",
  "username": "johndoe",
  "password": "securePassword123"
}
```
> biodataId [set-cookie]

## 2. User Management

| Endpoint | Method | Description | Auth Required | Roles/Permissions |
|----------|--------|-------------|--------------|-------------------|
| `/users/me` | GET | Get current user profile | Yes | Any |
| `/users/me/change-password` | POST | Change user password | Yes | Any |
| `/users/me/update-username` | POST | Request username update | Yes | Any |
| `/users/me/permissions` | GET | Get current user permissions | Yes | Any |
| `/users/me/module-access` | GET | Get current user module access | Yes | Any |
| `/users/me/requests/assigned` | GET | Get requests assigned for approval | Yes | Any |
| `/users/me/requests/initiated` | GET | Get requests created by user | Yes | Any |
| `/users/me/requests/approved` | GET | Get requests approved by user | Yes | Any |
| `/users/assign-role` | POST | Assign role to user | Yes | MANAGE_ROLES + SUPER_ADMIN |
| `/users/by-role/:roleId` | GET | Get users with specific role | Yes | VIEW_USERS + SUPER_ADMIN |
| `/users/approvers/:level` | GET | Get users who can approve at level | Yes | SUPER_ADMIN |
| `/users/requests/:requestId/approve-username` | POST | Approve username update request | Yes | MANAGE_USERS + SUPER_ADMIN |
| users | GET | List all users with filtering | Yes | VIEW_USERS + ADMIN module |

## 3. Admin Management

| Endpoint | Method | Description | Auth Required | Roles/Permissions |
|----------|--------|-------------|--------------|-------------------|
| `/users/admin/profile` | POST | Create admin profile | Yes | SUPER_ADMIN + Level 3 |
| `/users/admin/verify` | POST | Verify admin phone | No | None |
| `/users/admin/verify-otp` | POST | Verify OTP for admin | No | None |
| `/users/admin/user` | POST | Create admin user | Yes | SUPER_ADMIN + Level 3 |
| `/users/admin/:userId/update` | PUT | Update admin user | Yes | SUPER_ADMIN + Level 3 |
| `/users/admin/:userId/delete` | DELETE | Delete admin user | Yes | SUPER_ADMIN + Level 3 |

## 4. Biodata Management

| Endpoint | Method | Description | Auth Required | Roles/Permissions |
|----------|--------|-------------|--------------|-------------------|
| `/biodata/verify` | POST | Verify biodata phone number (initiates OTP) | No | None |
| `/biodata/verify-otp` | POST | Verify OTP for phone verification | No | None |
| `/biodata` | GET | Get all biodata records with filtering | Yes | VIEW_MEMBERS |
| `/biodata` | POST | Create new biodata record | Yes | CREATE_MEMBERS |
| `/biodata/{id}` | GET | Get biodata by ID | Yes | VIEW_MEMBERS |
| `/biodata/{id}` | PUT | Update biodata record | Yes | EDIT_MEMBERS |
| `/biodata/{id}` | DELETE | Delete biodata record | Yes | DELETE_MEMBERS + ADMIN |
| `/biodata/{id}/verify` | POST | Verify biodata record | Yes | VERIFY_MEMBERS + Level 1+ |
| `/biodata/member/unapproved` | GET | Get unapproved biodata records | Yes | APPROVE_MEMBERS + Level 2+ |
| `/biodata/member/approve` | POST | Approve member biodata | Yes | APPROVE_MEMBERS + Level 2+ |
| `/biodata/member/{id}/status` | POST | Update membership status | Yes | MANAGE_MEMBERS + Level 2+ |

### Biodata Upload (Bulk Operations)

| Endpoint | Method | Description | Auth Required | Roles/Permissions |
|----------|--------|-------------|--------------|-------------------|
| `/biodata/upload` | POST | Upload bulk biodata records (Excel) | Yes | UPLOAD_BIODATA + Level 2+ |
| `/biodata/upload/{requestId}/status` | GET | Check upload status | Yes | VIEW_BIODATA_UPLOADS + Level 2+ |
| `/biodata/upload/{requestId}/cancel` | POST | Cancel upload request | Yes | MANAGE_BIODATA_UPLOADS + Level 2+ |
| `/biodata/backup/export` | GET | Export biodata backup | Yes | BACKUP_BIODATA + Level 3 |

## 5. Bank Account Management

| Endpoint | Method | Description | Auth Required | Roles/Permissions |
|----------|--------|-------------|--------------|-------------------|
| `/accounts` | POST | Create new bank account | Yes | Any |
| `/accounts` | GET | Get all bank accounts with filtering | Yes | VIEW_ACCOUNTS |
| `/accounts/me` | GET | Get authenticated user's bank account | Yes | Any |
| `/accounts/{id}` | GET | Get bank account by ID | Yes | VIEW_ACCOUNTS |
| `/accounts/{id}/update-request` | POST | Request account update | Yes | Any |
| `/accounts/verify` | POST | Verify bank account details | Yes | VERIFY_ACCOUNTS |
| `/accounts/requests/{requestId}/process` | POST | Process account update request | Yes | APPROVE_ACCOUNTS + Level 2+ |

## 6. Loan Management

| Endpoint | Method | Description | Auth Required | Roles/Permissions |
|----------|--------|-------------|--------------|-------------------|
| `/loan/types` | GET | Get available loan types | Yes | VIEW_LOANS |
| `/loan/eligibility` | POST | Check loan eligibility | Yes | INITIATE_LOAN |
| `/loan/calculate` | POST | Calculate loan terms | Yes | INITIATE_LOAN |
| `/loan/apply` | POST | Apply for loan | Yes | INITIATE_LOAN |
| `/loan/member/{biodataId}` | GET | Get member's loans | Yes | VIEW_LOANS |
| `/loan/{id}` | GET | Get loan details | Yes | VIEW_LOANS |
| `/loan/{id}/status` | PATCH | Update loan status | Yes | APPROVE_LOANS + Level based* |
| `/loan/summary` | GET | Get loans summary | Yes | VIEW_LOANS + Level 2+ |

*Status update approval levels:
- REVIEWED: Level 1 (Admin)  
- DISBURSED: Level 2 (Treasurer)
- APPROVED/REJECTED: Level 3 (Chairman)

## 7. Loan Repayment 

| Endpoint | Method | Description | Auth Required | Roles/Permissions |
|----------|--------|-------------|--------------|-------------------|
| `/loan/repayment/process` | POST | Process single repayment | Yes | PROCESS_REPAYMENT + Level 2 |
| `/loan/repayment/bulk` | POST | Process bulk repayments | Yes | PROCESS_REPAYMENT + Level 2 |
| `/loan/repayment/template` | GET | Download repayment template | Yes | PROCESS_REPAYMENT + Level 1 |
| `/loan/repayment/monthly-template` | GET | Download monthly repayment template by loan type | Yes | PROCESS_REPAYMENT + Level 1 |
| `/loan/repayment/loan/{loanId}` | GET | Get loan repayment history | Yes | VIEW_LOANS |
| `/loan/repayment/outstanding` | GET | Get outstanding loans | Yes | VIEW_LOANS + Level 2 |
| `/loan/repayment/member/{erpId}` | GET | Get member repayment history | Yes | VIEW_LOANS |
| `/loan/repayment/aging-report` | GET | Get loan aging report | Yes | GENERATE_REPORTS + Level 2 |
| `/loan/repayment/check-overdue` | POST | Check and update overdue payments | Yes | MANAGE_LOANS + Level 2 |
| `/loan/repayment/monthly-report` | GET | Get monthly repayment report | Yes | GENERATE_REPORTS + Level 2 |

## 8. Savings Management

| Endpoint | Method | Description | Auth Required | Roles/Permissions |
|----------|--------|-------------|--------------|-------------------|
| `/savings/my-savings` | GET | Get member's savings | Yes | VIEW_SAVINGS |
| `/savings/summary` | GET | Get savings summary | Yes | VIEW_SAVINGS |
| `/savings/transactions/{savingsId}` | GET | Get transaction history | Yes | VIEW_SAVINGS |
| `/savings/monthly/{year}/{month}` | GET | Get monthly savings | Yes | VIEW_SAVINGS |
| `/savings/stats/{year}` | GET | Get savings statistics | Yes | VIEW_SAVINGS |
| `/savings` | GET | Get all savings records | Yes | VIEW_ALL_SAVINGS |
| `/savings/create` | POST | Create savings entry | Yes | PROCESS_DEPOSITS |
| `/savings/upload` | POST | Upload bulk savings | Yes | UPLOAD_SAVINGS + Level 3 |
| `/savings/backup` | GET | Backup savings data | Yes | PROCESS_SAVINGS + Level 3 |
| `/savings/statement/{erpId}` | GET | Get savings statement | Yes | VIEW_SAVINGS |

## 9. Requests Management

| Endpoint | Method | Description | Auth Required | Roles/Permissions |
|----------|--------|-------------|--------------|-------------------|
| `/requests` | GET | Get all requests with filtering | Yes | VIEW_ALL_REQUESTS |
| `/requests/pending-count` | GET | Get pending request count | Yes | VIEW_ALL_REQUESTS |
| `/requests/{id}` | GET | Get request details | Yes | VIEW_ALL_REQUESTS |
| `/requests/{id}` | PUT | Update request | Yes | PROCESS_REQUESTS |
| `/requests/{id}` | DELETE | Delete request | Yes | PROCESS_REQUESTS |

## 10. Transactions

| Endpoint | Method | Description | Auth Required | Roles/Permissions |
|----------|--------|-------------|--------------|-------------------|
| `/transactions` | GET | Get all transactions | Yes | VIEW_TRANSACTIONS |
| `/transactions/{id}` | GET | Get transaction by ID | Yes | VIEW_TRANSACTIONS |
| `/transactions/entity/{entityType}/{entityId}` | GET | Get entity transactions | Yes | VIEW_TRANSACTIONS |
| `/transactions/summary` | GET | Get transaction summary | Yes | VIEW_TRANSACTIONS |

## Request Parameters

### Biodata Filtering
```
GET /api/biodata?searchTerm=John&department=Finance&isVerified=true&membershipStatus=ACTIVE&page=1&limit=10
```

### Account Filtering
```
GET /api/accounts?status=ACTIVE&verificationStatus=VERIFIED&page=1&limit=10
```

### Request Filtering
```
GET /api/requests?type=LOAN_APPLICATION&status=PENDING&startDate=2025-01-01&endDate=2025-05-23&page=1&limit=10
```

## Request Bodies

### Create Biodata
```json
POST /api/biodata
{
  "erpId": "ERP123456",
  "ippisId": "IPPIS123456",
  "firstName": "John",
  "lastName": "Doe",
  "middleName": "Smith",
  "dateOfEmployment": "2020-01-15T00:00:00.000Z",
  "staffNo": "STAFF001",
  "department": "IT",
  "residentialAddress": "123 Main Street",
  "emailAddress": "john.doe@example.com",
  "phoneNumber": "+2348012345678",
  "nextOfKin": "Jane Doe",
  "relationshipOfNextOfKin": "Spouse",
  "nextOfKinPhoneNumber": "+2348087654321",
  "nextOfKinEmailAddress": "jane.doe@example.com"
}
```

### Process Loan Repayment
```json
POST /api/loan/repayment/process
{
  "loanId": "550e8400-e29b-41d4-a716-446655440000",
  "erpId": "ERP123456",
  "scheduleId": "550e8400-e29b-41d4-a716-446655440001",
  "repaymentMonth": 5,
  "repaymentYear": 2025,
  "uploadedAmount": "50000.00",
  "repaymentDate": "2025-05-15T00:00:00.000Z"
}
```

### Approve Biodata
```json
POST /api/biodata/member/approve
{
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "approverNotes": "All documents verified and approved"
}
```

### Apply for Loan
```json
POST /api/loan/apply
{
  "loanTypeId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 500000,
  "tenor": 12,
  "purpose": "Home renovation",
  "guarantor1Id": "550e8400-e29b-41d4-a716-446655440001",
  "guarantor2Id": "550e8400-e29b-41d4-a716-446655440002"
}
```

## Response Structure

All API responses follow a consistent structure:

### Success Response
```json
{
  "success": true,
  "status": "success",
  "message": "Operation completed successfully",
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "status": "error",
  "message": "Error message details",
  "code": 400
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

## Approval Workflows

### Biodata Approval Flow
1. Admin creates/verifies biodata (Level 1)
2. Treasurer reviews and approves (Level 2)
3. System processes approval and creates notifications

### Bulk Upload Approval Flow
1. Treasurer uploads data (Level 2)
2. Chairman reviews and approves (Level 3)
3. System processes all records and sends notifications

### Account Update Request Flow
1. Member initiates account update request
2. System creates approval workflow
3. Treasurer/Chairman approves based on approval level requirements (Level 2+)
4. System processes updates and sends notifications

## Security Considerations

- All endpoints require HTTPS
- Token expiration is set to 1 hour
- Sessions are tracked with device fingerprinting
- Rate limiting is applied to sensitive endpoints
- Permission checks are enforced on all protected routes
- Approval levels are validated for sensitive operations
```

This updated documentation now correctly reflects the API endpoints implemented in your system as shown in the Swagger documentation. The key changes include:

1. Corrected path naming (e.g., `/loan/` paths instead of `/loans/`)
2. Added missing endpoints for admin management
3. Added additional loan repayment endpoints
4. Corrected the biodata endpoints structure
5. Added the transactions endpoints section
6. Updated request examples to match the API structure
7. Reorganized sections to match the logical flow in the Swagger docsThis updated documentation now correctly reflects the API endpoints implemented in your system as shown in the Swagger documentation. The key changes include:

1. Corrected path naming (e.g., `/loan/` paths instead of `/loans/`)
2. Added missing endpoints for admin management
3. Added additional loan repayment endpoints
4. Corrected the biodata endpoints structure
5. Added the transactions endpoints section
6. Updated request examples to match the API structure
7. Reorganized sections to match the logical flow in the Swagger docs