# Phase 1: Savings & Withdrawals - Implementation Roadmap

**Timeline:** 48 Hours
**Status:** Ready to Start
**Date:** January 23, 2026

---

## Executive Summary

Based on the end-to-end analysis, the Savings Module is **~60% complete**. The core withdrawal infrastructure exists with a robust 4-level approval workflow, but several critical features are missing and need implementation.

### Clarified Business Rules ✅

**Regular Savings:**
- Maximum withdrawal: 80% of `balance` field
- Frequency: 1 withdrawal per year
- Blocked if: Member has loan with status `ACTIVE`
- Approval: 4-level workflow (ADMIN → TREASURER → CHAIRMAN → TREASURER)

**Personal Savings:**
- Maximum withdrawal: 100% of balance
- Frequency: Multiple withdrawals per year (no limit)
- Blocked if: Member has loan with status `ACTIVE`
- Approval: Same 4-level workflow

---

## Implementation Timeline

### Day 1: Critical Fixes & Core Features (24 hours)

#### Morning Session (6 hours) - Critical Validations
**Tasks 1 & 3: Active Loan Check + Balance Calculation Fix**

**What to do:**
1. Add active loan validation in `withdrawal.service.ts`
2. Fix 80% calculation to use `balance` instead of `totalSavingsAmount`
3. Update error messages and error codes
4. Test both fixes

**Expected Output:**
- Members with ACTIVE loans blocked from withdrawals
- Correct 80% calculation based on balance
- Clear error messages

**Files Modified:**
- `server/src/modules/savings/services/withdrawal.service.ts`
- `server/src/modules/savings/errors/savings.error.ts`

---

#### Afternoon Session (6 hours) - Balance Update Verification
**Task 5: Verify Post-Approval Updates**

**What to do:**
1. Trace complete transaction processor flow
2. Verify `SavingsTransactionProcessor` updates balance
3. Test withdrawal request → approval → balance update
4. Fix any issues found
5. Add logging for debugging

**Expected Output:**
- Confirmed balance updates immediately after approval
- Transaction appears in history
- Member dashboard reflects new balance

**Files to Check/Modify:**
- `server/src/modules/transaction/services/processors/savings-transaction.processor.ts`
- `server/src/modules/savings/services/withdrawal.service.ts`

---

#### Evening Session (6 hours) - Personal Savings Start
**Task 2: Differentiate Savings Types (Part 1)**

**What to do:**
1. Add logic to detect withdrawal type (savingsId vs personalSavingsId)
2. Modify `checkYearlyWithdrawalLimit()` to skip for personal savings
3. Modify `validateWithdrawalAmount()` for 100% vs 80% limits
4. Update interfaces if needed

**Expected Output:**
- Service can handle both savings types
- Different validation rules applied correctly
- Yearly limit only applies to regular savings

**Files Modified:**
- `server/src/modules/savings/services/withdrawal.service.ts`
- `server/src/modules/savings/interfaces/withdrawal.interface.ts`

---

#### Late Night Session (6 hours) - Personal Savings Complete
**Task 2: Differentiate Savings Types (Part 2)**

**What to do:**
1. Update frontend to support personal savings withdrawals
2. Test both withdrawal types end-to-end
3. Verify transaction processing for both
4. Write unit tests

**Expected Output:**
- Members can request personal savings withdrawals
- Correct limits applied (80% vs 100%)
- Correct frequency rules (1/year vs unlimited)

**Files Modified:**
- Frontend withdrawal components
- Test files

---

### Day 2: Integration & Completion (24 hours)

#### Morning Session (8 hours) - Savings Upload
**Task 4: Complete Savings Upload Integration**

**What to do:**
1. Read complete `upload.service.ts` implementation
2. Verify/implement savings record updates
3. Verify/implement shares split and update
4. Verify/implement transaction creation for each entry
5. Wrap upload in database transaction
6. Test with sample Excel/CSV files
7. Verify dashboard updates after upload

**Expected Output:**
- Bulk savings upload fully functional
- All savings records updated correctly
- Shares properly split and recorded
- Transactions created for audit trail
- Dashboard reflects uploaded data

**Files Modified:**
- `server/src/modules/savings/services/upload.service.ts`
- `server/src/modules/savings/controllers/savings.controller.ts`

---

#### Afternoon Session (6 hours) - Dashboard & Reports
**Tasks 6 & 7: Dashboard Verification + Reports**

**What to do:**
1. Verify admin dashboard totals update after withdrawal approval
2. Verify withdrawal records display with correct status
3. Implement Excel export for withdrawal reports
4. Implement PDF export for withdrawal reports
5. Add filtering and date range selection
6. Test export with various datasets

**Expected Output:**
- Admin dashboard shows accurate totals
- Withdrawal reports available in Excel and PDF
- Filters work correctly

**Files Modified:**
- `server/src/modules/savings/services/withdrawal-report.service.ts` (new)
- Frontend admin dashboard components

---

#### Evening Session (6 hours) - Testing & Quality Assurance

**What to do:**
1. Write comprehensive unit tests for all new features
2. Write integration tests for withdrawal flows
3. Perform end-to-end testing:
   - Regular savings withdrawal (full flow)
   - Personal savings withdrawal (full flow)
   - Bulk upload (full flow)
   - Active loan blocking
   - Yearly limit enforcement
4. Fix any bugs discovered

**Expected Output:**
- All tests passing
- No critical bugs
- Edge cases handled

---

#### Final Session (4 hours) - Build Validation & Documentation

**What to do:**
1. Run TypeScript build for backend: `cd server && npm run build`
2. Run TypeScript build for frontend: `cd client && npm run build`
3. Fix any TypeScript errors
4. Create summary.md documenting:
   - What was implemented
   - What was fixed
   - What was tested
   - Any known issues or limitations
   - Recommendations for Phase 2

**Expected Output:**
- Zero TypeScript errors
- Clean builds for both frontend and backend
- Complete summary documentation

---

## Key Implementation Details

### 1. Active Loan Validation

**Location:** `server/src/modules/savings/services/withdrawal.service.ts`

**Implementation:**
```typescript
private async checkActiveLoan(biodataId: string): Promise<boolean> {
    const activeLoan = await prisma.loan.findFirst({
        where: {
            memberId: biodataId,
            status: 'ACTIVE'
        }
    });

    return activeLoan === null; // Returns true if no active loan
}
```

**Call in `createWithdrawalRequest()`:**
```typescript
// Check for active loans first
const canWithdrawDueToLoan = await this.checkActiveLoan(data.biodataId);
if (!canWithdrawDueToLoan) {
    throw new SavingsError(
        SavingsErrorCodes.ACTIVE_LOAN_EXISTS,
        'Cannot process withdrawal request. You have an active loan that must be cleared first.',
        400
    );
}
```

---

### 2. Balance Calculation Fix

**Current (Line 86):**
```typescript
const maxWithdrawalAmount = new Decimal(latestSavings.totalSavingsAmount).mul(0.8);
```

**Fixed:**
```typescript
const maxWithdrawalAmount = new Decimal(latestSavings.balance).mul(0.8);
```

---

### 3. Personal Savings Differentiation

**Detection Logic:**
```typescript
private isPersonalSavingsWithdrawal(data: WithdrawalRequestInput): boolean {
    return !!data.personalSavingsId;
}
```

**Modified Validation:**
```typescript
private async validateWithdrawalAmount(
    biodataId: string,
    amount: number,
    isPersonalSavings: boolean
): Promise<void> {
    // ... get latest savings/personal savings record

    // Apply different limits
    const maxPercentage = isPersonalSavings ? 1.0 : 0.8;
    const maxWithdrawalAmount = new Decimal(record.balance).mul(maxPercentage);

    if (new Decimal(amount).gt(maxWithdrawalAmount)) {
        const percentageText = isPersonalSavings ? '100%' : '80%';
        throw new SavingsError(
            SavingsErrorCodes.WITHDRAWAL_LIMIT_EXCEEDED,
            `Maximum withdrawal amount is ${formatCurrency(maxWithdrawalAmount)} (${percentageText} of balance)`,
            400
        );
    }
}
```

**Modified Yearly Check:**
```typescript
private async checkYearlyWithdrawalLimit(
    biodataId: string,
    isPersonalSavings: boolean
): Promise<boolean> {
    // Skip yearly check for personal savings
    if (isPersonalSavings) {
        return true;
    }

    // Existing yearly check for regular savings
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const withdrawalsThisYear = await prisma.request.count({
        where: {
            biodataId,
            type: RequestType.SAVINGS_WITHDRAWAL,
            savingsId: { not: null }, // Only count regular savings
            createdAt: { gte: startOfYear },
            status: {
                in: [RequestStatus.PENDING, RequestStatus.IN_REVIEW, RequestStatus.APPROVED]
            }
        }
    });

    return withdrawalsThisYear === 0;
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Active loan check returns false when loan exists
- [ ] Active loan check returns true when no loan exists
- [ ] 80% calculation uses balance field correctly
- [ ] Personal savings allows 100% withdrawal
- [ ] Regular savings limits to 80%
- [ ] Yearly limit applies only to regular savings
- [ ] Personal savings allows multiple withdrawals

### Integration Tests
- [ ] Complete withdrawal flow: create → approve (all levels) → complete
- [ ] Balance updates after final approval
- [ ] Transaction created with correct amount
- [ ] Withdrawal blocked when active loan exists
- [ ] Withdrawal blocked when yearly limit exceeded (regular savings)
- [ ] Personal savings withdrawal succeeds even with prior withdrawal same year

### End-to-End Tests
- [ ] Member creates regular savings withdrawal request
- [ ] Member creates personal savings withdrawal request
- [ ] Admin reviews at level 1 (ADMIN)
- [ ] Treasurer reviews at level 2
- [ ] Chairman approves at level 3
- [ ] Treasurer completes at level 4
- [ ] Member dashboard shows updated balance
- [ ] Transaction appears in history
- [ ] Admin dashboard totals updated
- [ ] Bulk savings upload processes successfully
- [ ] Upload creates transactions and updates balances

---

## Success Metrics

By the end of 48 hours, we should have:

✅ **All Critical Features:**
1. Active loan blocking functional
2. Correct 80%/100% withdrawal limits
3. Regular vs Personal savings differentiated
4. Yearly limit enforced correctly
5. Bulk upload fully integrated

✅ **Quality Assurance:**
1. All unit tests passing
2. All integration tests passing
3. End-to-end tests completed
4. Zero TypeScript errors
5. Clean builds

✅ **Documentation:**
1. Task plan complete
2. Implementation summary created
3. Known issues documented
4. Code comments added where needed

---

## Risk Mitigation

### High-Risk Areas:
1. **Database transactions** - All critical operations must be atomic
2. **Race conditions** - Multiple approvals on same request
3. **Balance consistency** - Must stay in sync across all views

### Mitigation Strategies:
1. Use Prisma `$transaction` for all multi-step operations
2. Add database-level constraints where possible
3. Implement comprehensive logging
4. Add rollback mechanisms
5. Test with concurrent operations

---

## Next Steps

**Immediate Actions:**
1. ✅ Review this roadmap
2. Set up development environment
3. Start with Task 1 (Active Loan Validation) - easiest win
4. Progress through tasks in order
5. Track progress with TodoWrite tool
6. Run builds frequently to catch TypeScript errors early

**Communication:**
- Update progress after each major task completion
- Report blockers immediately
- Ask questions when assumptions need verification

---

## Files Reference

### Backend (Primary Work Areas)
```
server/src/modules/
├── savings/
│   ├── services/
│   │   ├── withdrawal.service.ts          ⭐ MAIN WORK
│   │   ├── upload.service.ts              ⭐ COMPLETE INTEGRATION
│   │   └── withdrawal-report.service.ts   📝 CREATE NEW
│   ├── controllers/
│   │   └── withdrawal.controller.ts       🔍 MINOR UPDATES
│   ├── errors/
│   │   └── savings.error.ts               🔍 ADD ERROR CODE
│   └── validations/
│       └── withdrawal.validation.ts       🔍 UPDATE IF NEEDED
├── transaction/
│   └── services/
│       └── processors/
│           └── savings-transaction.processor.ts  🔍 VERIFY
└── loan/
    └── services/
        └── loan.service.ts                🔍 CHECK ACTIVE LOAN QUERY
```

### Frontend (Updates Needed)
```
client/src/
├── app/
│   ├── admin/
│   │   ├── financial/
│   │   │   └── savings/page.tsx          🔍 VERIFY UPDATES
│   │   └── approvals/
│   │       └── withdrawals/page.tsx      🔍 MINOR UPDATES
│   └── member/
│       └── (savings pages)                🔍 UPDATES FOR PERSONAL SAVINGS
├── components/
│   └── features/
│       └── member/
│           └── savings/
│               └── WithdrawalRequests.tsx 🔍 SUPPORT BOTH TYPES
└── lib/
    └── api/
        └── services/
            └── savingsService.ts          🔍 UPDATE IF NEEDED
```

---

## Appendix: Common Commands

```bash
# Backend
cd server
npm run dev              # Run development server
npm run build            # TypeScript build
npm test                 # Run tests
npm run migrate:db       # Run migrations

# Frontend
cd client
npm run dev              # Run development server
npm run build            # Next.js build
npm run lint             # ESLint

# Database
cd server
npx prisma studio        # Open Prisma Studio
npx prisma generate      # Regenerate Prisma Client
```

---

**Ready to start implementation!** 🚀
