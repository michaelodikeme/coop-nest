import { Prisma, PrismaClient, TransactionStatus, TransactionModule } from '@prisma/client';
import { TransactionFilterDto } from '../interfaces/transaction.interface';
import { TransactionError, TransactionErrorCodes } from '../errors/transaction.error';
import logger from '../../../utils/logger';
import { PaginationOptions } from '../../../interfaces/pagination.interface';
import { TransactionWithDetails } from '../interfaces/transaction.interface';
import { prisma } from '../../../utils/prisma';
/**
 * Service for querying transactions
 */
export class TransactionQueryService {
  
  constructor() {
  }
  
  /**
   * Search for transactions with filtering and pagination
   * @param filters Filter criteria
   * @param options Pagination options
   * @returns Paginated transaction results
   */
  async searchTransactions(
    filters: TransactionFilterDto = {
      approvedBy: undefined,
      minAmount: undefined,
      maxAmount: undefined
    },
    options: PaginationOptions = { page: 1, limit: 10 }
  ): Promise<any> {
    try {
      const whereClause = this.buildTransactionWhereClause(filters);
      const skip = (options.page - 1) * options.limit;
      
      const [transactions, totalCount] = await Promise.all([
        prisma.transaction.findMany({
          where: whereClause,
          include: {
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
            },
            approver: {
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
            },
            parentTransaction: true,
            childTransactions: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: options.limit
        }),
        prisma.transaction.count({ where: whereClause })
      ]);
      
      // Format output for client consumption
      const formattedTransactions = transactions.map(txn => 
        this.formatTransactionOutput(txn)
      );
      
      return {
        data: formattedTransactions,
        meta: {
          totalCount,
          currentPage: options.page,
          totalPages: Math.ceil(totalCount / options.limit),
          pageSize: options.limit
        }
      };
    } catch (error) {
      logger.error('Error searching transactions:', error);
      throw new TransactionError(
        'Failed to search transactions',
        TransactionErrorCodes.DATABASE_ERROR,
        500,
        error as Error
      );
    }
  }

  /**
   * Get a user's transaction history
   * @param userId User ID
   * @param options Filtering and pagination options
   * @returns User's transaction history
   */
  async getUserTransactionHistory(
    userId: string,
    options: TransactionFilterDto & PaginationOptions = { page: 1, limit: 10, approvedBy: undefined, minAmount: undefined, maxAmount: undefined }
  ): Promise<any> {
    try {
      // Get user's biodata to find related entities
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          biodata: {
            include: {
              loans: true,
              savings: true,
              shares: true
            }
          }
        }
      });
      
      if (!user || !user.biodata) {
        return {
          data: [],
          meta: {
            totalCount: 0,
            currentPage: options.page,
            totalPages: 0,
            pageSize: options.limit
          }
        };
      }
      
      const biodata = user.biodata;
      
      // Build the where clause to find all transactions related to this user
      const whereClause = {
        OR: [
          // Directly initiated by user
          { initiatedBy: userId },
          
          // Directly approved by user
          { approvedBy: userId },
          
          // Related to user's biodata
          { relatedEntityType: 'BIODATA', relatedEntityId: biodata.id },
          
          // Loan-related transactions
          ...(biodata.loans.map(loan => ({
            OR: [
              { loanId: loan.id },
              { relatedEntityType: 'LOAN', relatedEntityId: loan.id }
            ]
          }))),
          
          // Savings-related transactions
          ...(biodata.savings.map(savings => ({
            OR: [
              { savingsId: savings.id },
              { relatedEntityType: 'SAVINGS', relatedEntityId: savings.id }
            ]
          }))),
          
          // Shares-related transactions
          ...(biodata.shares.map(shares => ({
            OR: [
              { sharesId: shares.id },
              { relatedEntityType: 'SHARES', relatedEntityId: shares.id }
            ]
          })))
        ]
      };
      
      // Build a complete where clause combining user relations with filters
      const filterConditions: any = {};
      
      // Add filters from options
      if (options.module) {
        filterConditions.module = options.module;
      }
      
      if (options.transactionType) {
        filterConditions.transactionType = options.transactionType;
      }
      
      if (options.status) {
      if (options.startDate || options.endDate) {
        filterConditions.createdAt = {};
        
        if (options.startDate) {
          filterConditions.createdAt.gte = new Date(options.startDate);
        }
        
        if (options.endDate) {
          filterConditions.createdAt.lte = new Date(options.endDate);
        }
      }
      
      // Combine the user relations with filter conditions
      const completeWhereClause = {
        AND: [
          whereClause,
          filterConditions
        ]
      };
      
      const skip = (options.page - 1) * options.limit;
      }
      
      const skip = (options.page - 1) * options.limit;
      
      const [transactions, totalCount] = await Promise.all([
        prisma.transaction.findMany({
          where: whereClause,
          include: {
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
            },
            approver: {
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
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: options.limit
        }),
        prisma.transaction.count({ where: whereClause })
      ]);
      
      // Format the transactions for output
      const formattedTransactions = transactions.map(txn => 
        this.formatTransactionOutput(txn)
      );
      
      return {
        data: formattedTransactions,
        meta: {
          totalCount,
          currentPage: options.page,
          totalPages: Math.ceil(totalCount / options.limit),
          pageSize: options.limit
        }
      };
    } catch (error) {
      logger.error(`Error fetching transaction history for user ${userId}:`, error);
      throw new TransactionError(
        'Failed to retrieve transaction history',
        TransactionErrorCodes.DATABASE_ERROR,
        500,
        error as Error
      );
    }
  }
  
  /**
   * Build the where clause for transaction queries
   */
  buildTransactionWhereClause(filters: TransactionFilterDto): any {
    const whereClause: any = {};
    
    if (filters.module) {
      whereClause.module = filters.module;
    }
    
    if (filters.transactionType) {
      whereClause.transactionType = filters.transactionType;
    }
    
    if (filters.status) {
      whereClause.status = filters.status;
    }
    
    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      
      if (filters.startDate) {
        whereClause.createdAt.gte = new Date(filters.startDate);
      }
      
      if (filters.endDate) {
        whereClause.createdAt.lte = new Date(filters.endDate);
      }
    }
    
    if (filters.initiatedBy) {
      whereClause.initiatedBy = filters.initiatedBy;
    }
    
    if (filters.approvedBy) {
      whereClause.approvedBy = filters.approvedBy;
    }
    
    if (filters.relatedEntityType) {
      whereClause.relatedEntityType = filters.relatedEntityType;
      
      if (filters.relatedEntityId) {
        whereClause.relatedEntityId = filters.relatedEntityId;
      }
    }
    
    if (filters.requestId) {
      whereClause.requestId = filters.requestId;
    }
    
    if (filters.minAmount || filters.maxAmount) {
      whereClause.amount = {};
      
      if (filters.minAmount) {
        whereClause.amount.gte = filters.minAmount;
      }
      
      if (filters.maxAmount) {
        whereClause.amount.lte = filters.maxAmount;
      }
    }
    
    return whereClause;
  }
  
  /**
   * Format transaction output for client consumption
   * @param transaction Raw transaction with includes
   * @returns Formatted transaction
   */
  private formatTransactionOutput(transaction: any): TransactionWithDetails {
    // Format initiator information
    let initiator = undefined;
    if (transaction.initiator) {
      initiator = {
        id: transaction.initiator.id,
        username: transaction.initiator.username,
        fullName: transaction.initiator.biodata 
          ? `${transaction.initiator.biodata.firstName} ${transaction.initiator.biodata.lastName}`
          : undefined
      };
    }
    
    // Format approver information
    let approver = undefined;
    if (transaction.approver) {
      approver = {
        id: transaction.approver.id,
        username: transaction.approver.username,
        fullName: transaction.approver.biodata 
          ? `${transaction.approver.biodata.firstName} ${transaction.approver.biodata.lastName}`
          : undefined
      };
    }
    
    // Create formatted transaction
    return {
      ...transaction,
      initiator,
      approver,
      // Retain related entities but format as needed
      relatedEntity: this.getRelatedEntityDetails(transaction)
    };
  }
  
  /**
   * Extract related entity details from transaction
   */
  private getRelatedEntityDetails(transaction: any): any {
    if (!transaction.relatedEntityType || !transaction.relatedEntityId) {
      return null;
    }
    
    // Return just the basic information since the full entity would be fetched separately
    return {
      type: transaction.relatedEntityType,
      id: transaction.relatedEntityId
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<TransactionWithDetails | null> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: {
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
          },
          approver: {
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
          },
          parentTransaction: true,
          childTransactions: true
        }
      });
      
      if (!transaction) {
        return null;
      }
      
      return this.formatTransactionOutput(transaction);
    } catch (error) {
      logger.error(`Error getting transaction by ID ${id}:`, error);
      throw new TransactionError(
        'Failed to retrieve transaction',
        TransactionErrorCodes.DATABASE_ERROR,
        500,
        error as Error
      );
    }
  }

  /**
   * Check if a user has access to an entity
   */
  async userHasAccessToEntity(userId: string, entityType: string, entityId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          biodata: {
            include: {
              loans: true,
              savings: true,
              shares: true
            }
          }
        }
      });
      
      if (!user || !user.biodata) {
        return false;
      }
      
      switch (entityType) {
        case 'LOAN':
          return user.biodata.loans.some(loan => loan.id === entityId);
        case 'SAVINGS':
          return user.biodata.savings.some(savings => savings.id === entityId);
        case 'SHARES':
          return user.biodata.shares.some(shares => shares.id === entityId);
        case 'BIODATA':
          return user.biodata.id === entityId;
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Error checking user access to entity:`, error);
      return false;
    }
  }

  /**
   * Get transactions by entity
   */
  async getTransactionsByEntity(
    entityType: string,
    entityId: string,
    options: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<any> {
    try {
      let whereClause: Prisma.TransactionWhereInput = {};
      
      // Build where clause based on entity type
      switch (entityType) {
        case 'LOAN':
          whereClause.loanId = entityId;
          break;
        case 'SAVINGS':
          whereClause.savingsId = entityId;
          break;
        case 'SHARES':
          whereClause.sharesId = entityId;
          break;
        case 'BIODATA':
          whereClause = {
            OR: [
              { initiator: { biodataId: entityId } },
              // More conditions as needed for biodata
            ]
          };
          break;
      }
      
      const skip = (options.page - 1) * options.limit;
      
      const [transactions, totalCount] = await Promise.all([
        prisma.transaction.findMany({
          where: whereClause,
          include: {
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
            },
            approver: {
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
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: options.limit
        }),
        prisma.transaction.count({ where: whereClause })
      ]);
      
      // Format transactions for output
      const formattedTransactions = transactions.map(txn => 
        this.formatTransactionOutput(txn)
      );
      
      return {
        data: formattedTransactions,
        meta: {
          totalCount,
          currentPage: options.page,
          totalPages: Math.ceil(totalCount / options.limit),
          pageSize: options.limit
        }
      };
    } catch (error) {
      logger.error(`Error getting entity transactions:`, error);
      throw new TransactionError(
        'Failed to retrieve entity transactions',
        TransactionErrorCodes.DATABASE_ERROR,
        500,
        error as Error
      );
    }
  }

  /**
   * Get transactions by user
   */
  async getTransactionsByUser(
    userId: string,
    options: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<any> {
    try {
      // Get user with related entities
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          biodata: true
        }
      });
      
      if (!user) {
        throw new TransactionError(
          `User not found with ID ${userId}`,
          TransactionErrorCodes.TRANSACTION_NOT_FOUND,
          404
        );
      }
      
      const whereClause: Prisma.TransactionWhereInput = {
        // Include transactions initiated or approved by the user
        OR: [
          { initiatedBy: userId },
          { approvedBy: userId }
        ]
      };
      
      // If user has biodata, include transactions related to their entities
      if (user.biodata) {
        whereClause.OR!.push(
          { loanId: { in: await this.getLoanIdsForUser(userId) } },
          { savingsId: { in: await this.getSavingsIdsForUser(userId) } },
          { sharesId: { in: await this.getSharesIdsForUser(userId) } }
        );
      }
      
      const skip = (options.page - 1) * options.limit;
      
      const [transactions, totalCount] = await Promise.all([
        prisma.transaction.findMany({
          where: whereClause,
          include: {
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
            },
            approver: {
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
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: options.limit
        }),
        prisma.transaction.count({ where: whereClause })
      ]);
      
      // Format transactions for output
      const formattedTransactions = transactions.map(txn => 
        this.formatTransactionOutput(txn)
      );
      
      return {
        data: formattedTransactions,
        meta: {
          totalCount,
          currentPage: options.page,
          totalPages: Math.ceil(totalCount / options.limit),
          pageSize: options.limit
        }
      };
    } catch (error) {
      logger.error(`Error getting user transactions:`, error);
      if (error instanceof TransactionError) {
        throw error;
      }
      throw new TransactionError(
        'Failed to retrieve user transactions',
        TransactionErrorCodes.DATABASE_ERROR,
        500,
        error as Error
      );
    }
  }

  /**
   * Get transaction counts by status
   */
  async getTransactionCountsByStatus(module?: TransactionModule): Promise<Record<string, number>> {
    try {
      const baseWhereClause: Prisma.TransactionWhereInput = module ? { module } : {};
      
      // Get counts for each status
      const [pendingCount, processingCount, completedCount, failedCount, cancelledCount, reversedCount, totalCount] = 
      await Promise.all([
        prisma.transaction.count({ 
          where: { ...baseWhereClause, status: TransactionStatus.PENDING } 
        }),
        prisma.transaction.count({ 
          where: { ...baseWhereClause, status: TransactionStatus.PROCESSING } 
        }),
        prisma.transaction.count({ 
          where: { ...baseWhereClause, status: TransactionStatus.COMPLETED } 
        }),
        prisma.transaction.count({ 
          where: { ...baseWhereClause, status: TransactionStatus.FAILED } 
        }),
        prisma.transaction.count({ 
          where: { ...baseWhereClause, status: TransactionStatus.CANCELLED } 
        }),
        prisma.transaction.count({ 
          where: { ...baseWhereClause, status: TransactionStatus.REVERSED } 
        }),
        prisma.transaction.count({ 
          where: baseWhereClause 
        })
      ]);
      
      return {
        PENDING: pendingCount,
        PROCESSING: processingCount,
        COMPLETED: completedCount,
        FAILED: failedCount,
        CANCELLED: cancelledCount,
        REVERSED: reversedCount,
        TOTAL: totalCount
      };
    } catch (error) {
      logger.error(`Error getting transaction counts:`, error);
      throw new TransactionError(
        'Failed to retrieve transaction counts',
        TransactionErrorCodes.DATABASE_ERROR,
        500,
        error as Error
      );
    }
  }

  /**
   * Get all transactions with optional pagination, sorting, and filtering
   * @param options Pagination, sorting, and filter options
   * @returns Paginated transaction results
   */
  async getAllTransactions({
    page = 1,
    limit = 20,
    sort = 'createdAt:desc',
    transactionType,
    status,
    startDate,
    endDate,
    search,
    module,
  }: {
    page?: number;
    limit?: number;
    sort?: string;
    transactionType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    module?: string;
  }) {
    const [sortField, sortOrder] = sort.split(':');
    const skip = (page - 1) * limit;

    // Build where clause with filters
    const whereClause: Prisma.TransactionWhereInput = {};

    if (transactionType) {
      whereClause.transactionType = transactionType as any;
    }

    if (status) {
      whereClause.status = status as any;
    }

    if (module) {
      whereClause.module = module as any;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the end date fully
        const endDateTime = new Date(endDate);
        endDateTime.setDate(endDateTime.getDate() + 1);
        whereClause.createdAt.lte = endDateTime;
      }
    }

    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        // Check if search looks like a UUID and search by exact ID
        ...(search.length >= 8 ? [{ id: { equals: search } }] : []),
      ];
    }

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { [sortField]: sortOrder === 'desc' ? 'desc' : 'asc' },
        skip,
        take: limit,
        include: {
          initiator: {
            select: {
              id: true,
              username: true,
              biodata: {
                select: {
                  firstName: true,
                  lastName: true,
                  erpId: true
                }
              }
            }
          },
          approver: {
            select: {
              id: true,
              username: true,
              biodata: {
                select: {
                  firstName: true,
                  lastName: true,
                  erpId: true
                }
              }
            }
          },
          loan: {
            select: {
              id: true,
              erpId: true,
              memberId: true,
              loanType: {
                select: {
                  name: true
                }
              },
              member: {
                select: {
                  firstName: true,
                  lastName: true,
                  erpId: true
                }
              }
            }
          },
          savings: {
            select: {
              id: true,
              erpId: true
            }
          },
          shares: {
            select: {
              id: true,
              erpId: true
            }
          },
          personalSavings: {
            select: {
              id: true
            }
          },
          request: true
        }
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    return { data, total, page, limit };
  }

  // Helper methods for user transactions
  private async getLoanIdsForUser(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { biodata: true }
    });
    
    if (!user?.biodata) return [];
    
    const loans = await prisma.loan.findMany({
      where: { memberId: user.biodata.id },
      select: { id: true }
    });
    return loans.map(loan => loan.id);
  }

  private async getSavingsIdsForUser(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { biodata: true }
    });
    
    if (!user?.biodata) return [];
    
    const savings = await prisma.savings.findMany({
      where: { memberId: user.biodata.id },
      select: { id: true }
    });
    return savings.map(savings => savings.id);
  }

  private async getSharesIdsForUser(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { biodata: true }
    });
    
    if (!user?.biodata) return [];
    
    const shares = await prisma.shares.findMany({
      where: { memberId: user.biodata.id },
      select: { id: true }
    });
    return shares.map(shares => shares.id);
  }
}