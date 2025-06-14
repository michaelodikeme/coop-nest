-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'RESIGNED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT', 'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAWAL', 'SAVINGS_INTEREST', 'SHARES_PURCHASE', 'SHARES_LIQUIDATION', 'SHARES_DIVIDEND', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'LOAN_INTEREST', 'LOAN_PENALTY', 'FEE', 'REVERSAL', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionModule" AS ENUM ('SAVINGS', 'SHARES', 'LOAN', 'SYSTEM', 'ADMIN');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('LOAN_APPLICATION', 'SAVINGS_WITHDRAWAL', 'ACCOUNT_CLOSURE', 'BIODATA_UPDATE', 'ACCOUNT_CREATION', 'ACCOUNT_UPDATE', 'ACCOUNT_VERIFICATION', 'LOAN_DISBURSEMENT', 'BULK_UPLOAD', 'SYSTEM_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'REVIEWED', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RequestModule" AS ENUM ('LOAN', 'SAVINGS', 'SHARES', 'ACCOUNT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'LATE', 'OVERDUE', 'WAIVED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRANSACTION', 'REQUEST_UPDATE', 'APPROVAL_REQUIRED', 'SYSTEM_ALERT', 'ACCOUNT_UPDATE');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "biodataId" UUID,
    "username" TEXT,
    "password" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMember" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT[],
    "approvalLevel" INTEGER NOT NULL,
    "canApprove" BOOLEAN NOT NULL DEFAULT false,
    "moduleAccess" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountInfo" (
    "id" UUID NOT NULL,
    "biodataId" UUID NOT NULL,
    "bankId" UUID NOT NULL,
    "account_number" TEXT NOT NULL,
    "bank_verification_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationDate" TIMESTAMP(3),
    "verifiedBy" UUID,

    CONSTRAINT "AccountInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bank" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Biodata" (
    "id" UUID NOT NULL,
    "erp_id" TEXT NOT NULL,
    "ippis_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date_of_employment" TIMESTAMP(3) NOT NULL,
    "staff_no" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "residential_address" TEXT NOT NULL,
    "email_address" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "next_of_kin" TEXT NOT NULL,
    "relationship_of_next_of_kin" TEXT NOT NULL,
    "next_of_kin_phone_number" TEXT NOT NULL,
    "next_of_kin_email_address" TEXT NOT NULL,
    "profile_photo" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "membershipStatus" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Biodata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Savings" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "monthlyTarget" DECIMAL(15,2) NOT NULL,
    "lastDeposit" TIMESTAMP(3),
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Savings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shares" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "unitsHeld" INTEGER NOT NULL,
    "valuePerUnit" DECIMAL(15,2) NOT NULL,
    "totalValue" DECIMAL(15,2) NOT NULL,
    "monthlyTarget" DECIMAL(15,2) NOT NULL DEFAULT 3000,
    "lastPurchase" TIMESTAMP(3),
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "interest_rate" DECIMAL(65,30) NOT NULL,
    "min_duration" INTEGER NOT NULL,
    "max_duration" INTEGER NOT NULL,
    "max_loan_amount" DECIMAL(65,30) NOT NULL,
    "savingsMultiplier" DECIMAL(65,30) NOT NULL DEFAULT 3.00,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LoanType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "loanTypeId" UUID NOT NULL,
    "principalAmount" DECIMAL(15,2) NOT NULL,
    "interestAmount" DECIMAL(15,2) NOT NULL,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remainingBalance" DECIMAL(15,2) NOT NULL,
    "tenure" INTEGER NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "disbursedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "nextPaymentDue" TIMESTAMP(3),
    "purpose" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanSchedule" (
    "id" UUID NOT NULL,
    "loanId" UUID NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "expectedAmount" DECIMAL(15,2) NOT NULL,
    "principalAmount" DECIMAL(15,2) NOT NULL,
    "interestAmount" DECIMAL(15,2) NOT NULL,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remainingBalance" DECIMAL(15,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "actualPaymentDate" TIMESTAMP(3),

    CONSTRAINT "LoanSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkRepaymentUpload" (
    "id" UUID NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" DECIMAL(15,2) NOT NULL,
    "totalCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "status" "UploadStatus" NOT NULL DEFAULT 'PROCESSING',
    "errorDetails" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkRepaymentUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanRepayment" (
    "id" UUID NOT NULL,
    "loanId" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "repaymentDate" TIMESTAMP(3) NOT NULL,
    "uploadedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repaymentMonth" INTEGER NOT NULL,
    "repaymentYear" INTEGER NOT NULL,
    "uploadedBy" UUID NOT NULL,
    "uploadBatchId" UUID,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "reconciledAt" TIMESTAMP(3),
    "reconciledBy" UUID,
    "reconciliationNotes" TEXT,
    "scheduleId" UUID,

    CONSTRAINT "LoanRepayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanStatusHistory" (
    "id" UUID NOT NULL,
    "loanId" UUID NOT NULL,
    "fromStatus" "LoanStatus" NOT NULL,
    "toStatus" "LoanStatus" NOT NULL,
    "changedBy" UUID NOT NULL,
    "changeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "LoanStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" UUID NOT NULL,
    "type" "RequestType" NOT NULL,
    "module" "RequestModule" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "RequestPriority" NOT NULL DEFAULT 'NORMAL',
    "content" JSONB NOT NULL,
    "metadata" JSONB,
    "initiatorId" UUID NOT NULL,
    "assigneeId" UUID,
    "approverId" UUID,
    "nextApprovalLevel" INTEGER NOT NULL DEFAULT 1,
    "loanId" UUID,
    "savingsId" UUID,
    "biodataId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestApproval" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approverId" UUID,
    "approverRole" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "RequestApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "requestId" UUID,
    "transactionId" UUID,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "module" "TransactionModule" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balanceAfter" DECIMAL(15,2) NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "metadata" JSONB,
    "initiatedBy" UUID NOT NULL,
    "approvedBy" UUID,
    "requestId" UUID,
    "loanId" UUID,
    "savingsId" UUID,
    "sharesId" UUID,
    "parentTxnId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON "user_roles"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_userId_key" ON "admin_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_emailAddress_key" ON "admin_profiles"("emailAddress");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_phoneNumber_key" ON "admin_profiles"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_staffId_key" ON "admin_profiles"("staffId");

-- CreateIndex
CREATE INDEX "AccountInfo_biodataId_idx" ON "AccountInfo"("biodataId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountInfo_biodataId_bankId_key" ON "AccountInfo"("biodataId", "bankId");

-- CreateIndex
CREATE UNIQUE INDEX "Bank_name_key" ON "Bank"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Bank_code_key" ON "Bank"("code");

-- CreateIndex
CREATE INDEX "Bank_code_idx" ON "Bank"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Biodata_erp_id_key" ON "Biodata"("erp_id");

-- CreateIndex
CREATE UNIQUE INDEX "Biodata_ippis_id_key" ON "Biodata"("ippis_id");

-- CreateIndex
CREATE UNIQUE INDEX "Biodata_name_key" ON "Biodata"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Biodata_staff_no_key" ON "Biodata"("staff_no");

-- CreateIndex
CREATE UNIQUE INDEX "Biodata_email_address_key" ON "Biodata"("email_address");

-- CreateIndex
CREATE UNIQUE INDEX "Biodata_phone_number_key" ON "Biodata"("phone_number");

-- CreateIndex
CREATE INDEX "Biodata_erp_id_idx" ON "Biodata"("erp_id");

-- CreateIndex
CREATE INDEX "Biodata_membershipStatus_idx" ON "Biodata"("membershipStatus");

-- CreateIndex
CREATE INDEX "Savings_memberId_idx" ON "Savings"("memberId");

-- CreateIndex
CREATE INDEX "Savings_status_idx" ON "Savings"("status");

-- CreateIndex
CREATE INDEX "Shares_memberId_idx" ON "Shares"("memberId");

-- CreateIndex
CREATE INDEX "Shares_status_idx" ON "Shares"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LoanType_name_key" ON "LoanType"("name");

-- CreateIndex
CREATE INDEX "Loan_memberId_idx" ON "Loan"("memberId");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "Loan"("status");

-- CreateIndex
CREATE INDEX "LoanSchedule_loanId_idx" ON "LoanSchedule"("loanId");

-- CreateIndex
CREATE INDEX "LoanSchedule_status_idx" ON "LoanSchedule"("status");

-- CreateIndex
CREATE INDEX "BulkRepaymentUpload_uploadedBy_idx" ON "BulkRepaymentUpload"("uploadedBy");

-- CreateIndex
CREATE INDEX "BulkRepaymentUpload_status_idx" ON "BulkRepaymentUpload"("status");

-- CreateIndex
CREATE INDEX "LoanRepayment_loanId_idx" ON "LoanRepayment"("loanId");

-- CreateIndex
CREATE INDEX "LoanRepayment_uploadBatchId_idx" ON "LoanRepayment"("uploadBatchId");

-- CreateIndex
CREATE INDEX "LoanRepayment_scheduleId_idx" ON "LoanRepayment"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "LoanRepayment_loanId_repaymentMonth_repaymentYear_key" ON "LoanRepayment"("loanId", "repaymentMonth", "repaymentYear");

-- CreateIndex
CREATE INDEX "LoanStatusHistory_loanId_idx" ON "LoanStatusHistory"("loanId");

-- CreateIndex
CREATE INDEX "LoanStatusHistory_changedBy_idx" ON "LoanStatusHistory"("changedBy");

-- CreateIndex
CREATE INDEX "Request_type_idx" ON "Request"("type");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "Request_initiatorId_idx" ON "Request"("initiatorId");

-- CreateIndex
CREATE INDEX "Request_assigneeId_idx" ON "Request"("assigneeId");

-- CreateIndex
CREATE INDEX "RequestApproval_requestId_idx" ON "RequestApproval"("requestId");

-- CreateIndex
CREATE INDEX "RequestApproval_status_idx" ON "RequestApproval"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RequestApproval_requestId_level_key" ON "RequestApproval"("requestId", "level");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_refreshToken_idx" ON "Session"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "Session_userId_token_key" ON "Session"("userId", "token");

-- CreateIndex
CREATE INDEX "Transaction_transactionType_idx" ON "Transaction"("transactionType");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_module_idx" ON "Transaction"("module");

-- CreateIndex
CREATE INDEX "Transaction_requestId_idx" ON "Transaction"("requestId");

-- CreateIndex
CREATE INDEX "Transaction_loanId_idx" ON "Transaction"("loanId");

-- CreateIndex
CREATE INDEX "Transaction_savingsId_idx" ON "Transaction"("savingsId");

-- CreateIndex
CREATE INDEX "Transaction_sharesId_idx" ON "Transaction"("sharesId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_biodataId_fkey" FOREIGN KEY ("biodataId") REFERENCES "Biodata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInfo" ADD CONSTRAINT "AccountInfo_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountInfo" ADD CONSTRAINT "AccountInfo_biodataId_fkey" FOREIGN KEY ("biodataId") REFERENCES "Biodata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Savings" ADD CONSTRAINT "Savings_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Biodata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shares" ADD CONSTRAINT "Shares_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Biodata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Biodata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_loanTypeId_fkey" FOREIGN KEY ("loanTypeId") REFERENCES "LoanType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanSchedule" ADD CONSTRAINT "LoanSchedule_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BulkRepaymentUpload" ADD CONSTRAINT "BulkRepaymentUpload_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_uploadBatchId_fkey" FOREIGN KEY ("uploadBatchId") REFERENCES "BulkRepaymentUpload"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanRepayment" ADD CONSTRAINT "LoanRepayment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "LoanSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanStatusHistory" ADD CONSTRAINT "LoanStatusHistory_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanStatusHistory" ADD CONSTRAINT "LoanStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_savingsId_fkey" FOREIGN KEY ("savingsId") REFERENCES "Savings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_biodataId_fkey" FOREIGN KEY ("biodataId") REFERENCES "Biodata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestApproval" ADD CONSTRAINT "RequestApproval_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestApproval" ADD CONSTRAINT "RequestApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_initiatedBy_fkey" FOREIGN KEY ("initiatedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_savingsId_fkey" FOREIGN KEY ("savingsId") REFERENCES "Savings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sharesId_fkey" FOREIGN KEY ("sharesId") REFERENCES "Shares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_parentTxnId_fkey" FOREIGN KEY ("parentTxnId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
