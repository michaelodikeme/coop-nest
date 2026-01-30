import { PrismaClient, Prisma, TransactionStatus, TransactionType, TransactionModule } from '@prisma/client';
import { 
  TransactionFilterDto, 
  TransactionSummary, 
  TransactionReportFilters 
} from '../interfaces/transaction.interface';
import { TransactionError, TransactionErrorCodes } from '../errors/transaction.error';
import logger from '../../../utils/logger';
import { prisma } from '../../../utils/prisma';
/**
 * Service for transaction reporting and analytics
 */
export class TransactionReportingService {


  constructor() {

  }

  /**
   * Get comprehensive transaction summary
   * @param filters Summary filters
   * @returns Transaction summary
   */
  async getTransactionSummary(filters: TransactionFilterDto = {
    approvedBy: undefined,
    minAmount: undefined,
    maxAmount: undefined
  }): Promise<TransactionSummary> {
    try {
      const whereClause = this.buildTransactionWhereClause(filters);
      
      // Get all transactions that match the filters
      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        select: {
          id: true,
          transactionType: true,
          baseType: true,
          module: true,
          amount: true,
          status: true
        }
      });
      
      // Initialize summary
      const summary: TransactionSummary = {
        totalTransactions: transactions.length,
        pendingTransactions: 0,
        processingTransactions: 0,
        completedTransactions: 0,
        failedTransactions: 0,
        reversedTransactions: 0,
        creditTotal: 0,
        debitTotal: 0,
        netBalance: 0,
        moduleSummary: {},
        typeSummary: {}
      };
      
      // Process each transaction
      for (const txn of transactions) {
        // Count by status
        switch (txn.status) {
          case TransactionStatus.PENDING:
            summary.pendingTransactions++;
            break;
          case TransactionStatus.PROCESSING:
            summary.processingTransactions++;
            break;
          case TransactionStatus.COMPLETED:
            summary.completedTransactions++;
            break;
          case TransactionStatus.FAILED:
            summary.failedTransactions++;
            break;
          case TransactionStatus.REVERSED:
            summary.reversedTransactions++;
            break;
        }
        
        // Track credit/debit totals
        const amount = txn.amount.toNumber();
        if (txn.baseType === TransactionType.CREDIT) {
          summary.creditTotal += amount;
        } else if (txn.baseType === TransactionType.DEBIT) {
          summary.debitTotal += amount;
        }
        
        // Update module summary
        if (!summary.moduleSummary[txn.module]) {
          summary.moduleSummary[txn.module] = {
            totalTransactions: 0,
            creditAmount: 0,
            debitAmount: 0,
            netAmount: 0
          };
        }
        
        summary.moduleSummary[txn.module].totalTransactions++;
        if (txn.baseType === TransactionType.CREDIT) {
          summary.moduleSummary[txn.module].creditAmount += amount;
          summary.moduleSummary[txn.module].netAmount += amount;
        } else if (txn.baseType === TransactionType.DEBIT) {
          summary.moduleSummary[txn.module].debitAmount += amount;
          summary.moduleSummary[txn.module].netAmount -= amount;
        }
        
        // Update type summary
        if (!summary.typeSummary[txn.transactionType]) {
          summary.typeSummary[txn.transactionType] = {
            totalTransactions: 0,
            totalAmount: 0
          };
        }
        
        summary.typeSummary[txn.transactionType].totalTransactions++;
        summary.typeSummary[txn.transactionType].totalAmount += amount;
      }
      
      // Calculate net balance
      summary.netBalance = summary.creditTotal - summary.debitTotal;
      
      return summary;
    } catch (error) {
      logger.error('Error generating transaction summary:', error);
      throw new TransactionError(
        'Failed to generate transaction summary',
        TransactionErrorCodes.PROCESSING_ERROR,
        500,
        error as Error
      );
    }
  }

  /**
   * Generate transaction reports
   * @param filters Report filters
   * @returns Report data
   */
  async generateTransactionReport(filters: TransactionReportFilters): Promise<any> {
    try {
      const { groupBy = 'day', ...searchFilters } = filters;
      
      // Get transactions
      const whereClause = this.buildTransactionWhereClause(searchFilters);
      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: filters.includeDetails ? {
          initiator: {
            select: {
              id: true,
              username: true,
              biodata: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        } : undefined,
        orderBy: { createdAt: 'desc' }
      });
      
      // Group transactions based on specified grouping
      let groupedData;
      switch (groupBy) {
        case 'day':
          groupedData = this.groupTransactionsByDay(transactions);
          break;
        case 'week':
          groupedData = this.groupTransactionsByWeek(transactions);
          break;
        case 'month':
          groupedData = this.groupTransactionsByMonth(transactions);
          break;
        case 'module':
          groupedData = this.groupTransactionsByModule(transactions);
          break;
        case 'type':
          groupedData = this.groupTransactionsByType(transactions);
          break;
        default:
          groupedData = transactions;
      }
      
      return {
        report: groupedData,
        summary: {
          totalTransactions: transactions.length,
          totalAmount: transactions.reduce((sum, txn) => sum + txn.amount.toNumber(), 0),
          dateRange: {
            start: searchFilters.startDate ? new Date(searchFilters.startDate) : undefined,
            end: searchFilters.endDate ? new Date(searchFilters.endDate) : undefined
          }
        }
      };
    } catch (error) {
      logger.error('Error generating transaction report:', error);
      if (error instanceof TransactionError) {
        throw error;
      }
      throw new TransactionError(
        'Failed to generate transaction report',
        TransactionErrorCodes.PROCESSING_ERROR,
        500,
        error as Error
      );
    }
  }
  
  /**
   * Build Prisma where clause from filter options
   * @param filters Filter options
   * @returns Prisma where input
   */
  private buildTransactionWhereClause(filters: TransactionFilterDto): Prisma.TransactionWhereInput {
    const whereClause: Prisma.TransactionWhereInput = {};
    
    // Apply filters
    if (filters.module) {
      whereClause.module = filters.module as TransactionModule;
    }
    
    if (filters.transactionType) {
      whereClause.transactionType = filters.transactionType as TransactionType;
    }
    
    if (filters.baseType) {
      whereClause.baseType = filters.baseType as TransactionType;
    }
    
    if (filters.status) {
      whereClause.status = filters.status;
    }
    
    if (filters.initiatedBy) {
      whereClause.initiatedBy = filters.initiatedBy;
    }
    
    if (filters.relatedEntityId && filters.relatedEntityType) {
      whereClause.metadata = {
        path: ['entityId'],
        equals: filters.relatedEntityId
      };
      whereClause.metadata = {
        path: ['entityType'],
        equals: filters.relatedEntityType
      };
    }
    
    if (filters.loanId) {
      whereClause.loanId = filters.loanId;
    }
    
    if (filters.savingsId) {
      whereClause.savingsId = filters.savingsId;
    }
    
    if (filters.sharesId) {
      whereClause.sharesId = filters.sharesId;
    }
    
    if (filters.requestId) {
      whereClause.requestId = filters.requestId;
    }
    
    // Handle date range
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }
    
    return whereClause;
  }

  /**
   * Group transactions by day
   * @param transactions List of transactions
   * @returns Grouped transactions
   */
  private groupTransactionsByDay(transactions: any[]): any {
    const grouped: { [date: string]: { date: string; transactions: any[]; totalAmount: number; count: number } } = {};
    
    for (const txn of transactions) {
      const date = new Date(txn.createdAt).toISOString().split('T')[0];
      
      if (!grouped[date]) {
        grouped[date] = {
          date,
          transactions: [],
          totalAmount: 0,
          count: 0
        };
      }
      
      grouped[date].transactions.push(txn);
      grouped[date].totalAmount += txn.amount.toNumber();
      grouped[date].count++;
    }
    
    return Object.values(grouped);
  }
  
  /**
   * Group transactions by week
   * @param transactions List of transactions
   * @returns Grouped transactions
   */
  private groupTransactionsByWeek(transactions: any[]): any {
    const grouped: { [weekKey: string]: { weekKey: string; transactions: any[]; totalAmount: number; count: number } } = {};
    
    for (const txn of transactions) {
      const date = new Date(txn.createdAt);
      const year = date.getFullYear();
      const weekNumber = this.getWeekNumber(date);
      const key = `${year}-W${weekNumber}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          weekKey: key,
          transactions: [],
          totalAmount: 0,
          count: 0
        };
      }
      
      grouped[key].transactions.push(txn);
      grouped[key].totalAmount += txn.amount.toNumber();
      grouped[key].count++;
    }
    
    return Object.values(grouped);
  }
  
  /**
   * Get week number for a date
   * @param date Date
   * @returns Week number
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
  
  /**
   * Group transactions by month
   * @param transactions List of transactions
   * @returns Grouped transactions
   */
  private groupTransactionsByMonth(transactions: any[]): any {
    const grouped: { [monthKey: string]: { monthKey: string; transactions: any[]; totalAmount: number; count: number } } = {};
    
    for (const txn of transactions) {
      const date = new Date(txn.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          monthKey: key,
          transactions: [],
          totalAmount: 0,
          count: 0
        };
      }
      
      grouped[key].transactions.push(txn);
      grouped[key].totalAmount += txn.amount.toNumber();
      grouped[key].count++;
    }
    
    return Object.values(grouped);
  }
  
  /**
   * Group transactions by module
   * @param transactions List of transactions
   * @returns Grouped transactions
   */
  private groupTransactionsByModule(transactions: any[]): any {
    const grouped: { [module: string]: { module: string; transactions: any[]; totalAmount: number; count: number } } = {};
    
    for (const txn of transactions) {
      const { module } = txn;
      
      if (!grouped[module]) {
        grouped[module] = {
          module,
          transactions: [],
          totalAmount: 0,
          count: 0
        };
      }
      
      grouped[module].transactions.push(txn);
      grouped[module].totalAmount += txn.amount.toNumber();
      grouped[module].count++;
    }
    
    return Object.values(grouped);
  }
  
  /**
   * Group transactions by type
   * @param transactions List of transactions
   * @returns Grouped transactions
   */
  private groupTransactionsByType(transactions: any[]): any {
    const grouped: { [type: string]: { transactionType: string; transactions: any[]; totalAmount: number; count: number } } = {};
    
    for (const txn of transactions) {
      const { transactionType } = txn;
      
      if (!grouped[transactionType]) {
        grouped[transactionType] = {
          transactionType,
          transactions: [],
          totalAmount: 0,
          count: 0
        };
      }
      
      grouped[transactionType].transactions.push(txn);
      grouped[transactionType].totalAmount += txn.amount.toNumber();
      grouped[transactionType].count++;
    }
    
    return Object.values(grouped);
  }
}