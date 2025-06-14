Here’s a **proposed structural approach** for implementing a new **Personal Savings** module in your schema, designed to integrate smoothly with your existing models and logic, while supporting all the requirements you described.

---

## 1. **New Table: PersonalSavings**

Add a new model to represent each member’s personal savings plan. This model is distinct from the regular monthly savings and is flexible for deposits and withdrawals.

````prisma
model PersonalSavings {
  id             String    @id @default(uuid()) @db.Uuid
  memberId       String    @db.Uuid
  erpId          String    @map("erp_id")
  planName       String?   // Optional: allow naming the plan (e.g., "Vacation Fund")
  targetAmount   Decimal?  @db.Decimal(15, 2) // Optional: member can set a target
  currentBalance Decimal   @default(0) @db.Decimal(15, 2)
  status         PersonalSavingsStatus @default(ACTIVE)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  // Relationships
  member         Biodata   @relation(fields: [memberId], references: [id])
  transactions   Transaction[]
  requests       Request[]

  @@index([memberId, erpId])
  @@index([status])
}
````

---

## 2. **Enum: PersonalSavingsStatus**

````prisma
enum PersonalSavingsStatus {
  ACTIVE
  CLOSED
  SUSPENDED
}
````

---

## 3. **Extend TransactionType Enum**

Add new transaction types for personal savings:

````prisma
enum TransactionType {
  // ...existing code...
  PERSONAL_SAVINGS_DEPOSIT
  PERSONAL_SAVINGS_WITHDRAWAL
}
````

---

## 4. **Extend Transaction Model**

Add a nullable foreign key to link transactions to a personal savings plan:

````prisma
model Transaction {
  // ...existing code...
  personalSavingsId String?         @db.Uuid
  personalSavings   PersonalSavings? @relation(fields: [personalSavingsId], references: [id])
  // ...existing code...
  @@index([personalSavingsId])
}
````

---

## 5. **Extend RequestType Enum**

Add a request type for personal savings withdrawal:

````prisma
enum RequestType {
  // ...existing code...
  PERSONAL_SAVINGS_WITHDRAWAL
  PERSONAL_SAVINGS_CREATION
}
````

---

## 6. **Extend Request Model**

Add a nullable foreign key to link requests to a personal savings plan:

````prisma
model Request {
  // ...existing code...
  personalSavingsId String?         @db.Uuid
  personalSavings   PersonalSavings? @relation(fields: [personalSavingsId], references: [id])
  // ...existing code...
  @@index([personalSavingsId])
}
````

---

## 7. **Personal Savings Logic & Workflow**

- **Creation**: Member submits a request (`PERSONAL_SAVINGS_CREATION`) to start a new personal savings plan. Optionally sets a target amount and plan name.
- **Deposits**: Member can deposit any amount, any time. Each deposit creates a `Transaction` with `transactionType: PERSONAL_SAVINGS_DEPOSIT`, linked to the `PersonalSavings` record.
- **Withdrawals**: Member submits a withdrawal request (`PERSONAL_SAVINGS_WITHDRAWAL`). The system checks that at least 7 days have passed since the last deposit for that plan. Upon approval, a `Transaction` with `transactionType: PERSONAL_SAVINGS_WITHDRAWAL` is created and the balance is updated.
- **Approval Flow**: Withdrawal requests follow the same approval chain as other savings withdrawals (see your `RequestApproval` logic).
- **Auditability**: All deposits and withdrawals are tracked in the `Transaction` table, linked to the relevant `PersonalSavings` plan and member.

---

## 8. **Summary Table of Relationships**

| Model            | Key Foreign Keys / Relations                | Description                                  |
|------------------|--------------------------------------------|----------------------------------------------|
| Biodata          | id → PersonalSavings                        | Member profile                               |
| PersonalSavings  | memberId, erpId → Biodata                   | Member’s personal savings plan               |
|                  | transactions → Transaction                  | All personal savings transactions            |
|                  | requests → Request                          | All requests related to this plan            |
| Transaction      | personalSavingsId → PersonalSavings         | Financial events for personal savings        |
| Request          | personalSavingsId → PersonalSavings         | Approval workflow for personal savings       |

---

## 9. **Minimal Impact on Existing Schema**

- No changes to existing `Savings`, `Shares`, or `Loan` models.
- Only new fields and enums added, so existing data and logic remain stable.
- Approval and transaction logic can be reused with minimal changes.

---

## 10. **Example: Personal Savings Deposit & Withdrawal Flow**

1. **Member creates a personal savings plan** (optional target/plan name).
2. **Member deposits funds** at any time:
   - Creates a `Transaction` (`PERSONAL_SAVINGS_DEPOSIT`), updates `currentBalance`.
3. **Member requests withdrawal**:
   - System checks last deposit date (must be ≥ 7 days ago).
   - Creates a `Request` (`PERSONAL_SAVINGS_WITHDRAWAL`), linked to the plan.
   - Upon approval, creates a `Transaction` (`PERSONAL_SAVINGS_WITHDRAWAL`), updates `currentBalance`.

---

## 11. **Diagram (Textual)**

```
[Biodata]---<has>---[PersonalSavings]---<has>---[Transaction]
   |                        |
   |                        |
   |                        v
   |--------------------[Request]
```

---

**This approach ensures your new Personal Savings module is robust, auditable, and fully integrated with your existing approval and transaction workflows, while keeping changes to your current schema minimal and non-disruptive.**