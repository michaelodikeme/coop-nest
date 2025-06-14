import { ApprovalStatus, PrismaClient, RequestStatus, RequestType } from '@prisma/client';
import { 
  IUserLoginInput,
  ICreateUserInput,
  IUserUpdateInput, 
  IAssignRoleInput, 
  IUserPermissions,
  IUserQueryFilters,
  IUserWithRoles,
  IRoleAssignment,
  IChangePasswordInput,
  IRolePermissionsCache,
} from '../interfaces/user.interface';
import { hash, compare } from 'bcrypt';
import { PERMISSIONS, Module, DEFAULT_ROLES, RoleDefinition } from '../../../types/permissions';
import { ApiError } from '../../../utils/apiError';
import { tokenService } from './token.service';
import jwt from 'jsonwebtoken';
import env from '../../../config/env';
import { redisClient } from '../../../config/redis';

const prisma = new PrismaClient();

// Type for Prisma transaction
type PrismaTransaction = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class UserService {
  async createUser(input: ICreateUserInput) {
    const { biodataId, username, password, isMember, roleIds, expiryDates } = input;
    
    // Check if biodata is verified and approved
    const biodata = await prisma.biodata.findUnique({
      where: { id: biodataId },
    });
    
    if (!biodata || !biodata.isVerified) {
      throw new ApiError ('Biodata is not verified. Please verify again.', 400);
    }
    
    if (!biodata.isApproved) {
      throw new ApiError ('Your membership registration is still pending approval. Please contact the admin.', 403)
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username || undefined }
        ],
      },
    });
    
    if (existingUser) {
      throw new ApiError('User already exists with this username', 400);
    }
    
    const hashedPassword = await hash(password, 10);
    
    // Get default MEMBER role
    const memberRole = await prisma.role.findFirst({
      where: { name: 'MEMBER' },
    });
    
    if (!memberRole) {
      throw new ApiError('Default MEMBER role not found in database', 500);
    }
    
    // Determine roles to assign
    let rolesToAssign = roleIds && roleIds.length > 0 ? roleIds : [memberRole.id];
    
    // Use transaction to create user and assign roles
    const user = await prisma.$transaction(async (tx: PrismaTransaction) => {
      // Create user WITH biodataId
      const newUser = await tx.user.create({
        data: {
          biodataId, // FIXED: Now including biodataId 
          username,
          password: hashedPassword,
          isMember,
          isActive: true,
        },
      });
      
      // Assign roles
      await Promise.all(rolesToAssign.map(roleId =>
        tx.userRole.create({
          data: {
            userId: newUser.id,
            roleId,
            expiresAt: expiryDates?.[roleId],
            isActive: true,
          },
        })
      ));
      
      // Create welcome notification
      await tx.notification.create({
        data: {
          userId: newUser.id,
          type: 'SYSTEM_ALERT',
          title: 'Welcome to the Cooperative System',
          message: 'Your account has been created successfully. Please complete your profile.',
          priority: 'NORMAL',
        },
      });
      
      return tx.user.findUnique({
        where: { id: newUser.id },
        include: {
          roleAssignments: {
            include: {
              role: true,
            },
          },
        },
      });
    });
    
    return user;
  }
  
  // async createAdminUser(input: ICreateAdminUserInput) {
  //   const { username, password, adminProfile, roleIds } = input;
  
  //   // Check if admin role exists
  //   const adminRole = await prisma.role.findFirst({
  //     where: { name: 'ADMIN' }
  //   });
  
  //   if (!adminRole) {
  //     throw new ApiError('Admin role not found', 500);
  //   }
  
  //   return await prisma.$transaction(async (tx) => {
  //     // Create base user
  //     const hashedPassword = await hash(password, 10);
  
  //     const user = await tx.user.create({
  //       data: {
  //         username,
  //         password: hashedPassword,
  //         isMember: false,
  //         isActive: true
  //       }
  //     });
  
  //     // Create admin profile
  //     await tx.adminUserProfile.create({
  //       data: {
  //         ...adminProfile,
  //         userId: user.id
  //       }
  //     });
  
  //     // Assign admin role and any additional roles
  //     const rolesToAssign = [...(roleIds || []), adminRole.id];
  
  //     await Promise.all(rolesToAssign.map(roleId =>
  //       tx.userRole.create({
  //         data: {
  //           userId: user.id,
  //           roleId,
  //           isActive: true
  //         }
  //       })
  //     ));
  
  //     // Create system notification
  //     await tx.notification.create({
  //       data: {
  //         userId: user.id,
  //         type: 'SYSTEM_ALERT',
  //         title: 'Admin Account Created',
  //         message: 'Your admin account has been created successfully.',
  //         priority: 'HIGH'
  //       }
  //     });
  
  //     return tx.user.findUnique({
  //       where: { id: user.id },
  //       include: {
  //         roleAssignments: {
  //           include: {
  //             role: true
  //           }
  //         },
  //         adminProfile: true
  //       }
  //     });
  //   });
  // }
  
  async loginUser(input: IUserLoginInput) {
    const { username, password, deviceInfo, ipAddress } = input;
    
    // Validate user and credentials
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }],
        isActive: true,
      },
      include: {
        roleAssignments: {
          where: {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          include: {
            role: true,
          },
        },
        biodata: true,
        adminProfile: true,
      },
    });
    
    if (!user || !user.password) {
      throw new ApiError('Invalid credentials', 401);
    }
    
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid credentials', 401);
    }
    
    // Look for an existing valid session with proper device info
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        deviceInfo: global.deviceInfo || deviceInfo || 'unknown',
        isActive: true,
        isRevoked: false,
        expiresAt: { gt: new Date() }
      }
    });

    // --- FIX: Check if token is expired or blacklisted ---
    let validSession = existingSession;
    if (existingSession) {
      try {
        // Verify JWT expiry
        jwt.verify(existingSession.token, env.JWT_SECRET as string);

        // Check blacklist in Redis
        const decoded: any = jwt.decode(existingSession.token);
        if (decoded?.jti) {
          const isBlacklisted = await redisClient.get(`blacklist:${decoded.jti}`);
          if (isBlacklisted) {
            validSession = null;
          }
        }
      } catch (err) {
        // Token is expired or invalid
        validSession = null;
      }
    }

    if (validSession) {
      const newExpiryTime = new Date(Date.now() + 3600 * 1000);
      
      const updatedSession = await prisma.session.update({
        where: { id: validSession.id },
        data: {
          lastActive: new Date(),
          expiresAt: newExpiryTime,
          ipAddress: global.ipAddress || ipAddress || 'unknown',
          userAgent: global.userAgent || 'unknown',
          deviceInfo: global.deviceInfo || deviceInfo || 'unknown'
        }
      });
      
      return {
        user,
        session: updatedSession,
        tokens: {
          accessToken: validSession.token,
          refreshToken: validSession.refreshToken,
          expiresIn: Math.floor((newExpiryTime.getTime() - Date.now()) / 1000)
        }
      };
    }
    
    // Invalidate old sessions first
    await prisma.session.updateMany({
      where: {
        userId: user.id,
        deviceInfo: deviceInfo || 'unknown',
        OR: [
          { expiresAt: { lte: new Date() } },
          { isActive: false }
        ]
      },
      data: {
        isActive: false,
        isRevoked: true
      }
    });
    
    // Generate new tokens and get session
    const { accessToken, refreshToken, expiresIn, session } = await tokenService.generateTokenPair(user);
    
    return {
      user,
      session,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn
      }
    };
  }
  
  async logoutUser(userId: string, accessToken: string) {
    // Invalidate the access token
    await tokenService.invalidateToken(accessToken);
    
    // Invalidate all sessions for the user
    await Promise.all([
      this.invalidateAllSessions(userId),
      tokenService.invalidateAllUserSessions(userId)
    ]);
    
    return { success: true };
  }
  
  async updateUsername(userId: string, input: IUserUpdateInput) {
    const { username } = input;
    
    if (username) {
      // Get user's roles and permissions
      const userPermissions = await this.getUserPermissions(userId);
      const userRoles = userPermissions.roles;
      
      // Check if username is already taken
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: userId }
        }
      });
      
      if (existingUser) {
        throw new ApiError('Username is already taken', 400);
      }
      
      // Check for existing pending requests
      const existingRequest = await prisma.request.findFirst({
        where: {
          initiatorId: userId,
          type: 'ACCOUNT_UPDATE',
          status: 'PENDING',
          module: 'ACCOUNT',
        }
      });
      
      if (existingRequest) {
        throw new ApiError('You already have a pending username update request', 400);
      }
      
      // Determine approval requirements based on role
      let approverRole = 'ADMIN';
      let approvalLevel = 1;
      
      // // Only SUPER_ADMIN and CHAIRMAN (level 3) can bypass approval
      // if (userRoles.some(role => ['SUPER_ADMIN', 'TREASURER', 'CHAIRMAN'].includes(role)) && 
      // userPermissions.approvalLevel >= 3) {
      //   requiresApproval = false;
      // }
      
      // Check if user is ADMIN or MEMBER - these roles require approval
      const requiresApproval = userRoles.some(role => ['ADMIN', 'MEMBER'].includes(role)) ||
      userPermissions.approvalLevel <= 1;
      
      if (requiresApproval) {
        // Create request using transaction to ensure data consistency
        const request = await prisma.$transaction(async (tx) => {
          // First create the request
          const req = await tx.request.create({
            data: {
              type: 'ACCOUNT_UPDATE',
              module: 'ACCOUNT',
              status: 'PENDING',
              priority: 'NORMAL',
              initiatorId: userId,
              content: {
                type: 'USERNAME_UPDATE',
                newUsername: username,
              },
              metadata: {
                oldUsername: (await this.getUserById(userId)).username,
                userRoles: userRoles
              },
              nextApprovalLevel: approvalLevel,
              approvalSteps: {
                create: {
                  level: approvalLevel,
                  status: 'PENDING',
                  approverRole
                }
              }
            },
            include: {
              approvalSteps: true
            }
          });
          
          // Create notifications within the same transaction
          // Notify the requesting user
          await tx.notification.create({
            data: {
              userId,
              type: 'REQUEST_UPDATE',
              title: 'Username Update Request Submitted',
              message: 'Your request to change username has been submitted and is pending approval.',
              priority: 'NORMAL',
              requestId: req.id // Now we have the request ID
            }
          });
          
          // Notify approvers
          const approvers = await this.getApprovers(1);
          await Promise.all(approvers.map(approver =>
            tx.notification.create({
              data: {
                userId: approver.id,
                type: 'APPROVAL_REQUIRED',
                title: 'Username Update Approval Required',
                message: 'A new username update request requires your approval.',
                priority: 'NORMAL',
                requestId: req.id // Now we have the request ID
              }
            })
          ));
          
          return req;
        });
        
        return {
          message: 'Username update request submitted successfully',
          requestId: request.id
        };
      } else {
        // Direct update for SUPER_ADMIN and CHAIRMAN
        const user = await prisma.user.update({
          where: { id: userId },
          data: { username },
          include: {
            roleAssignments: {
              include: {
                role: true,
              },
            },
            biodata: true,
            adminProfile: true,
          },
        });
        
        // Create notification for direct update
        await prisma.notification.create({
          data: {
            userId,
            type: 'ACCOUNT_UPDATE',
            title: 'Username Updated',
            message: 'Your username has been updated successfully.',
            priority: 'NORMAL'
          }
        });
        
        return user;
      }
    }
    
    throw new ApiError('Only username updates are allowed through this endpoint', 400);
  }
  
  async changePassword(userId: string, input: IChangePasswordInput) {
    const { currentPassword, newPassword } = input;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user || !user.password) {
      throw new ApiError('User not found', 404);
    }
    
    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError('Current password is incorrect', 401);
    }
    
    const hashedPassword = await hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    
    // Create notification for password change
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'ACCOUNT_UPDATE',
        title: 'Password Changed Successfully',
        message: 'Your password has been updated successfully.',
        priority: 'HIGH',
      },
    });
    
    return { success: true };
  }
  
  async validatePermissions(permissions: string[]): Promise<boolean> {
    const validPermissions = PERMISSIONS.map(p => p.name);
    return permissions.every(p => validPermissions.includes(p));
  }
  
  async validateModuleAccess(modules: string[]): Promise<boolean> {
    return modules.every(m => Object.values(Module).includes(m as Module));
  }
  
  async getUserPermissions(userId: string): Promise<IUserPermissions> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            roleAssignments: {
                where: {
                    isActive: true,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } },
                    ],
                },
                include: {
                    role: true,
                },
            },
        },
    });

    if (!user) {
        throw new ApiError('User not found', 404);
    }

    // Ensure consistent role name format
    const roles = user.roleAssignments.map(ua => ua.role.name.toUpperCase());
    
    const permissions = new Set<string>();
    const moduleAccess = new Set<string>();
    let maxApprovalLevel = 0;
    let canApprove = false;

    user.roleAssignments.forEach(ua => {
        // Get role's approval level
        const roleApprovalLevel = ua.role.approvalLevel || 0;
        if (roleApprovalLevel > maxApprovalLevel) {
            maxApprovalLevel = roleApprovalLevel;
        }
        
        // Update can approve
        if (ua.role.canApprove) {
            canApprove = true;
        }

        // Add permissions based on approval level
        ua.role.permissions.forEach(permissionName => {
            const permission = PERMISSIONS.find(p => p.name === permissionName);
            if (permission) {
                // Only add if no approval level required or user meets the requirement
                if (!permission.requiredApprovalLevel || 
                    roleApprovalLevel >= permission.requiredApprovalLevel) {
                    permissions.add(permissionName);
                }
            }
        });

        // Add module access
        ua.role.moduleAccess.forEach(module => {
            moduleAccess.add(module);
        });
    });

    return {
        roles,
        permissions: Array.from(permissions),
        moduleAccess: Array.from(moduleAccess),
        approvalLevel: maxApprovalLevel,
        canApprove
    };
  }
  
  async getUserModuleAccess(userId: string): Promise<string[]> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.moduleAccess;
  }
  
  async assignRole(input: IAssignRoleInput) {
    const { userId, roleId, expiresAt } = input;
    
    // First check if the role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });
    
    if (!role) {
      throw new ApiError('Role not found', 404);
    }
    
    // Validate against DEFAULT_ROLES
    const defaultRole = DEFAULT_ROLES.find((r: RoleDefinition) => r.name === role.name);
    if (!defaultRole) {
      throw new ApiError('Invalid role type', 400);
    }
    
    // Check if this is a system role being modified
    if (defaultRole.isSystem) {
      const assignerPermissions = await this.getUserPermissions(userId);
      if (assignerPermissions.approvalLevel < defaultRole.approvalLevel) {
        throw new ApiError('Insufficient permissions to assign this role', 403);
      }
    }
    
    // Check if role assignment already exists
    const existingAssignment = await prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
    
    if (existingAssignment) {
      throw new ApiError('User already has this role assigned', 400);
    }
    
    const userRole = await prisma.$transaction(async (tx: PrismaTransaction) => {
      const assignment = await tx.userRole.create({
        data: {
          userId,
          roleId,
          expiresAt,
          isActive: true,
        },
        include: {
          role: true,
        },
      });
      
      // Create notification for role assignment
      await tx.notification.create({
        data: {
          userId,
          type: 'ACCOUNT_UPDATE',
          title: 'Role Assignment',
          message: `You have been assigned a new role: ${assignment.role.name}`,
          priority: 'HIGH',
        },
      });
      
      return assignment;
    });
    
    return userRole;
  }
  
  async updateUserRole(userRoleId: string, updates: { isActive?: boolean; expiresAt?: Date }) {
    return prisma.$transaction(async (tx: PrismaTransaction) => {
      const userRole = await tx.userRole.update({
        where: { id: userRoleId },
        data: updates,
        include: {
          role: true,
          user: true,
        },
      });
      
      // Create notification for role update
      await tx.notification.create({
        data: {
          userId: userRole.userId,
          type: 'ACCOUNT_UPDATE',
          title: 'Role Update',
          message: updates.isActive === false 
          ? `Your role ${userRole.role.name} has been deactivated` 
          : `Your role ${userRole.role.name} has been updated`,
          priority: 'HIGH',
        },
      });
      
      return userRole;
    });
  }
  
  async approveUsernameUpdate(requestId: string, approverId: string, status: 'APPROVED' | 'REJECTED', comment?: string) {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        initiator: true,
        approvalSteps: true
      }
    });
    
    if (!request) {
      throw new ApiError('Request not found', 404);
    }
    
    if (request.type !== 'ACCOUNT_UPDATE' || (request.content as any)?.type !== 'USERNAME_UPDATE') {
      throw new ApiError('Invalid request type', 400);
    }
    
    if (request.status !== 'PENDING') {
      throw new ApiError('Request is no longer pending', 400);
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
        // Update username
        await tx.user.update({
          where: { id: request.initiatorId },
          data: {
            username: (request.content as any).newUsername
          }
        });
      }
      
      // Create notification for the user
      await tx.notification.create({
        data: {
          userId: request.initiatorId,
          type: 'REQUEST_UPDATE',
          title: `Username Update ${status}`,
          message: status === 'APPROVED' 
          ? 'Your username update request has been approved.'
          : `Your username update request was rejected. ${comment || ''}`,
          priority: 'NORMAL',
          requestId: request.id
        }
      });
      
      return updatedRequest;
    });
  }
  
  async deactivateUser(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        sessions: {
          updateMany: {
            where: { isActive: true },
            data: { isActive: false },
          },
        },
      },
    });
    
    return user;
  }
  
  async getUsers(filters: IUserQueryFilters) {
    const users = await prisma.user.findMany({
      where: filters,
      include: {
        roleAssignments: {
          include: {
            role: true,
          },
        },
        biodata: true,
        adminProfile: true,
      },
    });
    
    return users;
  }
  
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roleAssignments: {
          include: {
            role: true,
          },
        },
        biodata: true,
        adminProfile: true,
        notifications: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    return user;
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
  
  async getUsersByRole(roleId: string) {
    return prisma.user.findMany({
      where: {
        roleAssignments: {
          some: {
            roleId,
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
      },
      include: {
        roleAssignments: {
          include: {
            role: true,
          },
        },
        adminProfile: true,
      },
    });
  }
  
  async getApprovers(level: number) {
    const roles = await this.getRolesByApprovalLevel(level);
    const roleIds = roles.map((r: { id: string }) => r.id);
    
    return prisma.user.findMany({
      where: {
        roleAssignments: {
          some: {
            roleId: { in: roleIds },
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
        isActive: true,
      },
      include: {
        roleAssignments: {
          include: {
            role: true,
          },
        },
        adminProfile: true,
      },
    });
  }
  
  async updateSession(sessionId: string, data: { isActive?: boolean; lastActivity?: Date }) {
    return prisma.session.update({
      where: { id: sessionId },
      data: {
        ...data,
      },
    });
  }
  
  async getUserSessions(userId: string) {
    return prisma.session.findMany({
      where: { 
        userId,
        isActive: true,
      },
      orderBy: {
        lastActive: 'desc',
      },
    });
  }
  
  async invalidateAllSessions(userId: string, exceptSessionId?: string) {
    await prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
        id: exceptSessionId ? { not: exceptSessionId } : undefined,
      },
      data: {
        isActive: false,
      },
    });
  }
  
  async getAssignedRequests(userId: string, params: {
    page?: number;
    limit?: number;
    status?: string[];
  } = {}) {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    // Get user permissions once
    const userPermissions = await this.getUserPermissions(userId);
    const userRoles = userPermissions.roles;
    const userApprovalLevel = userPermissions.approvalLevel;

    // Map status strings to RequestStatus enum values
    const statusFilter: RequestStatus[] = (status
      ? status.map(s => RequestStatus[s as keyof typeof RequestStatus])
      : [RequestStatus.PENDING, RequestStatus.IN_REVIEW, RequestStatus.REVIEWED]
    );

    // Build where conditions for actionable requests
    const whereConditions = {
      AND: [
        {
          OR: [
            // Explicitly assigned requests
            { assigneeId: userId },
            
            // Role-based assignment for current approval level
            {
              AND: [
                // Request is at user's approval level
                { nextApprovalLevel: userApprovalLevel },
                
                // User has required role for this level
                {
                  approvalSteps: {
                    some: {
                      level: userApprovalLevel,
                      status: ApprovalStatus.PENDING,
                      approverRole: { in: userRoles },
                      approverId: null // Not yet approved by someone
                    }
                  }
                }
              ]
            }
          ]
        },
        
        // Only actionable statuses
        {
          status: {
            in: statusFilter
          }
        }
      ]
    };

    // Execute queries in parallel
    const [requests, totalCount] = await Promise.all([
      prisma.request.findMany({
        where: whereConditions,
        include: {
          initiator: {
            select: {
              id: true,
              username: true,
              biodata: {
                select: {
                  fullName: true,
                  department: true,
                  erpId: true
                }
              }
            }
          },
          biodata: {
            select: {
              fullName: true,
              department: true,
              erpId: true
            }
          },
          approvalSteps: {
            where: {
              level: userApprovalLevel
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ],
        skip,
        take: limit
      }),
      
      prisma.request.count({ where: whereConditions })
    ]);

    return {
      data: requests,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }
  
  async getInitiatedRequests(userId: string) {
    return prisma.request.findMany({
      where: {
        initiatorId: userId,
      },
      include: {
        approvalSteps: {
          include: {
            approver: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
  
  async getApprovedRequests(userId: string) {
    return prisma.request.findMany({
      where: {
        approvalSteps: {
          some: {
            approverId: userId,
          },
        },
      },
      include: {
        initiator: true,
        approvalSteps: {
          include: {
            approver: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }
  
  async refreshUserToken(refreshToken: string) {
    try {
      // Use the tokenService to refresh the token
      const result = await tokenService.refreshAccessToken(refreshToken);
      
      if (!result) {
        return null;
      }
      
      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn
      };
    } catch (error) {
      console.error('Error in refreshUserToken:', error);
      return null;
    }
  }
}