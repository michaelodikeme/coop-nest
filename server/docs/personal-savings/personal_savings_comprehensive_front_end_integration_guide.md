# Comprehensive Review and Frontend Integration Guide for Personal Savings Module

## Table of Contents
1. Module Overview
2. Feature Analysis
3. Business Logic and Workflow
4. Approval Process
5. API Endpoints
6. Security and Access Control
7. Data Models and Interfaces
8. Frontend Integration Strategy
9. Client-Side Implementation Plan
10. Conclusion

## Module Overview

The Personal Savings module is a comprehensive financial management component within the cooperative system that allows members to create and manage personal savings plans outside the regular cooperative savings account. This module is built with a robust role-based access control system, multi-level approval workflows, and clear separation between admin and member operations.

The module provides functionality for:
1. Requesting creation of personal savings plans
2. Processing deposits to savings plans (admin function)
3. Requesting withdrawals from savings plans
4. Tracking transaction history
5. Visualizing balance history
6. Generating member and admin dashboards
7. Closing savings plans

## Feature Analysis

### 1. Personal Savings Plan Creation
The system implements a request-based workflow for plan creation:
- Members initiate a request using `requestPersonalSavingsCreation`
- The request enters an approval workflow managed by `RequestService`
- Multiple approval levels are required before plan creation (Treasurer → Chairman)
- Once approved, the personal savings plan is automatically created and activated

### 2. Deposits Processing
- Only admin users (Admin, Treasurer, Chairman) can process deposits
- Each deposit is recorded as a transaction with proper history tracking
- Balance is automatically updated after each deposit
- Transaction records include metadata like initiator, timestamp, and descriptions

### 3. Withdrawal Management
- Implements a 7-day rule preventing withdrawals within a week of the last deposit
- Follows a multi-level approval process (Treasurer → Chairman → Treasurer)
- Validates sufficient balance before allowing withdrawal requests
- Uses the request workflow for tracking approval status
- Provides status updates through the entire process

### 4. Balance History and Analytics
- Tracks detailed transaction history with filtering capabilities
- Provides time-series data for balance visualization
- Enforces ownership validation for data access
- Formats data for chart display with proper date handling

### 5. Admin Dashboard
- Provides aggregate statistics (active plans, total savings, withdrawal amounts)
- Lists pending requests for both creation and withdrawals
- Displays recent transactions across the system
- Implements role-based access restrictions

### 6. Member Summary
- Shows personal statistics for individual members
- Lists active plans with balances
- Provides aggregate totals for deposits, withdrawals, and current balance
- Enforces ownership validation for data access

## Business Logic and Workflow

### Plan Lifecycle
1. **Request Phase**: Member requests plan creation through `requestPersonalSavingsCreation`
2. **Approval Phase**: Request goes through the approval workflow:
   - Treasurer reviews financial aspects
   - Chairman gives final approval
3. **Active Phase**: Once approved, the plan is created and activated
   - Members can view their plan details
   - Admins can process deposits into the plan
   - Members can request withdrawals (subject to 7-day rule)
4. **Withdrawal Phase**:
   - Member creates withdrawal request
   - Goes through approval workflow
   - Upon approval, funds are disbursed
5. **Closure Phase**: Plan can be closed when balance reaches zero

### Deposit Flow
1. Admin initiates deposit through the `processDeposit` method
2. System validates plan status and existence
3. A transaction record is created with type `PERSONAL_SAVINGS_DEPOSIT`
4. Plan balance is updated atomically within a database transaction
5. Formatted response is returned with updated plan details

### Withdrawal Flow
1. Member initiates withdrawal through the `requestWithdrawal` method
2. System performs validations:
   - Sufficient balance check
   - 7-day rule validation
   - Active plan status check
3. Creates withdrawal request in the request approval workflow
4. Upon final approval, transaction is created and balance updated

## Approval Process

The module leverages a sophisticated approval workflow through the `RequestService`, specifically using the `getApprovalStepsForRequestType` method to define approval chains based on request types.

### Personal Savings Creation Approval Path
```
PERSONAL_SAVINGS_CREATION:
  Level 1: Treasurer (Initial financial review)
  Level 2: Chairman (Final approval)
```

This is defined in the `getApprovalStepsForRequestType` method:
```typescript
case RequestType.PERSONAL_SAVINGS_CREATION:
  return [
    {
      level: 1,
      status: ApprovalStatus.PENDING,
      approverRole: 'TREASURER',
      notes: 'Initial personal savings creation review'
    },
    {
      level: 2,
      status: ApprovalStatus.PENDING,
      approverRole: 'CHAIRMAN',
      notes: 'Financial verification'
    }
  ];
```

### Personal Savings Withdrawal Approval Path
```
PERSONAL_SAVINGS_WITHDRAWAL:
  Level 1: Treasurer (Initial review)
  Level 2: Chairman (Approval)
  Level 3: Treasurer (Processing)
```

This is defined as:
```typescript
case RequestType.PERSONAL_SAVINGS_WITHDRAWAL:
  return [
    {
      level: 1,
      status: ApprovalStatus.PENDING,
      approverRole: 'TREASURER',
      notes: 'Initial personal savings withdrawal request review'
    },
    {
      level: 2,
      status: ApprovalStatus.PENDING,
      approverRole: 'CHAIRMAN',
      notes: 'Approval for personal savings withdrawal'
    },
    {
      level: 3,
      status: ApprovalStatus.PENDING,
      approverRole: 'TREASURER',
      notes: 'Withdrawal processing'
    }
  ];
```

### Request Status Flow
Each request moves through statuses as defined in `getValidStatusTransitions`:
- `PENDING` → `IN_REVIEW`/`REVIEWED`/`REJECTED`/`CANCELLED`
- `IN_REVIEW` → `REVIEWED`/`REJECTED`/`CANCELLED`
- `REVIEWED` → `APPROVED`/`REJECTED`/`CANCELLED`
- `APPROVED` → `COMPLETED`/`REJECTED`/`CANCELLED`

## API Endpoints

The Personal Savings module exposes the following endpoints:

### Plan Management
- `POST /request` - Request creation of a new personal savings plan
- `GET /:id` - Get specific personal savings plan details
- `GET /` - List all personal savings plans (filtered by user for non-admins)
- `PATCH /:id/close` - Close a personal savings plan (zero balance required)

### Transactions
- `POST /:id/deposit` - Process deposit to savings plan (admin only)
- `POST /:id/withdraw` - Request withdrawal from savings plan
- `GET /:id/transactions` - Get transaction history for a plan

### Analytics
- `GET /:id/balance-history` - Get balance history for charts
- `GET /member/:erpId/summary` - Get member's savings summary
- `GET /admin/dashboard` - Get admin dashboard data

All endpoints implement proper authorization checks through middleware:
- `authenticateUser` - Ensures user is authenticated
- `checkModuleAccess('SAVINGS')` - Ensures module access
- `checkPermission(permission)` - Checks specific permissions
- `authorizeRoles(roles)` - Restricts access to specific roles

## Security and Access Control

The module implements a robust permission-based security model:

### Role-Based Access
- **Members** can:
  - Request plan creation
  - View their own plans
  - Request withdrawals
- **Admins** (including Treasurer and Chairman) can:
  - Process deposits
  - View all plans
  - Access dashboards
  - Close plans

### Permissions
Key permissions include:
- `CREATE_PERSONAL_SAVINGS` - For plan creation requests
- `VIEW_PERSONAL_SAVINGS` - For viewing plans
- `PROCESS_PERSONAL_SAVINGS_DEPOSITS` - For processing deposits
- `REQUEST_WITHDRAWAL` - For requesting withdrawals
- `MANAGE_PERSONAL_SAVINGS` - For closing plans

### Data Ownership Validation
The service methods validate ownership before allowing access:
```typescript
// Example from getPersonalSavingsById
if (!isAdmin && !Array.isArray(plan.member.users) || 
    !plan.member.users.some((user: { id: string }) => user.id === userId)) {
  throw new ApiError('You do not have permission to access this plan', 403);
}
```

## Data Models and Interfaces

### Core Response Interface
```typescript
interface IPersonalSavingsResponse {
  id: string;
  erpId: string;
  planTypeId: string;
  planName?: string;
  targetAmount?: Decimal;
  currentBalance: Decimal;
  status: PersonalSavingsStatus;
  createdAt: Date;
  updatedAt: Date;
  member: {
    id: string;
    name: string;
    department: string;
  };
  transactions?: Array<{
    id: string;
    amount: Decimal;
    transactionType: TransactionType;
    transactionBaseType: TransactionType;
    status: TransactionStatus;
    description: string | null;
    createdAt: Date;
  }>;
}
```

### Request/Response Structures
- **Plan Creation Request**:
  ```typescript
  {
    erpId: string;
    planTypeId: string;
    planName?: string;
    targetAmount?: number;
    notes?: string;
  }
  ```

- **Deposit Request**:
  ```typescript
  {
    amount: number;
    description?: string;
  }
  ```

- **Withdrawal Request**:
  ```typescript
  {
    amount: number;
    reason?: string;
  }
  ```

- **Member Summary Response**:
  ```typescript
  {
    totalSaved: number;
    totalWithdrawals: number;
    currentBalance: number;
    plansCount: number;
    activePlans: IPersonalSavingsResponse[];
  }
  ```

- **Admin Dashboard Response**:
  ```typescript
  {
    activePlansCount: number;
    totalSavingsAmount: number;
    totalWithdrawalAmount: number;
    pendingCreationRequests: number;
    pendingWithdrawalRequests: number;
    recentTransactions: Array<{
      id: string;
      amount: Decimal;
      transactionType: TransactionType;
      transactionBaseType: TransactionType;
      status: TransactionStatus;
      date: Date;
      memberName: string;
      department: string;
      planName: string;
      planDescription: string;
      initiator: string;
    }>;
  }
  ```

## Frontend Integration Strategy

Given the comprehensive understanding of both the backend module and the Next.js client structure, here's a robust integration strategy for the Personal Savings module in the frontend.

### Client Directory Structure Analysis

The Next.js client application follows a modern, well-organized structure:
- `/app` - Directory for page components using Next.js App Router
- `/components` - Reusable UI components
- `/lib` - Utility functions, hooks, and APIs
  - `/lib/api` - API service functions
  - `/lib/hooks` - Custom React hooks
  - `/lib/utils` - Utility functions

### API Services Implementation

First, let's create API service functions for personal savings:

```typescript
import { apiClient } from './apiClient';
import type { 
  PersonalSavingsResponse, 
  PaginatedResponse,
  MemberSummary,
  AdminDashboard,
  BalanceHistory,
  Transaction
} from '@/types/personalSavings';

// Plan Management
export const requestPersonalSavingsPlan = async (data: {
  erpId: string;
  planTypeId: string;
  planName?: string;
  targetAmount?: number;
  notes?: string;
}) => {
  return apiClient.post('/savings/personal/request', data);
};

export const getPersonalSavingsPlans = async (params?: {
  page?: number;
  limit?: number;
  erpId?: string;
  status?: string;
  sort?: 'asc' | 'desc';
}): Promise<PaginatedResponse<PersonalSavingsResponse>> => {
  return apiClient.get('/savings/personal', { params });
};

export const getPersonalSavingsPlanById = async (id: string): Promise<PersonalSavingsResponse> => {
  const response = await apiClient.get(`/savings/personal/${id}`);
  return response.data;
};

export const closePlan = async (id: string) => {
  return apiClient.patch(`/savings/personal/${id}/close`);
};

// Transaction Management
export const processDeposit = async (id: string, data: {
  amount: number;
  description?: string;
}) => {
  return apiClient.post(`/savings/personal/${id}/deposit`, data);
};

export const requestWithdrawal = async (id: string, data: {
  amount: number;
  reason?: string;
}) => {
  return apiClient.post(`/savings/personal/${id}/withdraw`, data);
};

export const getTransactionHistory = async (id: string, params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
}): Promise<PaginatedResponse<Transaction>> => {
  return apiClient.get(`/savings/personal/${id}/transactions`, { params });
};

// Analytics
export const getBalanceHistory = async (id: string, params?: {
  startDate?: string;
  endDate?: string;
}): Promise<BalanceHistory> => {
  const response = await apiClient.get(`/savings/personal/${id}/balance-history`, { params });
  return response.data;
};

export const getMemberSummary = async (erpId: string): Promise<MemberSummary> => {
  const response = await apiClient.get(`/savings/personal/member/${erpId}/summary`);
  return response.data;
};

export const getAdminDashboard = async (): Promise<AdminDashboard> => {
  const response = await apiClient.get('/savings/personal/admin/dashboard');
  return response.data;
};
```

### Type Definitions

```typescript
export enum PersonalSavingsStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED'
}

export enum TransactionType {
  PERSONAL_SAVINGS_DEPOSIT = 'PERSONAL_SAVINGS_DEPOSIT',
  PERSONAL_SAVINGS_WITHDRAWAL = 'PERSONAL_SAVINGS_WITHDRAWAL'
}

export interface PersonalSavingsResponse {
  id: string;
  erpId: string;
  planTypeId: string;
  planName?: string;
  targetAmount?: number;
  currentBalance: number;
  status: PersonalSavingsStatus;
  createdAt: string;
  updatedAt: string;
  member: {
    id: string;
    name: string;
    department: string;
  };
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  amount: number;
  transactionType: TransactionType;
  transactionBaseType: string;
  status: string;
  description?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MemberSummary {
  totalSaved: number;
  totalWithdrawals: number;
  currentBalance: number;
  plansCount: number;
  activePlans: PersonalSavingsResponse[];
}

export interface BalanceHistory {
  history: {
    date: string;
    balance: number;
  }[];
  memberErpId: string;
  memberName: string;
  planName?: string;
  currentBalance: number;
}

export interface AdminDashboard {
  activePlansCount: number;
  totalSavingsAmount: number;
  totalWithdrawalAmount: number;
  pendingCreationRequests: number;
  pendingWithdrawalRequests: number;
  recentTransactions: {
    id: string;
    amount: number;
    transactionType: TransactionType;
    transactionBaseType: string;
    status: string;
    date: string;
    memberName: string;
    department: string;
    planName: string;
    planDescription: string;
    initiator: string;
  }[];
}
```

### Custom React Hooks

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as personalSavingsApi from '@/lib/api/personalSavings';
import { useToast } from '@/components/ui/use-toast';

export function usePersonalSavingsPlans(params) {
  return useQuery({
    queryKey: ['personalSavingsPlans', params],
    queryFn: () => personalSavingsApi.getPersonalSavingsPlans(params),
  });
}

export function usePersonalSavingsPlan(id) {
  return useQuery({
    queryKey: ['personalSavingsPlan', id],
    queryFn: () => personalSavingsApi.getPersonalSavingsPlanById(id),
    enabled: !!id,
  });
}

export function useCreatePersonalSavingsPlan() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: personalSavingsApi.requestPersonalSavingsPlan,
    onSuccess: () => {
      toast.toast({
        title: "Success",
        description: "Personal savings plan request submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlans'] });
    },
    onError: (error) => {
      toast.toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      });
    }
  });
}

export function useProcessDeposit() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: ({id, data}) => personalSavingsApi.processDeposit(id, data),
    onSuccess: (_, variables) => {
      toast.toast({
        title: "Success",
        description: "Deposit processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlan', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.id] });
    },
    onError: (error) => {
      toast.toast({
        title: "Error",
        description: error.message || "Failed to process deposit",
        variant: "destructive",
      });
    }
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: ({id, data}) => personalSavingsApi.requestWithdrawal(id, data),
    onSuccess: () => {
      toast.toast({
        title: "Success",
        description: "Withdrawal request submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlans'] });
    },
    onError: (error) => {
      toast.toast({
        title: "Error",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    }
  });
}

export function useClosePlan() {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: personalSavingsApi.closePlan,
    onSuccess: (_, id) => {
      toast.toast({
        title: "Success",
        description: "Plan closed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlan', id] });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlans'] });
    },
    onError: (error) => {
      toast.toast({
        title: "Error",
        description: error.message || "Failed to close plan",
        variant: "destructive",
      });
    }
  });
}

export function useMemberSummary(erpId) {
  return useQuery({
    queryKey: ['personalSavingsMemberSummary', erpId],
    queryFn: () => personalSavingsApi.getMemberSummary(erpId),
    enabled: !!erpId,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['personalSavingsAdminDashboard'],
    queryFn: personalSavingsApi.getAdminDashboard,
  });
}

export function useBalanceHistory(id, params) {
  return useQuery({
    queryKey: ['personalSavingsBalanceHistory', id, params],
    queryFn: () => personalSavingsApi.getBalanceHistory(id, params),
    enabled: !!id,
  });
}

export function useTransactionHistory(id, params) {
  return useQuery({
    queryKey: ['transactions', id, params],
    queryFn: () => personalSavingsApi.getTransactionHistory(id, params),
    enabled: !!id,
  });
}
```

## Client-Side Implementation Plan

### 1. Component Structure

#### Member Components

```typescript
import { usePersonalSavingsPlans } from '@/lib/hooks/usePersonalSavings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PersonalSavingsStatus } from '@/types/personalSavings';
import { formatCurrency } from '@/lib/utils/format';
import { PaginationControls } from '@/components/ui/pagination';
import { useState } from 'react';
import Link from 'next/link';

export function PlansList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = usePersonalSavingsPlans({ 
    page,
    limit: 10
  });

  if (isLoading) return <p>Loading plans...</p>;
  if (error) return <p>Error loading plans: {error.message}</p>;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Savings Plans</h2>
        <Link href="/dashboard/savings/personal/create">
          <Button>Request New Plan</Button>
        </Link>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {data?.data.map(plan => (
          <Card key={plan.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>{plan.planName || "Savings Plan"}</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  plan.status === PersonalSavingsStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                  plan.status === PersonalSavingsStatus.CLOSED ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {plan.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">ID: {plan.id.substring(0, 8)}</p>
              <p className="font-medium mt-2">Current Balance: {formatCurrency(plan.currentBalance)}</p>
              {plan.targetAmount && (
                <p className="text-sm">Target: {formatCurrency(plan.targetAmount)}</p>
              )}
              <div className="mt-4">
                <Link href={`/dashboard/savings/personal/${plan.id}`}>
                  <Button variant="outline" size="sm" className="w-full">View Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {data && (
        <PaginationControls
          currentPage={page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

// filepath: client/components/savings/personal/member/MemberSummary.tsx
import { useMemberSummary } from '@/lib/hooks/usePersonalSavings';
import { useUser } from '@/lib/hooks/useUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';

export function MemberSummary() {
  const { user } = useUser();
  const { data, isLoading } = useMemberSummary(user?.erpId);
  
  if (isLoading || !data) return <p>Loading summary...</p>;
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Personal Savings Summary</h2>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.totalSaved)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.totalWithdrawals)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.currentBalance)}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Plans ({data.activePlans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.activePlans.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No active plans found</p>
          ) : (
            <div className="space-y-4">
              {data.activePlans.map(plan => (
                <div key={plan.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{plan.planName || "Savings Plan"}</p>
                    <p className="text-sm text-gray-500">Created: {new Date(plan.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(plan.currentBalance)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// filepath: client/components/savings/personal/member/PlanDetails.tsx
import { usePersonalSavingsPlan, useBalanceHistory, useRequestWithdrawal } from '@/lib/hooks/usePersonalSavings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PersonalSavingsStatus } from '@/types/personalSavings';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { TransactionHistory } from '../shared/TransactionHistory';
import { BalanceChart } from '../shared/BalanceChart';

const withdrawalSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  reason: z.string().optional()
});

export function PlanDetails({ id }) {
  const { data: plan, isLoading } = usePersonalSavingsPlan(id);
  const { data: balanceHistory } = useBalanceHistory(id, {});
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);
  const withdrawalMutation = useRequestWithdrawal();
  
  const form = useForm({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: 0,
      reason: ''
    }
  });
  
  if (isLoading || !plan) return <p>Loading plan details...</p>;
  
  const handleWithdrawal = (data) => {
    withdrawalMutation.mutate({
      id: plan.id,
      data: {
        amount: data.amount,
        reason: data.reason
      }
    }, {
      onSuccess: () => setIsWithdrawalOpen(false)
    });
  };
  
  const isActive = plan.status === PersonalSavingsStatus.ACTIVE;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{plan.planName || "Savings Plan"}</h1>
        
        {isActive && (
          <Dialog open={isWithdrawalOpen} onOpenChange={setIsWithdrawalOpen}>
            <DialogTrigger asChild>
              <Button>Request Withdrawal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Withdrawal</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleWithdrawal)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Reason for withdrawal" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={withdrawalMutation.isPending}
                  >
                    {withdrawalMutation.isPending ? 'Submitting...' : 'Submit Withdrawal Request'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(plan.currentBalance)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{plan.status}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{plan.targetAmount ? formatCurrency(plan.targetAmount) : 'N/A'}</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="transactions">
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="space-y-4">
          <TransactionHistory planId={id} />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          {balanceHistory && <BalanceChart data={balanceHistory} />}
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <p className="text-sm font-medium text-muted-foreground">Plan ID:</p>
                <p>{plan.id}</p>
                
                <p className="text-sm font-medium text-muted-foreground">Member:</p>
                <p>{plan.member.name}</p>
                
                <p className="text-sm font-medium text-muted-foreground">Department:</p>
                <p>{plan.member.department}</p>
                
                <p className="text-sm font-medium text-muted-foreground">Created:</p>
                <p>{new Date(plan.createdAt).toLocaleDateString()}</p>
                
                <p className="text-sm font-medium text-muted-foreground">Last Updated:</p>
                <p>{new Date(plan.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### Admin Components

```typescript
import { useAdminDashboard } from '@/lib/hooks/usePersonalSavings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { TransactionType } from '@/types/personalSavings';
import Link from 'next/link';

export function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();
  
  if (isLoading || !data) return <p>Loading dashboard data...</p>;
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Personal Savings Dashboard</h1>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.activePlansCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.totalSavingsAmount)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.totalWithdrawalAmount)}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md">Pending Requests</CardTitle>
            <Link href="/admin/requests">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Creation Requests</span>
                <span className="font-bold">{data.pendingCreationRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Withdrawal Requests</span>
                <span className="font-bold">{data.pendingWithdrawalRequests}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No recent transactions</p>
            ) : (
              <div className="space-y-4">
                {data.recentTransactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{tx.memberName}</p>
                      <p className="text-sm text-gray-500">
                        {tx.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? 'Deposit' : 'Withdrawal'}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleString()}</p>
                    </div>
                    <p className={`font-bold ${
                      tx.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {tx.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// filepath: client/components/savings/personal/admin/PlansList.tsx
// Similar to member PlansList but with admin controls for processing deposits

// filepath: client/components/savings/personal/admin/DepositForm.tsx
import { useProcessDeposit } from '@/lib/hooks/usePersonalSavings';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { PersonalSavingsStatus } from '@/types/personalSavings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const depositSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  description: z.string().optional()
});

export function DepositForm({ plan }) {
  const depositMutation = useProcessDeposit();
  
  const form = useForm({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0,
      description: ''
    }
  });
  
  const handleDeposit = (data) => {
    depositMutation.mutate({
      id: plan.id,
      data: {
        amount: data.amount,
        description: data.description
      }
    });
  };
  
  const isActive = plan.status === PersonalSavingsStatus.ACTIVE;
  
  if (!isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Process Deposit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-600">
            Deposits can only be processed for active plans. This plan is currently {plan.status.toLowerCase()}.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Deposit</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleDeposit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deposit description" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={depositMutation.isPending}
            >
              {depositMutation.isPending ? 'Processing...' : 'Process Deposit'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

#### Shared Components

```typescript
import { useTransactionHistory } from '@/lib/hooks/usePersonalSavings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionType } from '@/types/personalSavings';
import { formatCurrency } from '@/lib/utils/format';
import { PaginationControls } from '@/components/ui/pagination';
import { useState } from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function TransactionHistory({ planId }) {
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [transactionType, setTransactionType] = useState('');
  
  const { data, isLoading } = useTransactionHistory(planId, {
    page,
    limit: 10,
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
    type: transactionType || undefined
  });
  
  if (isLoading) return <p>Loading transactions...</p>;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mt-2">
          <div>
            <Label>Date Range</Label>
            <DateRangePicker 
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
          
          <div>
            <Label>Transaction Type</Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value={TransactionType.PERSONAL_SAVINGS_DEPOSIT}>Deposits</SelectItem>
                <SelectItem value={TransactionType.PERSONAL_SAVINGS_WITHDRAWAL}>Withdrawals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!data?.data.length ? (
          <p className="text-center py-4 text-gray-500">No transactions found</p>
        ) : (
          <div className="space-y-4">
            {data.data.map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">
                    {tx.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? 'Deposit' : 'Withdrawal'}
                  </p>
                  <p className="text-sm text-gray-500">{tx.description || 'No description'}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
                <p className={`font-bold ${
                  tx.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {tx.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
        
        {data && data.meta.totalPages > 1 && (
          <div className="mt-4">
            <PaginationControls
              currentPage={page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// filepath: client/components/savings/personal/shared/BalanceChart.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

export function BalanceChart({ data }) {
  if (!data?.history || data.history.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance History</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">Not enough data to display chart</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })} />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => `Date: ${label}`} />
              <Line type="monotone" dataKey="balance" stroke="#0070f3" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2. Pages Implementation

#### Member Pages

```typescript
"use client";

import { MemberSummary } from '@/components/savings/personal/member/MemberSummary';
import { PlansList } from '@/components/savings/personal/member/PlansList';

export default function PersonalSavingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <MemberSummary />
      <PlansList />
    </div>
  );
}

// filepath: client/app/dashboard/savings/personal/create/page.tsx
"use client";

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useCreatePersonalSavingsPlan } from '@/lib/hooks/usePersonalSavings';
import { usePlanTypes } from '@/lib/hooks/usePlanTypes';
import { useUser } from '@/lib/hooks/useUser';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

const createPlanSchema = z.object({
  planTypeId: z.string().uuid('Please select a plan type'),
  planName: z.string().optional(),
  targetAmount: z.number().optional(),
  notes: z.string().optional()
});

export default function CreatePersonalSavingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const { data: planTypes, isLoading: loadingPlanTypes } = usePlanTypes();
  const createMutation = useCreatePersonalSavingsPlan();
  
  const form = useForm({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      planTypeId: '',
      planName: '',
      targetAmount: undefined,
      notes: ''
    }
  });
  
  const handleCreatePlan = (data) => {
    if (!user?.erpId) return;
    
    createMutation.mutate({
      erpId: user.erpId,
      ...data
    }, {
      onSuccess: () => {
        router.push('/dashboard/savings/personal');
      }
    });
  };
  
  return (
    <div className="container mx-auto py-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Request New Savings Plan</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>New Plan Request</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreatePlan)} className="space-y-4">
              <FormField
                control={form.control}
                name="planTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plan type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingPlanTypes ? (
                          <SelectItem value="" disabled>Loading...</SelectItem>
                        ) : (
                          planTypes?.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="planName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="My Savings Plan" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Amount (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Target amount" 
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Submitting...' : 'Request Savings Plan'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// filepath: client/app/dashboard/savings/personal/[id]/page.tsx
"use client";

import { PlanDetails } from '@/components/savings/personal/member/PlanDetails';

export default function PersonalSavingsPlanPage({ params }) {
  const { id } = params;
  
  return (
    <div className="container mx-auto py-6">
      <PlanDetails id={id} />
    </div>
  );
}
```

---

### Continuation
# Comprehensive Analysis of Personal Savings Module and Frontend Integration Guide

## Analysis of the Personal Savings Module

The Personal Savings module implements a comprehensive system for managing personal savings plans within a cooperative framework, with distinct approval workflows and role-based permissions.

### Core Features and Implementation

1. **Request-Based Plan Creation**
   - Members initiate plans through `requestPersonalSavingsCreation`
   - Multi-stage approval workflow (Treasurer → Chairman)
   - Detailed validation for member status and plan type

2. **Role-Based Access Control**
   - Clear separation between member and admin operations
   - Permissions enforced via middleware (checkPermission, authenticateUser)
   - Hierarchical role structure (MEMBER → ADMIN → TREASURER → CHAIRMAN)

3. **Transactional Operations**
   - Deposits handled by admins/treasurers only
   - Withdrawals follow request workflow with multi-level approval
   - 7-day rule prevents withdrawals within a week of deposits
   - Balance updates handled atomically within database transactions

4. **Analytics and Reporting**
   - Balance history tracking for charts and visualizations
   - Transaction history with filtering capabilities
   - Member summary providing aggregate statistics
   - Admin dashboard with system-wide metrics

### Approval Process Flow

The approval workflow is managed through `getApprovalStepsForRequestType` in `RequestService`, which defines approval chains for different request types:

```typescript
// Personal Savings Creation Approval Path
case RequestType.PERSONAL_SAVINGS_CREATION:
  return [
    {
      level: 1,
      status: ApprovalStatus.PENDING,
      approverRole: 'TREASURER',
      notes: 'Initial personal savings creation review'
    },
    {
      level: 2,
      status: ApprovalStatus.PENDING,
      approverRole: 'CHAIRMAN',
      notes: 'Financial verification'
    }
  ];

// Personal Savings Withdrawal Approval Path
case RequestType.PERSONAL_SAVINGS_WITHDRAWAL:
  return [
    {
      level: 1,
      status: ApprovalStatus.PENDING,
      approverRole: 'TREASURER',
      notes: 'Initial personal savings withdrawal request review'
    },
    {
      level: 2,
      status: ApprovalStatus.PENDING,
      approverRole: 'CHAIRMAN',
      notes: 'Approval for personal savings withdrawal'
    },
    {
      level: 3,
      status: ApprovalStatus.PENDING,
      approverRole: 'TREASURER',
      notes: 'Withdrawal processing'
    }
  ];
```

When a request is submitted, these approval steps are created in the database, and the request progresses through defined status transitions as approvers review and act on it.

## Frontend Integration Strategy

Based on the client-side structure and backend implementation, here's a comprehensive frontend integration plan:

### 1. API Services Implementation

Create a dedicated file for Personal Savings API interactions:

```typescript
import { apiClient } from './apiClient';
import type { 
  PersonalSavingsResponse, 
  PaginatedResponse,
  MemberSummary,
  AdminDashboard,
  BalanceHistory,
  Transaction
} from '@/types/personalSavings';

// Plan Management
export const requestPersonalSavingsPlan = async (data: {
  erpId: string;
  planTypeId: string;
  planName?: string;
  targetAmount?: number;
  notes?: string;
}) => {
  return apiClient.post('/savings/personal/request', data);
};

export const getPersonalSavingsPlans = async (params?: {
  page?: number;
  limit?: number;
  erpId?: string;
  status?: string;
  sort?: 'asc' | 'desc';
}): Promise<PaginatedResponse<PersonalSavingsResponse>> => {
  return apiClient.get('/savings/personal', { params });
};

export const getPersonalSavingsPlanById = async (id: string): Promise<PersonalSavingsResponse> => {
  const response = await apiClient.get(`/savings/personal/${id}`);
  return response.data;
};

export const closePlan = async (id: string) => {
  return apiClient.patch(`/savings/personal/${id}/close`);
};

// Transaction Management
export const processDeposit = async (id: string, data: {
  amount: number;
  description?: string;
}) => {
  return apiClient.post(`/savings/personal/${id}/deposit`, data);
};

export const requestWithdrawal = async (id: string, data: {
  amount: number;
  reason?: string;
}) => {
  return apiClient.post(`/savings/personal/${id}/withdraw`, data);
};

export const getTransactionHistory = async (id: string, params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
}): Promise<PaginatedResponse<Transaction>> => {
  return apiClient.get(`/savings/personal/${id}/transactions`, { params });
};

// Analytics
export const getBalanceHistory = async (id: string, params?: {
  startDate?: string;
  endDate?: string;
}): Promise<BalanceHistory> => {
  const response = await apiClient.get(`/savings/personal/${id}/balance-history`, { params });
  return response.data;
};

export const getMemberSummary = async (erpId: string): Promise<MemberSummary> => {
  const response = await apiClient.get(`/savings/personal/member/${erpId}/summary`);
  return response.data;
};

export const getAdminDashboard = async (): Promise<AdminDashboard> => {
  const response = await apiClient.get('/savings/personal/admin/dashboard');
  return response.data;
};
```

### 2. Type Definitions

```typescript
export enum PersonalSavingsStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED'
}

export enum TransactionType {
  PERSONAL_SAVINGS_DEPOSIT = 'PERSONAL_SAVINGS_DEPOSIT',
  PERSONAL_SAVINGS_WITHDRAWAL = 'PERSONAL_SAVINGS_WITHDRAWAL'
}

export interface PersonalSavingsResponse {
  id: string;
  erpId: string;
  planTypeId: string;
  planName?: string;
  targetAmount?: number;
  currentBalance: number;
  status: PersonalSavingsStatus;
  createdAt: string;
  updatedAt: string;
  member: {
    id: string;
    name: string;
    department: string;
  };
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  amount: number;
  transactionType: TransactionType;
  transactionBaseType: string;
  status: string;
  description?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MemberSummary {
  totalSaved: number;
  totalWithdrawals: number;
  currentBalance: number;
  plansCount: number;
  activePlans: PersonalSavingsResponse[];
}

export interface BalanceHistory {
  history: {
    date: string;
    balance: number;
  }[];
  memberErpId: string;
  memberName: string;
  planName?: string;
  currentBalance: number;
}

export interface AdminDashboard {
  activePlansCount: number;
  totalSavingsAmount: number;
  totalWithdrawalAmount: number;
  pendingCreationRequests: number;
  pendingWithdrawalRequests: number;
  recentTransactions: {
    id: string;
    amount: number;
    transactionType: TransactionType;
    transactionBaseType: string;
    status: string;
    date: string;
    memberName: string;
    department: string;
    planName: string;
    planDescription: string;
    initiator: string;
  }[];
}
```

### 3. Custom React Hooks

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as personalSavingsApi from '@/lib/api/personalSavings';
import { useToast } from '@/components/ui/use-toast';

export function usePersonalSavingsPlans(params) {
  return useQuery({
    queryKey: ['personalSavingsPlans', params],
    queryFn: () => personalSavingsApi.getPersonalSavingsPlans(params),
  });
}

export function usePersonalSavingsPlan(id) {
  return useQuery({
    queryKey: ['personalSavingsPlan', id],
    queryFn: () => personalSavingsApi.getPersonalSavingsPlanById(id),
    enabled: !!id,
  });
}

export function useCreatePersonalSavingsPlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: personalSavingsApi.requestPersonalSavingsPlan,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Personal savings plan request submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlans'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      });
    }
  });
}

export function useProcessDeposit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({id, data}) => personalSavingsApi.processDeposit(id, data),
    onSuccess: (_, variables) => {
      toast({
        title: "Success",
        description: "Deposit processed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlan', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions', variables.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process deposit",
        variant: "destructive",
      });
    }
  });
}

export function useRequestWithdrawal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({id, data}) => personalSavingsApi.requestWithdrawal(id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlans'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    }
  });
}

export function useBalanceHistory(id, params) {
  return useQuery({
    queryKey: ['personalSavingsBalanceHistory', id, params],
    queryFn: () => personalSavingsApi.getBalanceHistory(id, params),
    enabled: !!id,
  });
}

export function useTransactionHistory(id, params) {
  return useQuery({
    queryKey: ['transactions', id, params],
    queryFn: () => personalSavingsApi.getTransactionHistory(id, params),
    enabled: !!id,
  });
}

export function useMemberSummary(erpId) {
  return useQuery({
    queryKey: ['personalSavingsMemberSummary', erpId],
    queryFn: () => personalSavingsApi.getMemberSummary(erpId),
    enabled: !!erpId,
  });
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['personalSavingsAdminDashboard'],
    queryFn: personalSavingsApi.getAdminDashboard,
  });
}

export function useClosePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: personalSavingsApi.closePlan,
    onSuccess: (_, id) => {
      toast({
        title: "Success",
        description: "Plan closed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlan', id] });
      queryClient.invalidateQueries({ queryKey: ['personalSavingsPlans'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close plan",
        variant: "destructive",
      });
    }
  });
}
```

### 4. Member Components

#### Member Dashboard Summary

```tsx
import { useMemberSummary } from '@/lib/hooks/usePersonalSavings';
import { useUser } from '@/lib/hooks/useUser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils/format';

export function MemberSummary() {
  const { user } = useUser();
  const { data, isLoading } = useMemberSummary(user?.erpId);
  
  if (isLoading || !data) return <p>Loading summary...</p>;
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Personal Savings Summary</h2>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.totalSaved)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.totalWithdrawals)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.currentBalance)}</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Active Plans ({data.activePlans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.activePlans.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No active plans found</p>
          ) : (
            <div className="space-y-4">
              {data.activePlans.map(plan => (
                <div key={plan.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{plan.planName || "Savings Plan"}</p>
                    <p className="text-sm text-gray-500">Created: {new Date(plan.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold">{formatCurrency(plan.currentBalance)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### Plans List for Members

```tsx
import { usePersonalSavingsPlans } from '@/lib/hooks/usePersonalSavings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PersonalSavingsStatus } from '@/types/personalSavings';
import { formatCurrency } from '@/lib/utils/format';
import { PaginationControls } from '@/components/ui/pagination';
import { useState } from 'react';
import Link from 'next/link';

export function PlansList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = usePersonalSavingsPlans({ 
    page,
    limit: 10
  });

  if (isLoading) return <p>Loading plans...</p>;
  if (error) return <p>Error loading plans: {error.message}</p>;
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Savings Plans</h2>
        <Link href="/dashboard/savings/personal/create">
          <Button>Request New Plan</Button>
        </Link>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {data?.data.map(plan => (
          <Card key={plan.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>{plan.planName || "Savings Plan"}</span>
                <span className={`text-sm px-2 py-1 rounded ${
                  plan.status === PersonalSavingsStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                  plan.status === PersonalSavingsStatus.CLOSED ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {plan.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">ID: {plan.id.substring(0, 8)}</p>
              <p className="font-medium mt-2">Current Balance: {formatCurrency(plan.currentBalance)}</p>
              {plan.targetAmount && (
                <p className="text-sm">Target: {formatCurrency(plan.targetAmount)}</p>
              )}
              <div className="mt-4">
                <Link href={`/dashboard/savings/personal/${plan.id}`}>
                  <Button variant="outline" size="sm" className="w-full">View Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {data && (
        <PaginationControls
          currentPage={page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
```

### 5. Shared Components

#### Transaction History Component

```tsx
import { useTransactionHistory } from '@/lib/hooks/usePersonalSavings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionType } from '@/types/personalSavings';
import { formatCurrency } from '@/lib/utils/format';
import { PaginationControls } from '@/components/ui/pagination';
import { useState } from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function TransactionHistory({ planId }) {
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [transactionType, setTransactionType] = useState('');
  
  const { data, isLoading } = useTransactionHistory(planId, {
    page,
    limit: 10,
    startDate: dateRange.from?.toISOString(),
    endDate: dateRange.to?.toISOString(),
    type: transactionType || undefined
  });
  
  if (isLoading) return <p>Loading transactions...</p>;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mt-2">
          <div>
            <Label>Date Range</Label>
            <DateRangePicker 
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
          
          <div>
            <Label>Transaction Type</Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value={TransactionType.PERSONAL_SAVINGS_DEPOSIT}>Deposits</SelectItem>
                <SelectItem value={TransactionType.PERSONAL_SAVINGS_WITHDRAWAL}>Withdrawals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!data?.data.length ? (
          <p className="text-center py-4 text-gray-500">No transactions found</p>
        ) : (
          <div className="space-y-4">
            {data.data.map(tx => (
              <div key={tx.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">
                    {tx.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? 'Deposit' : 'Withdrawal'}
                  </p>
                  <p className="text-sm text-gray-500">{tx.description || 'No description'}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleString()}</p>
                </div>
                <p className={`font-bold ${
                  tx.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {tx.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
        
        {data && data.meta.totalPages > 1 && (
          <div className="mt-4">
            <PaginationControls
              currentPage={page}
              totalPages={data.meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### Balance Chart Component

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

export function BalanceChart({ data }) {
  if (!data?.history || data.history.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balance History</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500">Not enough data to display chart</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Balance History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })} />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => `Date: ${label}`} />
              <Line type="monotone" dataKey="balance" stroke="#0070f3" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 6. Admin Components

#### Admin Dashboard

```tsx
import { useAdminDashboard } from '@/lib/hooks/usePersonalSavings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/format';
import { TransactionType } from '@/types/personalSavings';
import Link from 'next/link';

export function AdminDashboard() {
  const { data, isLoading } = useAdminDashboard();
  
  if (isLoading || !data) return <p>Loading dashboard data...</p>;
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Personal Savings Dashboard</h1>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.activePlansCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.totalSavingsAmount)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Withdrawals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(data.totalWithdrawalAmount)}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md">Pending Requests</CardTitle>
            <Link href="/admin/requests">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Creation Requests</span>
                <span className="font-bold">{data.pendingCreationRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Withdrawal Requests</span>
                <span className="font-bold">{data.pendingWithdrawalRequests}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No recent transactions</p>
            ) : (
              <div className="space-y-4">
                {data.recentTransactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{tx.memberName}</p>
                      <p className="text-sm text-gray-500">
                        {tx.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? 'Deposit' : 'Withdrawal'}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleString()}</p>
                    </div>
                    <p className={`font-bold ${
                      tx.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {tx.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### Admin Deposit Form

```tsx
import { useProcessDeposit } from '@/lib/hooks/usePersonalSavings';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { PersonalSavingsStatus } from '@/types/personalSavings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const depositSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  description: z.string().optional()
});

export function DepositForm({ plan }) {
  const depositMutation = useProcessDeposit();
  
  const form = useForm({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      amount: 0,
      description: ''
    }
  });
  
  const handleDeposit = (data) => {
    depositMutation.mutate({
      id: plan.id,
      data: {
        amount: data.amount,
        description: data.description
      }
    });
  };
  
  const isActive = plan.status === PersonalSavingsStatus.ACTIVE;
  
  if (!isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Process Deposit</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-600">
            Deposits can only be processed for active plans. This plan is currently {plan.status.toLowerCase()}.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Deposit</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleDeposit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Deposit description" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={depositMutation.isPending}
            >
              {depositMutation.isPending ? 'Processing...' : 'Process Deposit'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

### 7. Page Structure

#### Member Pages

```tsx
"use client";

import { MemberSummary } from '@/components/savings/personal/member/MemberSummary';
import { PlansList } from '@/components/savings/personal/member/PlansList';

export default function PersonalSavingsPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <MemberSummary />
      <PlansList />
    </div>
  );
}
```

```tsx
"use client";

import { PlanDetails } from '@/components/savings/personal/member/PlanDetails';

export default function PersonalSavingsPlanPage({ params }) {
  const { id } = params;
  
  return (
    <div className="container mx-auto py-6">
      <PlanDetails id={id} />
    </div>
  );
}
```

#### Admin Pages

```tsx
"use client";

import { AdminDashboard } from '@/components/savings/personal/admin/AdminDashboard';

export default function AdminPersonalSavingsPage() {
  return (
    <div className="container mx-auto py-6">
      <AdminDashboard />
    </div>
  );
}
```

```tsx
"use client";

import { usePersonalSavingsPlan } from '@/lib/hooks/usePersonalSavings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClosePlan } from '@/lib/hooks/usePersonalSavings';
import { Button } from '@/components/ui/button';
import { PersonalSavingsStatus } from '@/types/personalSavings';
import { formatCurrency } from '@/lib/utils/format';
import { TransactionHistory } from '@/components/savings/personal/shared/TransactionHistory';
import { BalanceChart } from '@/components/savings/personal/shared/BalanceChart';
import { DepositForm } from '@/components/savings/personal/admin/DepositForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useBalanceHistory } from '@/lib/hooks/usePersonalSavings';
import { useRouter } from 'next/navigation';

export default function AdminPlanDetailsPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const { data: plan, isLoading } = usePersonalSavingsPlan(id);
  const { data: balanceHistory } = useBalanceHistory(id, {});
  const closePlanMutation = useClosePlan();
  
  const handleClosePlan = () => {
    closePlanMutation.mutate(id, {
      onSuccess: () => {
        router.refresh();
      }
    });
  };
  
  if (isLoading || !plan) return <p>Loading plan details...</p>;
  
  const isActive = plan.status === PersonalSavingsStatus.ACTIVE;
  const canClose = isActive && plan.currentBalance === 0;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">
          {plan.planName || "Savings Plan"} - {plan.member.name}
        </h1>
        
        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={!canClose}>
                Close Plan
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close this savings plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The plan will be marked as closed and no further transactions will be allowed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClosePlan}>Close Plan</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {/* Status Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(plan.currentBalance)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${
              plan.status === PersonalSavingsStatus.ACTIVE ? 'text-green-600' :
              plan.status === PersonalSavingsStatus.CLOSED ? 'text-gray-600' :
              'text-amber-600'
            }`}>
              {plan.status}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Target Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{plan.targetAmount ? formatCurrency(plan.targetAmount) : 'N/A'}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different sections */}
      <Tabs defaultValue="deposit">
        <TabsList className="mb-4">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="deposit" className="space-y-4">
          <DepositForm plan={plan} />
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <TransactionHistory planId={id} />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          {balanceHistory && <BalanceChart data={balanceHistory} />}
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          {/* Member Details */}
          <Card>
            <CardHeader>
              <CardTitle>Member Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <p className="text-sm font-medium text-muted-foreground">Member Name:</p>
                <p>{plan.member.name}</p>
                
                <p className="text-sm font-medium text-muted-foreground">ERP ID:</p>
                <p>{plan.erpId}</p>
                
                <p className="text-sm font-medium text-muted-foreground">Department:</p>
                <p>{plan.member.department}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Plan Details */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <p className="text-sm font-medium text-muted-foreground">Plan ID:</p>
                <p>{plan.id}</p>
                
                <p className="text-sm font-medium text-muted-foreground">Created:</p>
                <p>{new Date(plan.createdAt).toLocaleDateString()}</p>
                
                <p className="text-sm font-medium text-muted-foreground">Last Updated:</p>
                <p>{new Date(plan.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Integration Summary

This implementation provides a complete frontend solution for the Personal Savings module with the following features:

1. **Member Experience**:
   - Dashboard with summary statistics
   - List of personal savings plans
   - Detailed view of individual plans
   - Transaction history with filtering
   - Balance history visualization
   - Ability to request withdrawals

2. **Admin Experience**:
   - Dashboard with system-wide statistics
   - Processing deposits for any member
   - Viewing transaction history across the system
   - Closing plans when conditions are met
   - Analytics for decision-making

3. **Request Workflow Integration**:
   - Creation request flows through approval levels
   - Withdrawal requests follow the configured approval path
   - Status updates reflected in the UI
   - Proper validation at each step

4. **Security & Access Control**:
   - Role-based UI elements
   - Permission-based feature access
   - Data ownership validation
   - Proper error handling

By following this integration guide, you'll have a fully functional and well-structured implementation of the Personal Savings module in the frontend that aligns perfectly with the backend implementation.
