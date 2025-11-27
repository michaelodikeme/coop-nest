import { PrismaClient } from "@prisma/client";
import { IAdminProfileInput, ICreateAdminUserInput } from "../interfaces/admin.interface";
import { ApiError } from '../../../utils/apiError';
import { hash, compare } from 'bcrypt';

const prisma = new PrismaClient();

// Type for Prisma transaction
type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class AdminService {
    
    async createAdminUser(input: ICreateAdminUserInput) {
        const { adminProfileId, username, password } = input;
        
        // Check if admin profile exists, is verified and approved
        const adminProfile = await prisma.adminUserProfile.findUnique({
            where: { id: adminProfileId }
        });
        
        if (!adminProfile) {
            throw new ApiError('Admin profile not found', 404);
        }
        
        if (adminProfile.userId) {
            throw new ApiError('Admin profile is already linked to a user account', 400);
        }
        
        if (!adminProfile.isVerified) {
            throw new ApiError('Admin profile is not verified. Please verify first.', 400);
        }
        
        if (!adminProfile.isActive) {
            throw new ApiError('Admin profile is pending approval. Please contact the system administrator.', 403);
        }
        
        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: { username }
        });
        
        if (existingUser) {
            throw new ApiError('Username already taken', 400);
        }
        
        // // Get admin role
        // const adminRole = await prisma.role.findFirst({
        //     where: { name: 'ADMIN' }
        // });
        
        // if (!adminRole) {
        //     throw new ApiError('Admin role not found', 500);
        // }
        
        return await prisma.$transaction(async (tx: PrismaTransaction) => {
            const hashedPassword = await hash(password, 10);
            
            // Get admin role with full details
            const adminRole = await tx.role.findFirst({
                where: { name: 'ADMIN' },
                select: {
                    id: true,
                    permissions: true,
                    approvalLevel: true,
                    moduleAccess: true
                }
            });
            
            if (!adminRole) {
                throw new ApiError('Admin role not found', 500);
            }
            
            // Create user
            const user = await tx.user.create({
                data: {
                    username: input.username,
                    password: hashedPassword,
                    isMember: false,
                    isActive: true,
                    roleAssignment: {
                    create: {
                        roleId: adminRole.id,
                        isActive: true
                    }
                }
                }
            });
            
            // Link admin profile to user
            await tx.adminUserProfile.update({
                where: { id: adminProfileId },
                data: { userId: user.id }
            });
            
            // // Assign admin role
            // await tx.userRole.create({
            //     data: {
            //         userId: user.id,
            //         roleId: adminRole.id,
            //         isActive: true
            //     }
            // });
            
            // Verify role assignment
            await tx.role.update({
                where: { id: adminRole.id },
                data: {
                    permissions: {
                        set: adminRole.permissions
                    }
                }
            });
            
            // Create welcome notification
            await tx.notification.create({
                data: {
                    userId: user.id,
                    type: 'SYSTEM_ALERT',
                    title: 'Welcome Administrator',
                    message: 'Your admin account has been created successfully.',
                    priority: 'HIGH'
                }
            });
            
            return tx.user.findUnique({
                where: { id: user.id },
                include: {
                    roleAssignment: {
                        include: { role: true }
                    },
                    adminProfile: true
                }
            });
        });
    }
    
    async createAdminProfile(input: IAdminProfileInput, creatorId: string) {
        // Check for existing admin profile
        const existingProfile = await prisma.adminUserProfile.findFirst({
            where: {
                OR: [
                    { emailAddress: input.emailAddress },
                    { phoneNumber: input.phoneNumber },
                    { staffId: input.staffId }
                ]
            }
        });
        
        if (existingProfile) {
            throw new ApiError('Admin profile already exists with these credentials', 400);
        }
        
        return await prisma.$transaction(async (tx) => {
            // Create admin profile
            const profile = await tx.adminUserProfile.create({
                data: {
                    ...input,
                    isActive: false,
                    isVerified: false,
                    // userId: '00000000-0000-0000-0000-000000000000'
                }
            });
            
            // Create verification request
            await tx.request.create({
                data: {
                    type: 'ACCOUNT_VERIFICATION',
                    module: 'ACCOUNT',
                    status: 'PENDING',
                    priority: 'HIGH',
                    initiatorId: creatorId,
                    content: {
                        type: 'ADMIN_PROFILE_VERIFICATION',
                        adminProfileId: profile.id
                    },
                    metadata: {
                        staffId: input.staffId,
                        emailAddress: input.emailAddress,
                        phoneNumber: input.phoneNumber
                    },
                    nextApprovalLevel: 1,
                    approvalSteps: {
                        create: {
                            level: 1,
                            status: 'PENDING',
                            approverRole: 'ADMIN'
                        }
                    }
                }
            });
            
            // Create notification for approvers
            const approvers = await this.getApprovers(1);
            await Promise.all(approvers.map(approver => 
                tx.notification.create({
                    data: {
                        userId: approver.id,
                        type: 'APPROVAL_REQUIRED',
                        title: 'Admin Profile Verification Required',
                        message: `New admin profile created for ${input.firstName} ${input.lastName} requires verification`,
                        priority: 'HIGH'
                    }
                })
            ));
            
            return profile;
        });
    }
    
    
    // Add new method to process Admin Account creation requests
    async processAdminProfileRequest(requestId: string, status: 'APPROVED' | 'REJECTED', approverId: string, comment?: string) {
        const request = await prisma.request.findUnique({
            where: { id: requestId },
            include: {
                initiator: true
            }
        });
        
        if (!request) {
            throw new ApiError('Request not found', 404);
        }
        
        // if (request.type !== 'ACCOUNT_VERIFICATION') {
        //     throw new ApiError('Invalid request type', 400);
        // }
        
        // Fix the request type check
        if (request.type !== 'ACCOUNT_VERIFICATION' || 
            request.module !== 'ACCOUNT' || 
            (request.content as any)?.type !== 'ADMIN_PROFILE_VERIFICATION') {
                throw new ApiError('Invalid request type', 400);
            }
            
            
            return await prisma.$transaction(async (tx) => {
                // Update request status
                const updatedRequest = await tx.request.update({
                    where: { id: requestId },
                    data: {
                        status: status,
                        approverId,
                        completedAt: new Date(),
                        approvalSteps: {
                            updateMany: {
                                where: { requestId },
                                data: {
                                    status: status,
                                    approverId,
                                    notes: comment,
                                    approvedAt: new Date()
                                }
                            }
                        }
                    }
                });
                
                if (status === 'APPROVED') {
                    // Get admin profile ID from request content
                    const adminProfileId = (request.content as any).adminProfileId;
                    
                    // Activate Profile
                    await tx.adminUserProfile.update({
                        where: { id: adminProfileId },
                        data: {
                            isActive: true
                        }
                    });
                }
                
                // Create notification for the admin profile owner
                await tx.notification.create({
                    data: {
                        userId: request.initiatorId,
                        type: 'REQUEST_UPDATE',
                        title: `Admin Profile ${status}`,
                        message: status === 'APPROVED' 
                        ? 'Your admin profile has been approved. You can now create your admin user account.'
                        : `Your admin profile was rejected. ${comment || ''}`,
                        priority: 'HIGH',
                        requestId: request.id
                    }
                });
                
                return updatedRequest;
            });
        }
        
    async getRolesByApprovalLevel(level: number) {
            const roles = await prisma.role.findMany({
                where: {
                    approvalLevel: level,
                    canApprove: true,
                },
            });
            
            const roleIds = roles.map((r: { id: string }) => r.id);
            return prisma.role.findMany({
                where: {
                    id: { in: roleIds },
                },
            });
        }
        
        async getApprovers(level: number) {
            const roles = await this.getRolesByApprovalLevel(level);
            const roleIds = roles.map((r: { id: string }) => r.id);
            
            return prisma.user.findMany({
                where: {
                    roleAssignment: {
                        roleId: { in: roleIds },
                        isActive: true,
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } },
                        ],
                    },
                    isActive: true,
                },
                include: {
                    roleAssignment: {
                        include: {
                            role: true,
                        },
                    },
                    adminProfile: true,
                },
            });
        }
        
        async suspendAdminUser(userId: string, reason: string, suspendedBy: string) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    adminProfile: true,
                    roleAssignment: {
                        include: { role: true }
                    }
                }
            });
            
            if (!user || !user.adminProfile) {
                throw new ApiError('Admin user not found', 404);
            }
            
            return await prisma.$transaction(async (tx) => {
                // Suspend user
                const suspendedUser = await tx.user.update({
                    where: { id: userId },
                    data: {
                        isActive: false,
                        sessions: {
                            updateMany: {
                                where: { isActive: true },
                                data: { 
                                    isActive: false,
                                    isRevoked: true
                                }
                            }
                        }
                    }
                });
                
                // Create suspension record
                await tx.request.create({
                    data: {
                        type: 'ACCOUNT_UPDATE',
                        module: 'ACCOUNT',
                        status: 'COMPLETED',
                        priority: 'HIGH',
                        initiatorId: suspendedBy,
                        content: {
                            type: 'ACCOUNT_SUSPENSION',
                            userId,
                            reason
                        },
                        metadata: {
                            action: 'SUSPEND',
                            reason,
                            timestamp: new Date()
                        },
                        completedAt: new Date()
                    }
                });
                
                // Notify user
                await tx.notification.create({
                    data: {
                        userId,
                        type: 'ACCOUNT_UPDATE',
                        title: 'Account Suspended',
                        message: `Your account has been suspended. Reason: ${reason}`,
                        priority: 'HIGH'
                    }
                });
                
                return suspendedUser;
            });
        }
        
        async reactivateAdminUser(userId: string, reactivatedBy: string, comment: string) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    adminProfile: true
                }
            });
            
            if (!user || !user.adminProfile) {
                throw new ApiError('Admin user not found', 404);
            }
            
            return await prisma.$transaction(async (tx) => {
                // Reactivate user
                const reactivatedUser = await tx.user.update({
                    where: { id: userId },
                    data: {
                        isActive: true
                    }
                });
                
                // Create reactivation record
                await tx.request.create({
                    data: {
                        type: 'ACCOUNT_UPDATE',
                        module: 'ACCOUNT',
                        status: 'COMPLETED',
                        priority: 'HIGH',
                        initiatorId: reactivatedBy,
                        content: {
                            type: 'ACCOUNT_REACTIVATION',
                            userId,
                            comment
                        },
                        metadata: {
                            action: 'REACTIVATE',
                            comment,
                            timestamp: new Date()
                        },
                        completedAt: new Date()
                    }
                });
                
                // Notify user
                await tx.notification.create({
                    data: {
                        userId,
                        type: 'ACCOUNT_UPDATE',
                        title: 'Account Reactivated',
                        message: 'Your account has been reactivated.',
                        priority: 'HIGH'
                    }
                });
                
                return reactivatedUser;
            });
        }
        
        async softDeleteAdminUser(userId: string, deletedBy: string, reason: string) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    adminProfile: true
                }
            });
            
            if (!user || !user.adminProfile) {
                throw new ApiError('Admin user not found', 404);
            }
            
            return await prisma.$transaction(async (tx) => {
                // Soft delete user
                const deletedUser = await tx.user.update({
                    where: { id: userId },
                    data: {
                        isActive: false,
                        sessions: {
                            updateMany: {
                                where: { isActive: true },
                                data: { 
                                    isActive: false,
                                    isRevoked: true
                                }
                            }
                        },
                        roleAssignment: {
                            update: {
                                where: { isActive: true },
                                data: { isActive: false }
                            }
                        }
                    }
                });
                
                // Create deletion record
                await tx.request.create({
                    data: {
                        type: 'ACCOUNT_UPDATE',
                        module: 'ACCOUNT',
                        status: 'COMPLETED',
                        priority: 'HIGH',
                        initiatorId: deletedBy,
                        content: {
                            type: 'ACCOUNT_DELETION',
                            userId,
                            reason
                        },
                        metadata: {
                            action: 'DELETE',
                            reason,
                            timestamp: new Date()
                        },
                        completedAt: new Date()
                    }
                });
                
                return deletedUser;
            });
        }
    }