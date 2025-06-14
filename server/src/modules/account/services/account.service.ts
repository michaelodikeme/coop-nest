import { PrismaClient, Prisma, RequestType, RequestStatus, TransactionType, TransactionModule, RequestModule } from '@prisma/client';
import { 
  ICreateAccountInput, 
  IUpdateAccountInput, 
  IAccountVerificationInput,
  IAccountQueryFilters,
  IAccountVerificationResult,
  IAccountRequest,
  IAccountInfo
} from '../interfaces/account.interface';
import { bankAccountVerification } from '../utils/bankVerification';
import { ApiError } from '../../../utils/apiError';
import logger from '../../../utils/logger';

const prisma = new PrismaClient();

// Helper function to map Prisma Account to IAccountInfo
function mapToAccountInfo(account: any): IAccountInfo {
  return {
    ...account,
    verificationDate: account.verificationDate || undefined,
    verifiedBy: account.verifiedBy || undefined
  };
}

export class AccountService {
  async createAccount(input: ICreateAccountInput): Promise<IAccountInfo> {
    try {
      // Check if account already exists for user
      const existingAccount = await prisma.accountInfo.findFirst({
        where: { biodataId: input.biodataId }
      });

      if (existingAccount) {
        throw new ApiError('Member already has a bank account registered', 400);
      }

      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Create account record
        const account = await tx.accountInfo.create({
          data: {
            biodataId: input.biodataId,
            bankId: input.bankId,
            accountNumber: input.accountNumber,
            bvn: input.bvn,
            accountName: input.accountName,
            isVerified: false
          },
          include: { bank: true }
        });

        const serializedAccount = {
          ...account,
          bank: account.bank,
          verificationDate: undefined,
          verifiedBy: undefined
        };

        // Create request for account verification
        await tx.request.create({
          data: {
            type: RequestType.ACCOUNT_VERIFICATION,
            status: RequestStatus.PENDING,
            initiatorId: input.biodataId,
            biodataId: input.biodataId,
            content: JSON.parse(JSON.stringify({
              accountInfo: serializedAccount,
              action: 'VERIFY_NEW_ACCOUNT'
            })),
            module: RequestModule.ACCOUNT
          }
        });

        return mapToAccountInfo(account);
      });
    } catch (error) {
      logger.error('Error in createAccount:', error);
      throw error;
    }
  }

  async requestAccountUpdate(accountId: string, updates: IUpdateAccountInput): Promise<IAccountRequest> {
    try {
      const account = await prisma.accountInfo.findUnique({
        where: { id: accountId },
        include: { bank: true }
      });

      if (!account) {
        throw new ApiError('Account not found', 404);
      }

      // Ensure biodataId exists
      if (!account.biodataId) {
        throw new ApiError('Account has no associated member', 400);
      }

      const serializedContent = {
        accountInfo: updates,
        currentAccount: {
          ...account,
          bank: account.bank,
          verificationDate: account.verificationDate || undefined,
          verifiedBy: account.verifiedBy || undefined
        },
        action: 'UPDATE_ACCOUNT'
      };

      // Create update request
      const request = await prisma.request.create({
        data: {
          type: RequestType.ACCOUNT_UPDATE,
          status: RequestStatus.PENDING,
          initiatorId: account.biodataId,
          biodataId: account.biodataId,
          content: JSON.parse(JSON.stringify(serializedContent)),
          module: RequestModule.ACCOUNT
        }
      });

      return {
        type: request.type,
        biodataId: request.biodataId!,
        content: request.content as any,
        status: request.status
      };
    } catch (error) {
      logger.error('Error in requestAccountUpdate:', error);
      throw error;
    }
  }

  async processAccountUpdateRequest(requestId: string, approved: boolean, notes?: string): Promise<IAccountInfo> {
    try {
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const request = await tx.request.findUnique({
          where: { id: requestId }
        });

        if (!request || request.type !== RequestType.ACCOUNT_UPDATE) {
          throw new ApiError('Invalid request', 404);
        }

        const content = request.content as any;
        const updates = content.accountInfo;
        const accountId = content.currentAccount.id;

        if (approved) {
          // Update account with approved changes
          const account = await tx.accountInfo.update({
            where: { id: accountId },
            data: {
              ...updates,
              isVerified: false // Reset verification status for new details
            },
            include: { bank: true }
          });

          // Update request status
          await tx.request.update({
            where: { id: requestId },
            data: {
              status: RequestStatus.APPROVED,
              notes
            }
          });

          return mapToAccountInfo(account);
        } else {
          // Reject the request
          await tx.request.update({
            where: { id: requestId },
            data: {
              status: RequestStatus.REJECTED,
              notes
            }
          });

          const account = await tx.accountInfo.findUnique({
            where: { id: accountId },
            include: { bank: true }
          });
          
          return mapToAccountInfo(account!);
        }
      });
    } catch (error) {
      logger.error('Error in processAccountUpdateRequest:', error);
      throw error;
    }
  }

  async verifyAccount(input: IAccountVerificationInput): Promise<IAccountVerificationResult> {
    try {
      const result = await bankAccountVerification.verifyAccount({
        accountNumber: input.accountNumber,
        bankCode: input.bankCode
      });

      return {
        success: result.status === 'success',
        accountName: result.accountName,
        message: result.status === 'error' ? 'Account verification failed' : undefined
      };
    } catch (error) {
      logger.error('Error in verifyAccount:', error);
      throw error;
    }
  }

  async getAccountById(id: string): Promise<IAccountInfo | null> {
    try {
      const account = await prisma.accountInfo.findUnique({
        where: { id },
        include: { bank: true }
      });

      return account ? mapToAccountInfo(account) : null;
    } catch (error) {
      logger.error('Error in getAccountById:', error);
      throw error;
    }
  }

  async getAccounts(filters?: IAccountQueryFilters): Promise<IAccountInfo[]> {
    try {
      const accounts = await prisma.accountInfo.findMany({
        where: filters,
        include: { bank: true }
      });

      return accounts.map(mapToAccountInfo);
    } catch (error) {
      logger.error('Error in getAccounts:', error);
      throw error;
    }
  }
}