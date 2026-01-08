import {
  RequestType,
  RequestModule,
  RequestStatus,
  NotificationType,
  ApprovalStatus,
  MembershipStatus,
  Prisma
} from '@prisma/client';
import {
  IBiodataUploadRequest,
  IBiodataUploadResponse,
  UploadContent
} from '../interfaces/biodata.interface';
import { ApiError } from '../../../utils/apiError';
import { ExcelProcessor } from '../utils/excelProcessor';
import * as XLSX from 'xlsx';
import { prisma } from '../../../utils/prisma';

export class BiodataUploadService {
  private excelProcessor: ExcelProcessor;

  constructor() {
    this.excelProcessor = new ExcelProcessor();
  }

  async uploadBiodata(input: IBiodataUploadRequest, uploaderLevel: number): Promise<IBiodataUploadResponse> {
    try {
      if (uploaderLevel < 1) {
        throw new ApiError('Insufficient privileges. Bulk uploads require Admin (Level 1) or higher approval level.', 403);
      }

      // Process the file first to validate contents
      const fileBuffer = Buffer.from(input.file);
      const workbook = XLSX.read(fileBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const records = XLSX.utils.sheet_to_json(worksheet);

      let validatedRecords = [];
      let failed = 0;
      const errors: Array<{ data: any; errors: string[] }> = [];

      // Validate all records first
      for (const record of records) {
        try {
          const validatedRecord = await this.excelProcessor.validateRecord(record);
          if (validatedRecord) {
            validatedRecords.push(validatedRecord);
          }
        } catch (err) {
          failed++;
          const message = err instanceof Error ? err.message : 'Unknown error';
          errors.push({
            data: record,
            errors: [message]
          });
        }
      }

      // Create bulk upload request
      const uploadRequest = await prisma.$transaction(async (tx) => {
        const content: UploadContent = {
          totalRecords: records.length,
          validRecords: validatedRecords.length,
          failedRecords: failed,
          records: validatedRecords
        };

        // Create the main request
        const request = await tx.request.create({
          data: {
            type: RequestType.BULK_UPLOAD,
            module: RequestModule.ACCOUNT,
            status: RequestStatus.PENDING,
            priority: 'HIGH',
            initiatorId: input.uploaderId,
            content: content as unknown as Prisma.JsonObject,
            metadata: {
              uploadType: 'BIODATA',
              errors: errors
            },
            nextApprovalLevel: 3 // Requires Chairman approval
          }
        });

        // Create approval steps
        await tx.requestApproval.create({
          data: {
            requestId: request.id,
            level: 3,
            approverRole: 'CHAIRMAN',
            status: ApprovalStatus.PENDING
          }
        });

        // Create notification for approvers
        await tx.notification.create({
          data: {
            type: NotificationType.APPROVAL_REQUIRED,
            title: 'Biodata Bulk Upload Approval Required',
            message: `A bulk upload of ${validatedRecords.length} biodata records requires your approval.`,
            priority: 'HIGH',
            requestId: request.id,
            userId: input.uploaderId
          }
        });

        return request;
      });

      return {
        successful: validatedRecords.length,
        failed,
        errors,
        requestId: uploadRequest.id
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ApiError(`Failed to process biodata upload: ${message}`, 500);
    }
  }

  async checkUploadStatus(requestId: string) {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        approvalSteps: true,
        initiator: true
      }
    });

    if (!request) {
      throw new ApiError('Upload request not found', 404);
    }

    const content = request.content as unknown as UploadContent;

    return {
      status: request.status,
      totalRecords: content.totalRecords,
      validRecords: content.validRecords,
      failedRecords: content.failedRecords,
      approvalStatus: request.approvalSteps[0]?.status || 'PENDING',
      createdAt: request.createdAt,
      completedAt: request.completedAt
    };
  }

  async cancelUpload(requestId: string, uploaderId: string) {
    const request = await prisma.request.findUnique({
      where: { 
        id: requestId,
        initiatorId: uploaderId
      }
    });

    if (!request) {
      throw new ApiError('Upload request not found or unauthorized', 404);
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new ApiError('Cannot cancel a request that is not pending', 400);
    }

    await prisma.$transaction(async (tx) => {
      // Update request status
      await tx.request.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.CANCELLED,
          completedAt: new Date()
        }
      });

      // Create notification
      await tx.notification.create({
        data: {
          type: NotificationType.SYSTEM_ALERT,
          title: 'Biodata Upload Cancelled',
          message: 'The biodata upload request has been cancelled.',
          priority: 'NORMAL',
          userId: uploaderId,
          requestId: requestId
        }
      });
    });
  }

  async approvedBiodataUpload(requestId: string, approverId: string): Promise<void> {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        approvalSteps: true
      }
    });

    if (!request || request.type !== RequestType.BULK_UPLOAD) {
      throw new ApiError('Invalid upload request', 404);
    }

    const content = request.content as unknown as UploadContent;
    const records = content.records;

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [] as Array<{ data: any; error: string }>
    };

    await prisma.$transaction(async (tx) => {
      for (const record of records) {
        try {
          // Check for existing record using unique identifiers
          const existingBiodata = await tx.biodata.findFirst({
            where: {
              OR: [
                { erpId: record.erpId },
                { ippisId: record.ippisId },
                { 
                  AND: [
                    { firstName: record.firstName },
                    { lastName: record.lastName },
                    { staffNo: record.staffNo }
                  ]
                }
              ]
            }
          });

          if (existingBiodata) {
            // Compare records to check if update is needed
            const hasChanges = this.compareRecords(existingBiodata, record);

            if (hasChanges) {
              // Update existing record
              const updated = await tx.biodata.update({
                where: { id: existingBiodata.id },
                data: {
                  ...record,
                  isVerified: existingBiodata.isVerified,
                  isApproved: true,
                  membershipStatus: existingBiodata.membershipStatus,
                  updatedAt: new Date()
                }
              });

              await tx.notification.create({
                data: {
                  type: NotificationType.SYSTEM_ALERT,
                  title: 'Biodata Updated',
                  message: `Biodata updated for ${updated.fullName} through bulk upload`,
                  priority: 'NORMAL',
                  userId: approverId
                }
              });

              results.updated++;
            } else {
              results.skipped++;
            }
          } else {
            // Create new record
            const biodata = await tx.biodata.create({
              data: {
                ...record,
                isVerified: false,
                isApproved: true,
                membershipStatus: MembershipStatus.ACTIVE
              }
            });

            await tx.notification.create({
              data: {
                type: NotificationType.SYSTEM_ALERT,
                title: 'Biodata Created',
                message: `Biodata created for ${biodata.fullName} through bulk upload`,
                priority: 'NORMAL',
                userId: approverId
              }
            });

            results.created++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            data: record,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          console.error('Error processing biodata:', error);
        }
      }

      // Update request status with results
      await tx.request.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.COMPLETED,
          completedAt: new Date(),
          metadata: {
            ...(request.metadata as object),
            processingResults: results
          }
        }
      });
    });

    return;
  }

  private compareRecords(existing: any, newRecord: any): boolean {
    const compareFields = [
      'firstName',
      'middleName',
      'lastName',
      'dateOfEmployment',
      'department',
      'residentialAddress',
      'emailAddress',
      'phoneNumber',
      'nextOfKin',
      'relationshipOfNextOfKin',
      'nextOfKinPhoneNumber',
      'nextOfKinEmailAddress'
    ];

    return compareFields.some(field => {
      const existingValue = existing[field]?.toString();
      const newValue = newRecord[field]?.toString();
      return existingValue !== newValue;
    });
  }

  async rejectBiodataUpload(requestId: string, approverId: string, reason: string): Promise<void> {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        initiator: true
      }
    });

    if (!request || request.type !== RequestType.BULK_UPLOAD) {
      throw new ApiError('Invalid upload request', 404);
    }

    await prisma.$transaction(async (tx) => {
      // Update request status
      await tx.request.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.REJECTED,
          completedAt: new Date()
        }
      });

      // Update approval step
      await tx.requestApproval.updateMany({
        where: { 
          requestId: requestId,
          status: ApprovalStatus.PENDING 
        },
        data: {
          status: ApprovalStatus.REJECTED,
          approverId: approverId,
          notes: reason,
          approvedAt: new Date()
        }
      });

      // Create notification for initiator
      await tx.notification.create({
        data: {
          type: NotificationType.SYSTEM_ALERT,
          title: 'Biodata Upload Rejected',
          message: `Your biodata upload request has been rejected. Reason: ${reason}`,
          priority: 'HIGH',
          userId: request.initiatorId,
          requestId: requestId
        }
      });
    });
  }

  async getUploadRequests(params: {
    status?: string;
    page?: number;
    limit?: number;
    approverLevel?: number;
  }) {
    const { status, page = 1, limit = 10, approverLevel } = params;
    
    const where: Prisma.RequestWhereInput = {
      type: RequestType.BULK_UPLOAD,
      module: RequestModule.ACCOUNT
    };

    if (status) {
      where.status = status as RequestStatus;
    }

    if (approverLevel) {
      where.nextApprovalLevel = approverLevel;
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
          }
        },
        approvalSteps: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.request.count({ where });

    return {
      requests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUploadRequestDetails(requestId: string) {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
          }
        },
        approvalSteps: {
          include: {
            approver: {
              select: {
                id: true,
                username: true,
              }
            }
          }
        }
      }
    });

    if (!request || request.type !== RequestType.BULK_UPLOAD) {
      throw new ApiError('Upload request not found', 404);
    }

    return request;
  }
}