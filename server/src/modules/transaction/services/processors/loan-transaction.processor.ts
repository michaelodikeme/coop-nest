import { PrismaClient, Transaction, TransactionStatus, TransactionType, TransactionModule, LoanStatus } from '@prisma/client';
import { TransactionProcessor } from '../../interfaces/transaction-processor.interface';
import { CreateTransactionDto } from '../../dtos/create-transaction.dto';
import { TransactionError, TransactionErrorCodes } from '../../errors/transaction.error';
import { Decimal } from '@prisma/client/runtime/library';
import logger from '../../../../utils/logger';
import { prisma } from '../../../../utils/prisma';

/**
 * Processor for loan-related transactions
 */
export class LoanTransactionProcessor implements TransactionProcessor {

  
  constructor() {

  }
  
  /**
   * Validate a loan transaction before processing
   */
  async validateTransaction(data: CreateTransactionDto): Promise<boolean> {
    try {
      // Validate based on transaction type
      switch (data.transactionType) {
        case TransactionType.LOAN_DISBURSEMENT:
          return this.validateLoanDisbursement(data);
        case TransactionType.LOAN_REPAYMENT:
          return this.validateLoanRepayment(data);
        default:
          // For other transaction types that aren't specific to loans
          return true;
      }
    } catch (error) {
      logger.error('Loan transaction validation error', error);
      return false;
    }
  }
  
  /**
   * Process a loan transaction
   */
  async processTransaction(transaction: Transaction): Promise<void> {
    try {
      // Skip if not completed
      if (transaction.status !== TransactionStatus.COMPLETED) {
        return;
      }
      
      switch (transaction.transactionType) {
        case TransactionType.LOAN_DISBURSEMENT:
          await this.processLoanDisbursement(transaction);
          break;
        case TransactionType.LOAN_REPAYMENT:
          await this.processLoanRepayment(transaction);
          break;
        case TransactionType.REVERSAL:
          await this.processReversal(transaction);
          break;
      }
      
      // Create notification if related to a loan
      if (transaction.loanId) {
        await this.createNotification(transaction);
      }
    } catch (error) {
      logger.error(`Error processing loan transaction ${transaction.id}:`, error);
      throw new TransactionError(
        'Failed to process loan transaction',
        TransactionErrorCodes.PROCESSING_ERROR,
        500,
        error as Error
      );
    }
  }
  
  /**
   * Handle changes in transaction status
   */
  async onTransactionStatusChange(transaction: Transaction, previousStatus: TransactionStatus): Promise<void> {
    try {
      // Only handle transitions to COMPLETED status
      if (previousStatus !== TransactionStatus.COMPLETED && 
          transaction.status === TransactionStatus.COMPLETED) {
        
        // Process the transaction now that it's completed
        await this.processTransaction(transaction);
      }
    } catch (error) {
      logger.error(`Error handling status change for loan transaction ${transaction.id}:`, error);
      // Don't rethrow here as this is a notification step and shouldn't block the main transaction
    }
  }
  
  /**
   * Validate a loan disbursement transaction
   */
  private async validateLoanDisbursement(data: CreateTransactionDto): Promise<boolean> {
    // Must have amount
    if (!data.amount) {
      logger.error('Missing amount for loan disbursement transaction');
      return false;
    }
    
    // Amount must be positive
    const amount = new Decimal(data.amount.toString());
    if (amount.lessThanOrEqualTo(0)) {
      logger.error('Disbursement amount must be greater than 0');
      return false;
    }
    
    // Must have related entity ID (loanId)
    if (!data.relatedEntityId || data.relatedEntityType !== 'LOAN') {
      logger.error('Missing loanId for loan disbursement transaction');
      return false;
    }
    
    // Check if loan exists
    const loan = await prisma.loan.findUnique({
      where: { id: data.relatedEntityId }
    });
    
    if (!loan) {
      logger.error(`Loan not found: ${data.relatedEntityId}`);
      return false;
    }
    
    // Check if loan is in a status that allows disbursement
    if (loan.status !== LoanStatus.APPROVED) {
      logger.error(`Loan ${data.relatedEntityId} is not in APPROVED status, current status: ${loan.status}`);
      return false;
    }
    
    // Check if the disbursement amount matches the approved loan amount
    if (!loan.principalAmount.equals(amount)) {
      logger.error(`Disbursement amount ${amount.toString()} does not match approved loan amount ${loan.principalAmount.toString()}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Validate a loan repayment transaction
   */
  private async validateLoanRepayment(data: CreateTransactionDto): Promise<boolean> {
    // Must have amount
    if (!data.amount) {
      logger.error('Missing amount for loan repayment transaction');
      return false;
    }
    
    // Amount must be positive
    const amount = new Decimal(data.amount.toString());
    if (amount.lessThanOrEqualTo(0)) {
      logger.error('Repayment amount must be greater than 0');
      return false;
    }
    
    // Must have related entity ID (loanId)
    if (!data.relatedEntityId || data.relatedEntityType !== 'LOAN') {
      logger.error('Missing loanId for loan repayment transaction');
      return false;
    }
    
    // Check if loan exists
    const loan = await prisma.loan.findUnique({
      where: { id: data.relatedEntityId }
    });
    
    if (!loan) {
      logger.error(`Loan not found: ${data.relatedEntityId}`);
      return false;
    }
    
    // Check if loan is in a status that allows repayment
    if (loan.status !== LoanStatus.DISBURSED && loan.status !== LoanStatus.ACTIVE) {
      logger.error(`Loan ${data.relatedEntityId} is not in active status, current status: ${loan.status}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Process a loan disbursement transaction
   */
  private async processLoanDisbursement(transaction: Transaction): Promise<void> {
    if (!transaction.amount || !transaction.loanId) {
      return;
    }
    
    // Get the loan
    const loan = await prisma.loan.findUnique({
      where: { id: transaction.loanId }
    });
    
    if (!loan) {
      throw new TransactionError(
        `Loan not found: ${transaction.loanId}`,
        TransactionErrorCodes.ENTITY_NOT_FOUND,
        404
      );
    }
    
    // Calculate next payment due date (typically 1 month from disbursement)
    const nextPaymentDate = new Date();
    nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    
    // Update loan status to disbursed
    await prisma.loan.update({
      where: { id: transaction.loanId },
      data: {
        status: LoanStatus.DISBURSED,
        disbursedAt: new Date(),
        nextPaymentDue: nextPaymentDate
      }
    });
    
    // Generate loan payment schedules if they don't exist
    const scheduleCount = await prisma.loanSchedule.count({
      where: { loanId: transaction.loanId }
    });
    
    if (scheduleCount === 0) {
      await this.generateLoanSchedule(loan);
    }
    
    // Record status change in history
    await prisma.loanStatusHistory.create({
      data: {
        loanId: loan.id,
        fromStatus: LoanStatus.APPROVED,
        toStatus: LoanStatus.DISBURSED,
        changedBy: transaction.initiatedBy,
        reason: `Loan disbursed: ${transaction.amount.toString()}`
      }
    });
    
    // Update the transaction's balanceAfter field (remaining balance is full amount at disbursement)
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        balanceAfter: loan.totalAmount
      }
    });
  }
  
  /**
   * Generate loan repayment schedule
   */
  private async generateLoanSchedule(loan: any): Promise<void> {
    // Calculate monthly payment amount
    const monthlyPayment = loan.totalAmount.dividedBy(loan.tenure).toDecimalPlaces(2);
    const interestPerMonth = loan.interestAmount.dividedBy(loan.tenure).toDecimalPlaces(2);
    const principalPerMonth = loan.principalAmount.dividedBy(loan.tenure).toDecimalPlaces(2);
    
    // Start from disbursement date or current date if not disbursed
    const startDate = loan.disbursedAt || new Date();
    let remainingBalance = loan.totalAmount;
    
    // Create schedule entries for each month
    for (let month = 1; month <= loan.tenure; month++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + month);
      
      // For the last payment, ensure we account for any rounding differences
      const isLastPayment = month === loan.tenure;
      const paymentAmount = isLastPayment ? remainingBalance : monthlyPayment;
      const principalAmount = isLastPayment ? remainingBalance.minus(interestPerMonth) : principalPerMonth;
      
      remainingBalance = remainingBalance.minus(paymentAmount);
      
      await prisma.loanSchedule.create({
        data: {
          loanId: loan.id,
          dueDate,
          expectedAmount: paymentAmount,
          principalAmount: principalAmount,
          interestAmount: interestPerMonth,
          remainingBalance: remainingBalance.lessThan(0) ? new Decimal(0) : remainingBalance
        }
      });
    }
  }
  
  /**
   * Process a loan repayment transaction
   */
  private async processLoanRepayment(transaction: Transaction): Promise<void> {
    if (!transaction.amount || !transaction.loanId) {
      return;
    }
    
    // Get the loan
    const loan = await prisma.loan.findUnique({
      where: { id: transaction.loanId },
      include: {
        paymentSchedules: {
          orderBy: { dueDate: 'asc' },
          where: { status: { in: ['PENDING', 'PARTIAL'] } }
        }
      }
    });
    
    if (!loan) {
      throw new TransactionError(
        `Loan not found: ${transaction.loanId}`,
        TransactionErrorCodes.ENTITY_NOT_FOUND,
        404
      );
    }
    
    // Calculate new paid amount
    const newPaidAmount = loan.paidAmount.plus(transaction.amount);
    
    // Determine if loan is fully repaid
    const isFullyRepaid = newPaidAmount.greaterThanOrEqualTo(loan.totalAmount);
    const newStatus = isFullyRepaid ? LoanStatus.COMPLETED : LoanStatus.ACTIVE;
    const newRemainingBalance = isFullyRepaid 
      ? new Decimal(0)
      : loan.remainingBalance.minus(transaction.amount);
    
    // Update loan record
    await prisma.loan.update({
      where: { id: transaction.loanId },
      data: {
        paidAmount: newPaidAmount,
        remainingBalance: newRemainingBalance,
        lastPaymentDate: new Date(),
        status: newStatus,
        completedAt: isFullyRepaid ? new Date() : undefined
      }
    });
    
    // Record loan status change if status changed
    if (loan.status !== newStatus) {
      await prisma.loanStatusHistory.create({
        data: {
          loanId: loan.id,
          fromStatus: loan.status,
          toStatus: newStatus,
          changedBy: transaction.initiatedBy,
          reason: isFullyRepaid ? 'Loan fully repaid' : 'Loan payment received'
        }
      });
    }
    
    // Apply payment to schedules
    let remainingPayment = transaction.amount;
    for (const schedule of loan.paymentSchedules) {
      if (remainingPayment.equals(0)) break;
      
      const dueAmount = schedule.expectedAmount.minus(schedule.paidAmount);
      
      if (dueAmount.equals(0)) continue;
      
      const paymentForSchedule = remainingPayment.greaterThanOrEqualTo(dueAmount) 
        ? dueAmount 
        : remainingPayment;
        
      const newPaidForSchedule = schedule.paidAmount.plus(paymentForSchedule);
      const newStatus = newPaidForSchedule.equals(schedule.expectedAmount) 
        ? 'PAID' 
        : 'PARTIAL';
      
      // Update schedule
      await prisma.loanSchedule.update({
        where: { id: schedule.id },
        data: {
          paidAmount: newPaidForSchedule,
          status: newStatus as any,
          actualPaymentDate: new Date()
        }
      });
      
      remainingPayment = remainingPayment.minus(paymentForSchedule);
    }
    
    // Create loan repayment record
    const now = new Date();
    await prisma.loanRepayment.create({
      data: {
        loanId: transaction.loanId,
        amount: transaction.amount,
        repaymentDate: now,
        repaymentMonth: now.getMonth() + 1, // 1-based month
        repaymentYear: now.getFullYear(),
        uploadedBy: transaction.initiatedBy,
        isReconciled: true,
        reconciledAt: now
      }
    });
    
    // Update the transaction's balanceAfter field
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        balanceAfter: newRemainingBalance
      }
    });
  }
  
  /**
   * Process a reversal transaction
   */
  async processReversal(transaction: Transaction): Promise<void> {
    // Get the original transaction this is reversing
    if (!transaction.parentTxnId) {
      return;
    }
    
    const originalTx = await prisma.transaction.findUnique({
      where: { id: transaction.parentTxnId }
    });
    
    if (!originalTx || !originalTx.loanId) {
      return;
    }
    
    // Handle different reversal types
    if (originalTx.transactionType === TransactionType.LOAN_DISBURSEMENT) {
      await this.reverseLoanDisbursement(originalTx, transaction);
    } else if (originalTx.transactionType === TransactionType.LOAN_REPAYMENT) {
      await this.reverseLoanRepayment(originalTx, transaction);
    }
  }
  
  /**
   * Reverse a loan disbursement
   */
  private async reverseLoanDisbursement(originalTx: Transaction, reversalTx: Transaction): Promise<void> {
    if (!originalTx.loanId || !originalTx.amount) return;
    
    const loanId = originalTx.loanId;
    
    // Get the loan
    const loan = await prisma.loan.findUnique({
      where: { id: loanId }
    });
    
    if (!loan) return;
    
    // Make sure no repayments have been made
    if (loan.paidAmount.greaterThan(0)) {
      throw new TransactionError(
        'Cannot reverse disbursement after repayments have been made',
        TransactionErrorCodes.VALIDATION_ERROR,
        400
      );
    }
    
    // Update loan status back to approved
    await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: LoanStatus.APPROVED,
        disbursedAt: null
      }
    });
    
    // Record status change in history
    await prisma.loanStatusHistory.create({
      data: {
        loanId: loan.id,
        fromStatus: loan.status,
        toStatus: LoanStatus.APPROVED,
        changedBy: reversalTx.initiatedBy,
        reason: `Disbursement reversed: ${originalTx.amount.toString()}`
      }
    });
    
    // Delete any payment schedules
    await prisma.loanSchedule.deleteMany({
      where: { loanId }
    });
    
    // Update reversal transaction balanceAfter
    await prisma.transaction.update({
      where: { id: reversalTx.id },
      data: {
        balanceAfter: new Decimal(0)
      }
    });
  }
  
  /**
   * Reverse a loan repayment
   */
  private async reverseLoanRepayment(originalTx: Transaction, reversalTx: Transaction): Promise<void> {
    if (!originalTx.loanId || !originalTx.amount) return;
    
    const loanId = originalTx.loanId;
    
    // Get the loan
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        repayments: {
          orderBy: { repaymentDate: 'desc' },
          take: 1
        }
      }
    });
    
    if (!loan) return;
    
    // Calculate new paid amount
    const newPaidAmount = loan.paidAmount.minus(originalTx.amount);
    const newRemainingBalance = loan.remainingBalance.plus(originalTx.amount);
    
    // Update loan status if needed
    let newStatus = loan.status;
    if (loan.status === LoanStatus.COMPLETED) {
      newStatus = LoanStatus.ACTIVE;
    }
    
    // Update loan record
    await prisma.loan.update({
      where: { id: loanId },
      data: {
        paidAmount: newPaidAmount,
        remainingBalance: newRemainingBalance,
        status: newStatus,
        completedAt: newStatus === LoanStatus.COMPLETED ? loan.completedAt : null
      }
    });
    
    // Record status change if needed
    if (loan.status !== newStatus) {
      await prisma.loanStatusHistory.create({
        data: {
          loanId: loan.id,
          fromStatus: loan.status,
          toStatus: newStatus,
          changedBy: reversalTx.initiatedBy,
          reason: `Repayment reversed: ${originalTx.amount.toString()}`
        }
      });
    }
    
    // If there's a recent repayment record, mark it as reversed
    if (loan.repayments.length > 0) {
      const latestRepayment = loan.repayments[0];
      
      // Only reverse if amount matches
      if (latestRepayment.amount.equals(originalTx.amount)) {
        await prisma.loanRepayment.update({
          where: { id: latestRepayment.id },
          data: {
            isReconciled: false,
            reconciliationNotes: `Reversed by transaction ${reversalTx.id}`
          }
        });
      }
    }
    
    // Update reversal transaction balanceAfter
    await prisma.transaction.update({
      where: { id: reversalTx.id },
      data: {
        balanceAfter: newRemainingBalance
      }
    });
  }
  
  /**
   * Create a notification for the transaction
   */
  private async createNotification(transaction: Transaction): Promise<void> {
    try {
      if (!transaction.loanId) return;
      
      // Get the loan record to find the member
      const loan = await prisma.loan.findUnique({
        where: { id: transaction.loanId },
        include: {
          member: true
        }
      });
      
      if (!loan || !loan.member) return;

      // Get the member's user account
      const user = await prisma.user.findFirst({
        where: { biodataId: loan.memberId }
      });
      
      if (!user) return;
      
      let title: string;
      let message: string;
      
      // Create appropriate message based on transaction type
      switch (transaction.transactionType) {
        case TransactionType.LOAN_DISBURSEMENT:
          title = 'Loan Disbursed';
          message = `Your loan of ${transaction.amount.toString()} has been disbursed.`;
          break;
        case TransactionType.LOAN_REPAYMENT:
          title = 'Loan Repayment';
          message = `Your loan repayment of ${transaction.amount.toString()} has been processed. Remaining balance: ${loan.remainingBalance.toString()}`;
          break;
        case TransactionType.LOAN_INTEREST:
          title = 'Loan Interest';
          message = `Interest of ${transaction.amount.toString()} has been applied to your loan.`;
          break;
        case TransactionType.REVERSAL:
          title = 'Transaction Reversed';
          message = `A transaction of ${transaction.amount.toString()} has been reversed on your loan account.`;
          break;
        default:
          title = 'Loan Transaction';
          message = `A transaction of ${transaction.amount.toString()} has been processed on your loan account.`;
      }
      
      // Create notification in the database
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'TRANSACTION',
          title,
          message,
          transactionId: transaction.id,
          metadata: {
            transactionType: transaction.transactionType,
            amount: transaction.amount.toString(),
            remainingBalance: loan.remainingBalance.toString()
          },
          priority: 'NORMAL'
        }
      });
      
    } catch (error) {
      // Don't let notification errors break the transaction
      logger.error(`Error creating notification for transaction ${transaction.id}:`, error);
    }
  }
}