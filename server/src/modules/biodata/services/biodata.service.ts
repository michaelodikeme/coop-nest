import {
  PrismaClient,
  MembershipStatus,
  NotificationType,
  RequestType,
  RequestStatus,
  RequestModule,
  Prisma
} from '@prisma/client';
import {
  IBiodata,
  IUpdateBiodataInput,
  ICreateBiodataInput,
  IBiodataStatusUpdate,
  IBiodataQueryFilters,
  ICreateAccountInfoInput,
  IApproveLegacyBiodataInput,
  IApproveBiodataRequestInput
} from '../interfaces/biodata.interface';
import { ApiError } from '../../../utils/apiError';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../../../utils/logger';
import { SystemSettingsService } from "../../system/services/systemSettings.service"
import { prisma } from '../../../utils/prisma';

// Get the actual system user ID from the SystemSettingsService
const systemSettingsService = SystemSettingsService.getInstance()

// Update TransactionClient type to match Prisma's transaction type
type TransactionClient = Omit<
PrismaClient,
'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class BiodataService {
  async createBiodata(input: ICreateBiodataInput, creatorId: string, approvalLevel: number) {
    // Add approval level validation
    if (approvalLevel < 1) {
      throw new ApiError('Insufficient approval level. Required: 1', 403);
    }
    
    const { 
      firstName, 
      middleName, 
      lastName, 
      ...rest 
    } = input;
    
    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`.trim();
    
    // Check for existing member
    const existingMember = await prisma.biodata.findFirst({
      where: {
        OR: [
          { erpId: input.erpId },
          { ippisId: input.ippisId },
          { staffNo: input.staffNo },
          { emailAddress: input.emailAddress },
          { phoneNumber: input.phoneNumber },
          { fullName },
        ],
      },
    });
    
    if (existingMember) {
      throw new ApiError('Member already exists with provided details', 400);
    }
    
    // Create biodata with approval request
    const biodata = await prisma.$transaction(async (tx: TransactionClient) => {
      // Create biodata
      const newBiodata = await tx.biodata.create({
        data: {
          ...rest,
          firstName,
          middleName,
          lastName,
          fullName,
          membershipStatus: MembershipStatus.PENDING,
        },
      });
      
      // Create approval request
      const request = await tx.request.create({
        data: {
          type: RequestType.ACCOUNT_CREATION,
          module: RequestModule.ACCOUNT,
          status: RequestStatus.PENDING,
          content: { 
            type: RequestType.ACCOUNT_CREATION, 
            biodataId: newBiodata.id 
          },
          metadata: {
            biodata: {
              ...newBiodata,
              fullName,
              membershipStatus: MembershipStatus.PENDING,
            },
            initiatorId: creatorId,
            priority: 'NORMAL',
            nextApprovalLevel: 2,  // Requires treasurer (level 2) for approval
          },
          biodataId: newBiodata.id,
          initiatorId: creatorId,
          priority: 'NORMAL',
          nextApprovalLevel: 2,  // Requires treasurer (level 2) for approval
        },
      });
      
      // Create notification
      await tx.notification.create({
        data: {
          type: NotificationType.SYSTEM_ALERT,
          title: 'Biodata Created',
          message: `Biodata created for ${newBiodata.fullName}`,
          priority: 'NORMAL',
          userId: creatorId, // System notification
        },
      });
      
      return {
        biodata: newBiodata,
        requestId: request.id
      };
    });
    
    return biodata;
  }
  
  
  /**
   * Create new member registration (public)
   */
  async createNewMember(input: ICreateBiodataInput, creatorId: string, approvalLevel: number) {
    const { firstName, middleName, lastName, ...rest } = input

    const fullName = `${firstName} ${middleName ? middleName + " " : ""}${lastName}`.trim()

    // Check for existing member
    const existingMember = await prisma.biodata.findFirst({
      where: {
        OR: [
          { erpId: input.erpId },
          { ippisId: input.ippisId },
          { staffNo: input.staffNo },
          { emailAddress: input.emailAddress },
          { phoneNumber: input.phoneNumber },
          { fullName },
        ],
      },
    })

    if (existingMember) {
      throw new ApiError("Member already exists with provided details", 400)
    }

    // Create biodata with approval request (no approval level check for public registration)
    const biodata = await prisma.$transaction(async (tx: TransactionClient) => {
      // Create biodata
      const newBiodata = await tx.biodata.create({
        data: {
          ...rest,
          firstName,
          middleName,
          lastName,
          fullName,
          membershipStatus: MembershipStatus.PENDING,
          isApproved: false,
          isVerified: false,
        },
      })

      // Create approval request
      const request = await tx.request.create({
        data: {
          type: RequestType.ACCOUNT_CREATION,
          module: RequestModule.ACCOUNT,
          status: RequestStatus.PENDING,
          content: {
            type: RequestType.ACCOUNT_CREATION,
            biodataId: newBiodata.id,
            source: "PUBLIC_REGISTRATION",
          },
          metadata: {
            biodata: {
              ...newBiodata,
              fullName,
              membershipStatus: MembershipStatus.PENDING,
            },
            initiatorId: creatorId,
            priority: "NORMAL",
            nextApprovalLevel: 2, // Requires treasurer (level 2) for approval
            source: "PUBLIC_REGISTRATION",
          },
          biodataId: newBiodata.id,
          initiatorId: creatorId,
          priority: "NORMAL",
          nextApprovalLevel: 2, // Requires treasurer (level 2) for approval
        },
      })

      const systemUserId = await systemSettingsService.ensureSystemUser()
      // Don't create notification for public registration since there's no user to notify
      if (creatorId !== systemUserId) {
        await tx.notification.create({
          data: {
            type: NotificationType.SYSTEM_ALERT,
            title: "Biodata Created",
            message: `Biodata created for ${newBiodata.fullName}`,
            priority: "NORMAL",
            userId: creatorId,
          },
        })
      }

      return {
        biodata: newBiodata,
        requestId: request.id,
      }
    })

    return biodata
  }
  
  async updateBiodata(biodataId: string, input: IUpdateBiodataInput, initiatorId: string) {
    const biodata = await prisma.biodata.findUnique({
      where: { id: biodataId },
    });
    
    if (!biodata) {
      throw new ApiError('Biodata not found', 404);
    }
    
    // Calculate new fullName if name fields are being updated
    let fullName;
    if (input.firstName || input.middleName || input.lastName) {
      fullName = `${input.firstName || biodata.firstName} ${
        input.middleName || biodata.middleName ? (input.middleName || biodata.middleName) + ' ' : ''
      }${input.lastName || biodata.lastName}`.trim();
    }
    
    // Create update request
    const request = await prisma.request.create({
      data: {
        type: RequestType.ACCOUNT_UPDATE,
        module: RequestModule.ACCOUNT,
        status: RequestStatus.PENDING,
        content: JSON.stringify({ changes: input }),
        biodataId: biodataId,
        initiatorId,
        priority: 'NORMAL',
      },
      include: {
        biodata: true,
      },
    });
    
    return request;
  }
  
  async updateMembershipStatus(biodataId: string, input: IBiodataStatusUpdate, updaterId: string) {
    const { membershipStatus, reason } = input;
    
    const biodata = await prisma.biodata.findUnique({
      where: { id: biodataId },
      include: {
        users: true,
      },
    });
    
    if (!biodata) {
      throw new ApiError('Biodata not found', 404);
    }
    
    // Update status and create notifications
    const updatedBiodata = await prisma.$transaction(async (tx: TransactionClient) => {
      const updated = await tx.biodata.update({
        where: { id: biodataId },
        data: {
          membershipStatus,
        },
      });
      
      // Create notification for updater
      await tx.notification.create({
        data: {
          userId: updaterId,
          type: NotificationType.SYSTEM_ALERT,
          title: 'Membership Status Update',
          message: `Membership status for ${biodata.fullName} updated to ${membershipStatus}`,
          priority: 'HIGH',
        },
      });
      
      // Create notification for member if they have a user account
      if (biodata.users.length > 0) {
        await tx.notification.create({
          data: {
            userId: biodata.users[0].id,
            type: NotificationType.SYSTEM_ALERT,
            title: 'Membership Status Changed',
            message: `Your membership status has been changed to ${membershipStatus}. Reason: ${reason}`,
            priority: 'HIGH',
          },
        });
      }
      
      return updated;
    });
    
    return updatedBiodata;
  }
  
  async addAccountInfo(biodataId: string, input: ICreateAccountInfoInput) {
    const biodata = await prisma.biodata.findUnique({
      where: { id: biodataId },
    });
    
    if (!biodata) {
      throw new ApiError('Biodata not found', 404);
    }
    
    // Check for existing account with same bank
    const existingAccount = await prisma.accountInfo.findFirst({
      where: {
        biodataId,
        bankId: input.bankId,
      },
    });
    
    if (existingAccount) {
      throw new ApiError('Account already exists with this bank', 400);
    }
    
    const accountInfo = await prisma.accountInfo.create({
      data: {
        ...input,
        biodataId,
      },
    });
    
    return accountInfo;
  }
  
  async getBiodata(filters: IBiodataQueryFilters) {
    // Create a copy of the filters to avoid mutating the original
    const where: any = { ...filters };

    // Handle search term
    if (filters.searchTerm) {
      where.OR = [
        { fullName: { contains: filters.searchTerm, mode: 'insensitive' } },
        { firstName: { contains: filters.searchTerm, mode: 'insensitive' } },
        { lastName: { contains: filters.searchTerm, mode: 'insensitive' } },
        { staffNo: { contains: filters.searchTerm } },
        { erpId: { contains: filters.searchTerm } },
        { ippisId: { contains: filters.searchTerm } },
      ];
    }

    // Handle date range filter on createdAt
    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      };
    }

    // Make sure to COMPLETELY remove searchTerm, startDate, endDate from where object
    delete where.searchTerm;
    delete where.startDate;
    delete where.endDate;

    // Remove any undefined fields to avoid Prisma errors
    Object.keys(where).forEach(key => {
      if (where[key] === undefined || where[key] === '') {
        delete where[key];
      }
    });
    
    const biodata = await prisma.biodata.findMany({
      where,
      include: {
        accountInfo: {
          include: {
            bank: true,
          },
        },
        users: {
          select: {
            id: true,
            username: true,
            isActive: true,
            isMember: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return biodata;
  }
  
  async getBiodataById(id: string): Promise<IBiodata> {
    const biodata = await prisma.biodata.findUnique({
      where: { id },
      include: {
        accountInfo: {
          include: {
            bank: true,
          },
        },
        users: {
          select: {
            id: true,
            username: true,
            isActive: true,
            isMember: true,
          },
        },
      },
    });
    
    if (!biodata) {
      throw new ApiError('Biodata not found', 404);
    }
    
    // Convert null values to undefined to match IBiodata interface
    const formattedBiodata = {
      ...biodata,
      middleName: biodata.middleName || undefined
    } as IBiodata;
    
    return formattedBiodata;
  }
  
  async deleteBiodata(id: string) {
    const biodata = await prisma.biodata.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });
    
    if (!biodata) {
      throw new ApiError('Biodata not found', 404);
    }
    
    // Soft delete biodata and associated records
    const deletedBiodata = await prisma.$transaction(async (tx: TransactionClient) => {
      // Soft delete biodata
      const updated = await tx.biodata.update({
        where: { id },
        data: {
          isDeleted: true,
          membershipStatus: MembershipStatus.TERMINATED,
        },
      });
      
      // Deactivate associated user accounts
      if (biodata.users.length > 0) {
        await tx.user.updateMany({
          where: {
            id: {
              in: biodata.users.map(u => u.id),
            },
          },
          data: {
            isActive: false,
          },
        });
      }
      
      return updated;
    });
    
    return deletedBiodata;
  }
  
  async getUnapprovedBiodata(filters: {
    page?: number;
    limit?: number;
    department?: string;
    searchTerm?: string;
  }) {
    const { page = 1, limit = 10, department, searchTerm } = filters;
    
    const where: Prisma.BiodataWhereInput = {
      isApproved: false,
      isDeleted: false,
    };
    
    if (department) {
      where.department = department;
    }
    
    if (searchTerm) {
      where.OR = [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { staffNo: { contains: searchTerm } },
        { erpId: { contains: searchTerm } },
        { ippisId: { contains: searchTerm } },
      ];
    }
    
    const [biodata, total] = await Promise.all([
      prisma.biodata.findMany({
        where: {
          ...where,
          membershipStatus: MembershipStatus.PENDING,
        },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.biodata.count({ where }),
    ]);
    
    return {
      data: biodata,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
  
  async approveBiodataRequest(input: IApproveBiodataRequestInput, approverId: string, approverLevel: number) {
    const { requestId, approverNotes } = input;
    
    // Find request and associated biodata
    const request = await prisma.request.findUnique({
      where: { 
        id: requestId,
        type: RequestType.ACCOUNT_CREATION,
        status: RequestStatus.PENDING
      },
      include: {
        biodata: {
          include: { users: true }
        }
      }
    });
    
    if (!request) {
      throw new ApiError('Pending approval request not found', 404);
    }
    
    if (!request.biodata) {
      throw new ApiError('Associated biodata not found', 404);
    }
    
    if (request.biodata.isApproved) {
      throw new ApiError('Biodata already approved', 400);
    }
    
    // Verify approval level
    if (approverLevel < 2) {
      throw new ApiError('Insufficient approval level. Requires Treasurer (Level 2) or higher.', 403);
    }
    
    // Process approval in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.APPROVED,
          approverId: approverId,
          notes: approverNotes,
          completedAt: new Date()
        }
      });
      
      // Update biodata status
      const updatedBiodata = await tx.biodata.update({
        where: { id: request.biodata!.id },
        data: {
          isApproved: true,
          membershipStatus: MembershipStatus.ACTIVE
        }
      });
      
      // Create notifications
      await tx.notification.create({
        data: {
          userId: approverId,
          type: NotificationType.REQUEST_UPDATE,
          title: 'Biodata Request Approved',
          message: `Biodata request for ${request.biodata!.fullName} approved`,
          priority: 'NORMAL',
          metadata: { requestId, biodataId: request.biodata!.id }
        }
      });
      
      return { request: updatedRequest, biodata: updatedBiodata };
    });
    
    return result;
  }
  
  // For legacy/seeded biodata without requests
  async approveLegacyBiodata(input: IApproveLegacyBiodataInput, approverId: string, approverLevel: number) {
    const { biodataId, approverNotes } = input;
    
    const biodata = await prisma.biodata.findUnique({
      where: { id: biodataId },
      include: { users: true }
    });
    
    if (!biodata) {
      throw new ApiError('Biodata not found', 404);
    }
    
    if (biodata.isApproved) {
      throw new ApiError('Biodata already approved', 400);
    }
    
    if (approverLevel < 2) {
      throw new ApiError('Insufficient approval level', 403);
    }
    
    const result = await prisma.$transaction(async (tx) => {
      // Create approval request for tracking
      const request = await tx.request.create({
        data: {
          type: RequestType.ACCOUNT_CREATION,
          module: RequestModule.ACCOUNT,
          status: RequestStatus.APPROVED,
          content: { biodataId },
          biodataId: biodata.id,
          initiatorId: approverId,
          approverId: approverId,
          completedAt: new Date(),
          notes: approverNotes,
          priority: 'NORMAL'
        }
      });
      
      // Update biodata
      const updatedBiodata = await tx.biodata.update({
        where: { id: biodataId },
        data: {
          isApproved: true,
          membershipStatus: MembershipStatus.ACTIVE
        }
      });
      
      return { request, biodata: updatedBiodata };
    });
    
    return result;
  }
  
  async updateProfilePhoto(id: string, photoPath: string, updatedBy: string): Promise<IBiodata> {
    const biodata = await prisma.biodata.findUnique({
      where: { id },
      include: {
        users: true
      }
    });
    
    if (!biodata) {
      throw new ApiError('Biodata not found', 404);
    }
    
    // Check if there's an existing photo to delete
    if (biodata.profilePhoto) {
      try {
        const oldPhotoPath = path.join(__dirname, '..', '..', '..', '..', biodata.profilePhoto);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      } catch (error) {
        logger.warn(`Failed to delete old profile photo for user ${id}`, error);
        // Continue with update even if old file deletion fails
      }
    }
    
    // Update the biodata with new photo path
    const updatedBiodata = await prisma.biodata.update({
      where: { id },
      data: {
        profilePhoto: photoPath
      }
    });
    
    // Create notification for the user if they have a user account
    if (biodata.users.length > 0) {
      await prisma.notification.create({
        data: {
          userId: biodata.users[0].id,
          type: NotificationType.ACCOUNT_UPDATE,
          title: 'Profile Photo Updated',
          message: 'Your profile photo has been successfully updated.',
          priority: 'NORMAL'
        }
      });
    }
    
    return updatedBiodata;
  }
}
