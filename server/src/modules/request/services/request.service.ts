import {
    RequestType,
    RequestStatus,
    RequestModule,
    ApprovalStatus
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../../../utils/apiError';
import { RequestError, RequestErrorCodes } from '../errors/request.error';
import {
    IRequestQueryParams,
    IPaginatedRequestResponse,
    ICreateRequestInput,
    IUpdateRequestStatusInput,
    IRequest,
    IRequestStatistics
} from '../interfaces/request.interface';
import logger from '../../../utils/logger';
import { formatCurrency } from '../../../utils/formatters';
import { prisma } from '../../../utils/prisma';

class RequestService {
    /**
     * Create a new request with approval workflow
     */
    async createRequest(data: ICreateRequestInput): Promise<IRequest> {
        try {
            // Define approval steps based on request type
            const approvalSteps = this.getApprovalStepsForRequestType(data.type);
            
            // Create request in a transaction to ensure all related entities are created
            const request = await prisma.$transaction(async (tx) => {
                const createdRequest = await tx.request.create({
                    data: {
                        id: uuidv4(),
                        type: data.type,
                        module: data.module,
                        status: RequestStatus.PENDING,
                        biodataId: data.biodataId,
                        savingsId: data.savingsId,
                        loanId: data.loanId,
                        personalSavingsId: data.personalSavingsId, // Add this line
                        initiatorId: data.userId,
                        nextApprovalLevel: 1,
                        content: data.content,
                        metadata: data.metadata || {},
                        notes: data.notes,
                        approvalSteps: {
                            create: approvalSteps
                        }
                    },
                    include: {
                        approvalSteps: true,
                        biodata: {
                            select: {
                                id: true,
                                fullName: true,
                                department: true,
                                erpId: true,
                                emailAddress: true,
                                phoneNumber: true
                            }
                        },
                        initiator: {
                            select: {
                                id: true,
                                username: true,
                                biodata: {
                                    select: {
                                        firstName: true
                                    }
                                }
                            }
                        }
                    }
                });

                // Create a notification for the requester
                await tx.notification.create({
                    data: {
                        userId: data.userId,
                        type: 'REQUEST_UPDATE',
                        title: 'Request Submitted',
                        message: `Your ${this.formatRequestType(data.type)} request has been submitted and is pending review.`,
                        requestId: createdRequest.id,
                        metadata: {
                            requestId: createdRequest.id,
                            status: 'PENDING',
                            type: data.type
                        }
                    }
                });
                
                // Create notifications for users with the appropriate role for first approval step
                const firstApprovalRole = approvalSteps[0].approverRole;
                const usersWithRole = await tx.userRole.findMany({
                    where: {
                        role: {
                            name: firstApprovalRole
                        },
                        isActive: true
                    },
                    select: {
                        userId: true
                    }
                });
                
                // Notify users with the appropriate role
                for (const userRole of usersWithRole) {
                    await tx.notification.create({
                        data: {
                            userId: userRole.userId,
                            type: 'APPROVAL_REQUIRED',
                            title: 'New Request Requires Review',
                            message: `A new ${this.formatRequestType(data.type)} request requires your review.`,
                            requestId: createdRequest.id,
                            metadata: {
                                requestId: createdRequest.id,
                                status: 'PENDING',
                                type: data.type,
                                level: 1,
                                role: firstApprovalRole
                            }
                        }
                    });
                }
                
                return createdRequest;
            });

            return this.formatRequestResponse(request);
        } catch (error) {
            logger.error('Error creating request:', error);
            if (error instanceof RequestError) {
                throw error;
            }
            throw new RequestError(
                RequestErrorCodes.REQUEST_CREATION_FAILED,
                'Failed to create request',
                500
            );
        }
    }

    /**
     * Get all requests with filtering and pagination
     */
    async getAllRequests(params: IRequestQueryParams): Promise<IPaginatedRequestResponse> {
        try {
            const { 
                type,
                status,
                biodataId,
                assignedTo,
                startDate,
                endDate,
                page = 1,
                limit = 10,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = params;

            // Build where conditions
            const whereConditions: any = {};

            // Filter by type
            if (type) {
                whereConditions.type = type;
            }

            // Filter by status
            if (status) {
                whereConditions.status = status;
            }

            // Filter by biodataId (member)
            if (biodataId) {
                whereConditions.biodataId = biodataId;
            }

            // Filter by assignedTo (based on approval steps)
            if (assignedTo) {
                whereConditions.approvalSteps = {
                    some: {
                        approverId: assignedTo
                    }
                };
            }

            // Filter by date range
            if (startDate || endDate) {
                whereConditions.createdAt = {};
                
                if (startDate) {
                    whereConditions.createdAt.gte = startDate;
                }
                
                if (endDate) {
                    whereConditions.createdAt.lte = endDate;
                }
            }

            // Set up sorting
            const orderBy: any = {};
            orderBy[sortBy] = sortOrder;

            // Execute queries in parallel for better performance
            const [total, requests] = await Promise.all([
                prisma.request.count({ where: whereConditions }),
                prisma.request.findMany({
                    where: whereConditions,
                    include: {
                        biodata: {
                            select: {
                                id: true,
                                fullName: true,
                                department: true,
                                erpId: true,
                                emailAddress: true,
                                phoneNumber: true
                            }
                        },
                        approvalSteps: {
                            orderBy: {
                                level: 'asc'
                            },
                            include: {
                                approver: {
                                    select: {
                                        id: true,
                                        username: true,
                                        adminProfile: {
                                            select: {
                                                firstName: true,
                                                lastName: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        initiator: {
                            select: {
                                id: true,
                                username: true,
                                biodata: {
                                    select: {
                                        firstName: true
                                    }
                                },
                                adminProfile: {
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
                                adminProfile: {
                                    select: {
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy,
                    skip: (page - 1) * limit,
                    take: limit
                })
            ]);

            // Format the response
            const formattedRequests = requests.map(request => this.formatRequestResponse(request));

            return {
                data: formattedRequests,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error fetching requests:', error);
            throw new RequestError(
                RequestErrorCodes.FETCH_ERROR,
                'Failed to fetch requests',
                500
            );
        }
    }

    /**
     * Get requests initiated by a specific user
     */
    async getUserRequests(userId: string, params: IRequestQueryParams): Promise<IPaginatedRequestResponse> {
        try {
            // Ensure we filter by the initiator
            return this.getAllRequests({
                ...params,
                initiatorId: userId
            });
        } catch (error) {
            logger.error('Error fetching user requests:', error);
            throw new RequestError(
                RequestErrorCodes.FETCH_ERROR,
                'Failed to fetch user requests',
                500
            );
        }
    }

    /**
     * Get a single request by ID
     */
    async getRequestById(requestId: string): Promise<IRequest> {
        try {
            const request = await prisma.request.findUnique({
                where: { id: requestId },
                include: {
                    biodata: {
                        select: {
                            id: true,
                            fullName: true,
                            department: true,
                            erpId: true,
                            emailAddress: true,
                            phoneNumber: true
                        }
                    },
                    approvalSteps: {
                        orderBy: {
                            level: 'asc'
                        },
                        include: {
                            approver: {
                                select: {
                                    id: true,
                                    username: true,
                                    adminProfile: {
                                        select: {
                                            firstName: true,
                                            lastName: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    initiator: {
                        select: {
                            id: true,
                            username: true,
                            biodata: {
                                select: {
                                    firstName: true
                                }
                            },
                            adminProfile: {
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
                            adminProfile: {
                                select: {
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
                    }
                }
            });

            if (!request) {
                throw new RequestError(
                    RequestErrorCodes.REQUEST_NOT_FOUND,
                    'Request not found',
                    404
                );
            }

            return this.formatRequestResponse(request);
        } catch (error) {
            logger.error('Error fetching request details:', error);
            if (error instanceof RequestError) {
                throw error;
            }
            throw new RequestError(
                RequestErrorCodes.FETCH_ERROR,
                'Failed to fetch request details',
                500
            );
        }
    }

    /**
     * Update request status with validation and notifications
     */
    async updateRequestStatus(data: IUpdateRequestStatusInput): Promise<IRequest> {
        try {
            // First get the request to validate status transition
            const request = await prisma.request.findUnique({
                where: { id: data.requestId },
                include: {
                    approvalSteps: {
                        orderBy: { level: 'asc' }
                    },
                    biodata: true,
                    initiator: true
                }
            });

            if (!request) {
                throw new RequestError(
                    RequestErrorCodes.REQUEST_NOT_FOUND,
                    'Request not found',
                    404
                );
            }

            // Validate the status transition
            const validTransitions = this.getValidStatusTransitions(request.status);
            if (!validTransitions.includes(data.status)) {
                throw new RequestError(
                    RequestErrorCodes.INVALID_STATUS_TRANSITION,
                    `Invalid status transition from ${request.status} to ${data.status}`,
                    400
                );
            }

            // Update the request in a transaction with increased timeout
            const updatedRequest = await prisma.$transaction(async (tx) => {
                // Update approval steps based on the new status
                const currentApprovalLevel = request.nextApprovalLevel;
                const currentStep = request.approvalSteps.find(
                    step => step.level === currentApprovalLevel
                );

                if (currentStep) {
                    // Update the current step
                    await tx.requestApproval.update({
                        where: { id: currentStep.id },
                        data: {
                            status: this.mapRequestStatusToApprovalStatus(data.status),
                            approverId: data.updatedBy,
                            approvedAt: new Date(),
                            notes: data.notes
                        }
                    });
                }

                // Determine the next approval level and updated status
                let nextLevel = currentApprovalLevel;
                let updatedStatus = data.status;
                let completedAt = null;

                if (data.status === RequestStatus.REJECTED || data.status === RequestStatus.CANCELLED) {
                    // If rejected or cancelled, no further approval needed
                    completedAt = new Date();
                } else if (data.status === RequestStatus.APPROVED || 
                           data.status === RequestStatus.REVIEWED || 
                           data.status === RequestStatus.IN_REVIEW) {
                    // Move to the next approval level
                    const maxLevel = Math.max(...request.approvalSteps.map(s => s.level));
                    if (currentApprovalLevel < maxLevel) {
                        nextLevel = currentApprovalLevel + 1;
                    } else if (data.status === RequestStatus.APPROVED) {
                        // If this was the last approval step and status is APPROVED, mark as completed
                        completedAt = new Date();
                    }
                } else if (data.status === RequestStatus.COMPLETED) {
                    // Mark as completed
                    completedAt = new Date();
                }

                // Update the request
                const updated = await tx.request.update({
                    where: { id: data.requestId },
                    data: {
                        status: updatedStatus,
                        nextApprovalLevel: nextLevel,
                        approverId: data.updatedBy,
                        completedAt,
                        notes: data.notes,
                        updatedAt: new Date()
                    },
                    include: {
                        biodata: {
                            select: {
                                id: true,
                                fullName: true,
                                department: true,
                                erpId: true,
                                emailAddress: true,
                                phoneNumber: true
                            }
                        },
                        approvalSteps: {
                            orderBy: {
                                level: 'asc'
                            },
                            include: {
                                approver: {
                                    select: {
                                        id: true,
                                        username: true,
                                        adminProfile: {
                                            select: {
                                                firstName: true,
                                                lastName: true
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        initiator: {
                            select: {
                                id: true,
                                username: true,
                                biodata: {
                                    select: {
                                        firstName: true
                                    }
                                },
                                adminProfile: {
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
                                adminProfile: {
                                    select: {
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        }
                    }
                });

                // Handle specific status transitions
                switch (data.status) {
                    case RequestStatus.IN_REVIEW:
                        await this.handleInReviewTransition(tx, request, data);
                        break;
                    case RequestStatus.REVIEWED:
                        await this.handleReviewedTransition(tx, request, data);
                        break;
                    case RequestStatus.APPROVED:
                        await this.handleApprovalTransition(tx, request, data);
                        break;
                    case RequestStatus.COMPLETED:
                        await this.handleCompletionTransition(tx, request, data);
                        break;
                    case RequestStatus.REJECTED:
                        await this.handleRejectionTransition(tx, request, data);
                        break;
                    case RequestStatus.CANCELLED:
                        await this.handleCancellationTransition(tx, request, data);
                        break;
                }

                // Create a notification for the requester
                await tx.notification.create({
                    data: {
                        userId: request.initiatorId,
                        type: 'REQUEST_UPDATE',
                        title: `Request ${this.formatStatusForNotification(data.status)}`,
                        message: `Your ${this.formatRequestType(request.type)} request has been ${this.formatStatusForNotification(data.status).toLowerCase()}.`,
                        requestId: request.id,
                        metadata: {
                            requestId: request.id,
                            status: data.status,
                            type: request.type
                        }
                    }
                });

                // If there's a next approval level, notify the next approvers
                if (nextLevel > currentApprovalLevel) {
                    const nextStep = request.approvalSteps.find(
                        step => step.level === nextLevel
                    );

                    if (nextStep) {
                        const usersWithRole = await tx.userRole.findMany({
                            where: {
                                role: {
                                    name: nextStep.approverRole
                                },
                                isActive: true
                            },
                            select: {
                                userId: true
                            }
                        });
                        
                        // Notify users with the appropriate role
                        for (const userRole of usersWithRole) {
                            await tx.notification.create({
                                data: {
                                    userId: userRole.userId,
                                    type: 'REQUEST_UPDATE',
                                    title: 'Request Requires Your Review',
                                    message: `A ${this.formatRequestType(request.type)} request requires your review.`,
                                    requestId: request.id,
                                    metadata: {
                                        requestId: request.id,
                                        status: updatedStatus,
                                        type: request.type,
                                        level: nextLevel,
                                        role: nextStep.approverRole
                                    }
                                }
                            });
                        }
                    }
                }

                return updated;
            }, {
                timeout: 15000 // Increase timeout to 15 seconds
            });

            return this.formatRequestResponse(updatedRequest);
        } catch (error) {
            logger.error('Error updating request status:', error);
            if (error instanceof RequestError) {
                throw error;
            }
            throw new RequestError(
                RequestErrorCodes.FETCH_ERROR,
                'Failed to update request status',
                500
            );
        }
    }

    /**
     * Delete a request (cancel it)
     */
    async deleteRequest(id: string, userId: string): Promise<void> {
        try {
            const request = await prisma.request.findUnique({
                where: { id }
            });

            if (!request) {
                throw new RequestError(
                    RequestErrorCodes.REQUEST_NOT_FOUND,
                    'Request not found',
                    404
                );
            }

            // Only allow deletion if the request is in PENDING status and initiated by the user
            if (request.status !== RequestStatus.PENDING) {
                throw new RequestError(
                    RequestErrorCodes.INVALID_STATUS_TRANSITION,
                    'Only pending requests can be deleted',
                    400
                );
            }

            if (request.initiatorId !== userId) {
                throw new RequestError(
                    RequestErrorCodes.UNAUTHORIZED_ACTION,
                    'You can only delete your own requests',
                    403
                );
            }

            // Delete the request
            await prisma.request.update({
                where: { id },
                data: {
                    status: RequestStatus.CANCELLED,
                    notes: 'Request cancelled by user',
                    completedAt: new Date()
                }
            });
        } catch (error) {
            logger.error('Error deleting request:', error);
            if (error instanceof RequestError) {
                throw error;
            }
            throw new RequestError(
                RequestErrorCodes.FETCH_ERROR,
                'Failed to delete request',
                500
            );
        }
    }

    /**
     * Get the count of pending requests
     */
    async getPendingRequestCount(userId?: string, role?: string): Promise<number> {
        try {
            const whereConditions: any = {
                status: {
                    in: [RequestStatus.PENDING, RequestStatus.IN_REVIEW]
                }
            };

            // If userId is provided, filter by requests assigned to this user
            if (userId) {
                // For regular users, show their own requests
                whereConditions.initiatorId = userId;
            }

            // If role is provided, filter by requests that can be approved by this role
            if (role) {
                whereConditions.approvalSteps = {
                    some: {
                        approverRole: role,
                        status: ApprovalStatus.PENDING
                    }
                };
            }

            const count = await prisma.request.count({
                where: whereConditions
            });

            return count;
        } catch (error) {
            logger.error('Error fetching pending request count:', error);
            throw new RequestError(
                RequestErrorCodes.FETCH_ERROR,
                'Failed to fetch pending request count',
                500
            );
        }
    }

    /**
     * Get request statistics
     */
    async getRequestStatistics(filters: {
        startDate?: Date;
        endDate?: Date;
        biodataId?: string;
    }): Promise<IRequestStatistics> {
        try {
            const whereConditions: any = {};
            
            if (filters.startDate || filters.endDate) {
                whereConditions.createdAt = {};
                
                if (filters.startDate) {
                    whereConditions.createdAt.gte = filters.startDate;
                }
                
                if (filters.endDate) {
                    whereConditions.createdAt.lte = filters.endDate;
                }
            }
            
            if (filters.biodataId) {
                whereConditions.biodataId = filters.biodataId;
            }
            
            // Get counts for different request statuses and types
            const [
                total,
                pending,
                approved,
                rejected,
                cancelled,
                loanRequests,
                systemRequests,
                biodataRequests,
                accountRequests,
                savingsRequests,
            ] = await Promise.all([
                // Total requests
                prisma.request.count({
                    where: whereConditions
                }),
                // Pending requests
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        status: { in: [RequestStatus.PENDING, RequestStatus.IN_REVIEW] }
                    }
                }),
                // Approved & completed requests
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        status: { in: [RequestStatus.APPROVED, RequestStatus.COMPLETED] }
                    }
                }),
                // Rejected requests
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        status: RequestStatus.REJECTED
                    }
                }),
                // Cancelled requests
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        status: RequestStatus.CANCELLED
                    }
                }),
                // Loan requests
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        type: RequestType.LOAN_APPLICATION
                    }
                }),
                // Biodata requests
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        type: RequestType.BIODATA_UPDATE
                    }
                }),
                // Account update requests
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        type: RequestType.ACCOUNT_UPDATE
                    }
                }),
                // Savings withdrawal requests
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        type: RequestType.SAVINGS_WITHDRAWAL
                    }
                }),
                // Shares withdrawal requests
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        type: RequestType.ACCOUNT_CLOSURE
                    }
                }),
                // Personal savings creation request
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        type: RequestType.PERSONAL_SAVINGS_CREATION
                    }
                }),
                // Personal savings withdrawal request
                prisma.request.count({
                    where: {
                        ...whereConditions,
                        type: RequestType.PERSONAL_SAVINGS_WITHDRAWAL
                    }
                }),
            ]);
            
            return {
                total,
                pending,
                approved,
                rejected,
                cancelled,
                byType: {
                    [RequestType.LOAN_APPLICATION]: loanRequests,
                    [RequestType.ACCOUNT_CREATION]: accountRequests,
                    [RequestType.ACCOUNT_CLOSURE]: accountRequests,
                    [RequestType.ACCOUNT_UPDATE]: accountRequests,
                    [RequestType.ACCOUNT_VERIFICATION]: accountRequests,
                    [RequestType.SAVINGS_WITHDRAWAL]: savingsRequests,
                    [RequestType.BIODATA_UPDATE]: biodataRequests,
                    [RequestType.LOAN_DISBURSEMENT]: loanRequests,
                    [RequestType.BULK_UPLOAD]: 0,
                    [RequestType.SYSTEM_ADJUSTMENT]: systemRequests,
                    [RequestType.PERSONAL_SAVINGS_CREATION]: savingsRequests,
                    [RequestType.PERSONAL_SAVINGS_WITHDRAWAL]: savingsRequests
                }
            };
        } catch (error) {
            logger.error('Error fetching request statistics:', error);
            throw new RequestError(
                RequestErrorCodes.FETCH_ERROR,
                'Failed to fetch request statistics',
                500
            );
        }
    }

    /* Helper methods for request processing */

    /**
     * Helper method to get approval steps based on request type
     */
    private getApprovalStepsForRequestType(requestType: RequestType): Array<{
        level: number;
        status: ApprovalStatus;
        approverRole: string;
        notes: string;
    }> {
        switch (requestType) {
            case RequestType.LOAN_APPLICATION:
                return [
                    {
                        level: 1,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'ADMIN',
                        notes: 'Initial loan application review'
                    },
                    {
                        level: 2,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'TREASURER',
                        notes: 'Financial verification and review'
                    },
                    {
                        level: 3,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'CHAIRMAN',
                        notes: 'Final loan approval'
                    },
                    {
                        level: 4,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'TREASURER',
                        notes: 'Loan disbursement processing'
                    }
                ];
            case RequestType.BIODATA_UPDATE:
                return [
                    {
                        level: 1,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'ADMIN',
                        notes: 'Initial biodata verification'
                    },
                    {
                        level: 2,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'CHAIRMAN',
                        notes: 'Final biodata approval'
                    }
                ];
            case RequestType.ACCOUNT_UPDATE:
                return [
                    {
                        level: 1,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'ADMIN',
                        notes: 'Account update verification'
                    }
                ];
            case RequestType.SAVINGS_WITHDRAWAL:
                return [
                    {
                        level: 1,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'ADMIN',
                        notes: 'Initial withdrawal request review'
                    },
                    {
                        level: 2,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'TREASURER',
                        notes: 'Financial verification'
                    },
                    {
                        level: 3,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'CHAIRMAN',
                        notes: 'Final withdrawal approval'
                    },
                    {
                        level: 4,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'TREASURER',
                        notes: 'Withdrawal processing'
                    }
                ];
            case RequestType.ACCOUNT_CLOSURE:
                return [
                    {
                        level: 1,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'ADMIN',
                        notes: 'Initial savings and share withdrawal review'
                    },
                    {
                        level: 2,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'TREASURER',
                        notes: 'Financial verification'
                    },
                    {
                        level: 3,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'CHAIRMAN',
                        notes: 'Final share withdrawal approval'
                    },
                    {
                        level: 4,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'TREASURER',
                        notes: 'Account closure processing'
                    }
                ];
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
            default:
                return [
                    {
                        level: 1,
                        status: ApprovalStatus.PENDING,
                        approverRole: 'ADMIN',
                        notes: 'Request review'
                    }
                ];
        }
    }

    /**
     * Get valid status transitions based on current status
     */
    private getValidStatusTransitions(currentStatus: RequestStatus): RequestStatus[] {
        const transitions: Record<RequestStatus, RequestStatus[]> = {
            [RequestStatus.PENDING]: [
                RequestStatus.IN_REVIEW, 
                RequestStatus.REJECTED,
                RequestStatus.REVIEWED,
                RequestStatus.CANCELLED
            ],
            [RequestStatus.IN_REVIEW]: [
                RequestStatus.REVIEWED, 
                RequestStatus.REJECTED, 
                RequestStatus.CANCELLED
            ],
            [RequestStatus.REVIEWED]: [
                RequestStatus.APPROVED, 
                RequestStatus.REJECTED, 
                RequestStatus.CANCELLED
            ],
            [RequestStatus.APPROVED]: [
                RequestStatus.COMPLETED, 
                RequestStatus.REJECTED, 
                RequestStatus.CANCELLED
            ],
            [RequestStatus.REJECTED]: [],
            [RequestStatus.COMPLETED]: [],
            [RequestStatus.CANCELLED]: []
        };

        return transitions[currentStatus] || [];
    }

    /**
     * Map request status to approval status
     */
    private mapRequestStatusToApprovalStatus(requestStatus: RequestStatus): ApprovalStatus {
        switch (requestStatus) {
            case RequestStatus.APPROVED:
            case RequestStatus.REVIEWED:
            case RequestStatus.IN_REVIEW:
            case RequestStatus.COMPLETED:
                return ApprovalStatus.APPROVED;
            case RequestStatus.REJECTED:
                return ApprovalStatus.REJECTED;
            case RequestStatus.CANCELLED:
                return ApprovalStatus.REJECTED;
            default:
                return ApprovalStatus.PENDING;
        }
    }

    /**
     * Format request type for user-facing messages
     */
    private formatRequestType(type: RequestType): string {
        switch (type) {
            case RequestType.LOAN_APPLICATION:
                return 'Loan Application';
            case RequestType.BIODATA_UPDATE:
                return 'Biodata Approval';
            case RequestType.ACCOUNT_UPDATE:
                return 'Account Update';
            case RequestType.SAVINGS_WITHDRAWAL:
                return 'Savings Withdrawal';
            case RequestType.ACCOUNT_CREATION:
                return 'Account Creation';
            case RequestType.ACCOUNT_CLOSURE:
                return 'Account Closure';
            case RequestType.LOAN_DISBURSEMENT:
                return 'Loan Disbursement';
            case RequestType.BULK_UPLOAD:
                return 'Bulk Upload';
            case RequestType.SYSTEM_ADJUSTMENT:
                return 'System Adjustment';
            case RequestType.ACCOUNT_VERIFICATION:
                return 'Account Verification';
            case RequestType.PERSONAL_SAVINGS_CREATION:
                return 'Personal Savings Creation';
            case RequestType.PERSONAL_SAVINGS_WITHDRAWAL:
                return 'Personal Savings Withdrawal';
            default:
                return 'Request';
        }
    }

    /**
     * Format status for notification messages
     */
    private formatStatusForNotification(status: RequestStatus): string {
        switch (status) {
            case RequestStatus.IN_REVIEW:
                return 'In Review';
            case RequestStatus.REVIEWED:
                return 'Reviewed';
            case RequestStatus.APPROVED:
                return 'Approved';
            case RequestStatus.REJECTED:
                return 'Rejected';
            case RequestStatus.COMPLETED:
                return 'Completed';
            case RequestStatus.CANCELLED:
                return 'Cancelled';
            default:
                return 'Updated';
        }
    }

    /**
     * Format request response for consistent API output
     */
    private formatRequestResponse(request: any): IRequest {
        const content = request.content || {};
        const metadata = request.metadata || {};
        
        return {
            id: request.id,
            type: request.type,
            module: request.module,
            status: request.status,
            biodataId: request.biodataId,
            savingsId: request.savingsId,
            loanId: request.loanId,
            sharesId: request.sharesId,
            personalSavingsId: request.personalSavingsId, // Add this line
            initiatorId: request.initiatorId,
            approverId: request.approverId,
            content,
            metadata,
            nextApprovalLevel: request.nextApprovalLevel,
            notes: request.notes,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            completedAt: request.completedAt,
            biodata: request.biodata ? {
                id: request.biodata.id,
                fullName: request.biodata.fullName,
                department: request.biodata.department,
                erpId: request.biodata.erpId,
                emailAddress: request.biodata.emailAddress,
                phoneNumber: request.biodata.phoneNumber
            } : undefined,
            initiator: request.initiator ? {
                id: request.initiator.id,
                username: request.initiator.username,
                firstName: request.initiator.biodata?.firstName || request.initiator.adminProfile?.firstName
            } : undefined,
            approver: request.approver ? {
                id: request.approver.id,
                username: request.approver.username,
                firstName: request.approver.adminProfile?.firstName
            } : undefined,
            approvalSteps: request.approvalSteps ? request.approvalSteps.map((step: any) => ({
                id: step.id,
                requestId: step.requestId,
                level: step.level,
                status: step.status,
                approverRole: step.approverRole,
                approverId: step.approverId,
                approvedAt: step.approvedAt,
                notes: step.notes,
                approver: step.approver ? {
                    id: step.approver.id,
                    username: step.approver.username,
                    firstName: step.approver.adminProfile?.firstName
                } : undefined
            })) : undefined
        };
    }

    /**
     * Handle transition to IN_REVIEW status
     */
    private async handleInReviewTransition(
        tx: any,
        request: any,
        data: IUpdateRequestStatusInput
    ) {
        // Find the next approval step (usually treasurer)
        const nextStep = request.approvalSteps.find(
            (step: any) => step.level === 2
        );

        if (nextStep) {
            // Notify the member
            await tx.notification.create({
                data: {
                    userId: request.initiatorId,
                    type: 'REQUEST_UPDATE',
                    title: 'Request In Review',
                    message: `Your ${this.formatRequestType(request.type)} request is now being reviewed.`,
                    requestId: request.id,
                    metadata: {
                        status: 'IN_REVIEW',
                        nextApprovalLevel: 2,
                        nextApprovalRole: nextStep.approverRole
                    }
                }
            });
        }
    }

    /**
     * Handle transition to REVIEWED status
     */
    private async handleReviewedTransition(
        tx: any,
        request: any,
        data: IUpdateRequestStatusInput
    ) {
        // Find the next approval step (usually chairman)
        const nextStep = request.approvalSteps.find(
            (step: any) => step.level === 3
        );

        if (nextStep) {
            // Notify the member
            await tx.notification.create({
                data: {
                    userId: request.initiatorId,
                    type: 'REQUEST_UPDATE',
                    title: 'Request Reviewed',
                    message: `Your ${this.formatRequestType(request.type)} request has been reviewed and is awaiting final approval.`,
                    requestId: request.id,
                    metadata: {
                        status: 'REVIEWED',
                        nextApprovalLevel: 3,
                        nextApprovalRole: nextStep.approverRole
                    }
                }
            });
        }
    }

    /**
     * Handle transition to APPROVED status
     */
    private async handleApprovalTransition(
        tx: any,
        request: any,
        data: IUpdateRequestStatusInput
    ) {
        // Notify the member
        await tx.notification.create({
            data: {
                userId: request.initiatorId,
                type: 'REQUEST_UPDATE',
                title: 'Request Approved',
                message: `Your ${this.formatRequestType(request.type)} request has been approved.`,
                requestId: request.id,
                metadata: {
                    status: 'APPROVED'
                }
            }
        });

        // Special handling based on request type
        switch(request.type) {
            case RequestType.LOAN_APPLICATION:
                // Additional loan-specific handling could go here
                break;
            case RequestType.SAVINGS_WITHDRAWAL:
                // Additional withdrawal-specific handling could go here
                break;
            case RequestType.BIODATA_UPDATE:
                // Update biodata status if this is a biodata approval request
                if (request.biodataId) {
                    await tx.biodata.update({
                        where: { id: request.biodataId },
                        data: {
                            isApproved: true,
                            updatedAt: new Date()
                        }
                    });
                }
                break;
            case RequestType.PERSONAL_SAVINGS_CREATION:
                // Create the personal savings plan when request is approved
                if (request.content && request.biodataId) {
                    // Check if plan already exists to prevent duplicates
                    const existingPlan = await tx.personalSavings.findFirst({
                        where: {
                            erpId: request.content.erpId,
                            planTypeId: request.content.planTypeId,
                            status: 'ACTIVE'
                        }
                    });

                    if (!existingPlan) {
                        const newPlan = await tx.personalSavings.create({
                            data: {
                                erpId: request.content.erpId,
                                planTypeId: request.content.planTypeId,
                                planName: request.content.planName,
                                targetAmount: request.content.targetAmount ? new (await import('@prisma/client/runtime/library')).Decimal(request.content.targetAmount) : null,
                                currentBalance: new (await import('@prisma/client/runtime/library')).Decimal(0),
                                status: 'ACTIVE',
                                memberId: request.biodataId,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            }
                        });

                        // Update the request with the created personal savings ID
                        await tx.request.update({
                            where: { id: request.id },
                            data: {
                                personalSavingsId: newPlan.id
                            }
                        });

                        // Send additional notification about plan creation
                        await tx.notification.create({
                            data: {
                                userId: request.initiatorId,
                                type: 'REQUEST_UPDATE',
                                title: 'Personal Savings Plan Created',
                                message: `Your personal savings plan "${request.content.planName}" has been successfully created and is now active.`,
                                requestId: request.id,
                                metadata: {
                                    personalSavingsId: newPlan.id,
                                    planName: request.content.planName
                                }
                            }
                        });
                    }
                }
                break;
            // Handle other request types as needed
        }
    }

    /**
     * Handle transition to COMPLETED status
     */
    private async handleCompletionTransition(
        tx: any,
        request: any,
        data: IUpdateRequestStatusInput
    ) {
        // Notify the member
        await tx.notification.create({
            data: {
                userId: request.initiatorId,
                type: 'REQUEST_UPDATE',
                title: 'Request Completed',
                message: `Your ${this.formatRequestType(request.type)} request has been completed.`,
                requestId: request.id,
                metadata: {
                    status: 'COMPLETED'
                }
            }
        });

        // Special handling based on request type
        switch(request.type) {
            case RequestType.SAVINGS_WITHDRAWAL:
                // Process the withdrawal transaction
                // This would typically call a transaction service
                break;
            case RequestType.ACCOUNT_CLOSURE:
                // Process the account closure
                break;
            case RequestType.PERSONAL_SAVINGS_WITHDRAWAL:
                // Process the personal savings withdrawal inline to avoid nested transactions
                if (request.content && request.personalSavingsId) {
                    const { amount } = request.content as { amount: number };
                    const planId = request.personalSavingsId;

                    // Get personal savings plan
                    const plan = await tx.personalSavings.findUnique({
                        where: { id: planId },
                    });

                    if (plan) {
                        // Check balance again (could have changed since request was made)
                        if (!plan.currentBalance.lessThan(amount)) {
                            // Calculate new balance
                            const newBalance = plan.currentBalance.sub(new (await import('@prisma/client/runtime/library')).Decimal(amount));

                            // Create transaction record
                            await tx.transaction.create({
                                data: {
                                    transactionType: 'PERSONAL_SAVINGS_WITHDRAWAL',
                                    baseType: 'DEBIT',
                                    module: 'SAVINGS',
                                    amount: new (await import('@prisma/client/runtime/library')).Decimal(amount),
                                    balanceAfter: newBalance,
                                    status: 'COMPLETED',
                                    description: `Withdrawal from personal savings plan: ${plan.planName || 'Unnamed plan'}`,
                                    initiatedBy: data.updatedBy,
                                    approvedBy: data.updatedBy,
                                    personalSavingsId: planId,
                                    requestId: request.id,
                                }
                            });

                            // Update personal savings balance
                            await tx.personalSavings.update({
                                where: { id: planId },
                                data: {
                                    currentBalance: newBalance,
                                    updatedAt: new Date(),
                                }
                            });

                            // Additional success notification
                            await tx.notification.create({
                                data: {
                                    userId: request.initiatorId,
                                    type: 'REQUEST_UPDATE',
                                    title: 'Withdrawal Processed',
                                    message: `Your withdrawal of ₦${amount.toLocaleString()} from personal savings plan: ${plan.planName} has been successfully processed.`,
                                    requestId: request.id,
                                    metadata: {
                                        amount: amount,
                                        newBalance: Number(newBalance)
                                    }
                                }
                            });
                        } else {
                            logger.error('Insufficient balance for withdrawal during completion');
                        }
                    }
                }
                break;
            // Handle other request types as needed
        }
    }

    /**
     * Handle transition to REJECTED status
     */
    private async handleRejectionTransition(
        tx: any,
        request: any,
        data: IUpdateRequestStatusInput
    ) {
        // Notify the member with the rejection reason
        await tx.notification.create({
            data: {
                userId: request.initiatorId,
                type: 'REQUEST_UPDATE',
                title: 'Request Rejected',
                message: `Your ${this.formatRequestType(request.type)} request has been rejected.${data.notes ? ` Reason: ${data.notes}` : ''}`,
                requestId: request.id,
                metadata: {
                    status: 'REJECTED',
                    reason: data.notes
                }
            }
        });
    }

    /**
     * Handle transition to CANCELLED status
     */
    private async handleCancellationTransition(
        tx: any,
        request: any,
        data: IUpdateRequestStatusInput
    ) {
        // Notify the member
        await tx.notification.create({
            data: {
                userId: request.initiatorId,
                type: 'REQUEST_UPDATE',
                title: 'Request Cancelled',
                message: `Your ${this.formatRequestType(request.type)} request has been cancelled.${data.notes ? ` Reason: ${data.notes}` : ''}`,
                requestId: request.id,
                metadata: {
                    status: 'CANCELLED',
                    reason: data.notes
                }
            }
        });
    }
}

export default new RequestService();