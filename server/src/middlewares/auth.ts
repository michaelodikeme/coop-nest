import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { UserService } from '../modules/user/services/user.service';
import { PrismaClient } from '@prisma/client';
import { PERMISSIONS, Action } from '../types/permissions';
import { AuthenticatedUser } from '../types/express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { TokenPayload } from '../modules/user/interfaces/token.interface';
import { tokenService } from '../modules/user/services/token.service';
import { redisClient } from '../config/redis';

const prisma = new PrismaClient();
const userService = new UserService();

// Extend Express Request type to include user and session
declare global {
  namespace Express {
    interface Request {
      user: any;
      session?: any;
      userPermissions?: {
        permissions: string[];
        roles: string[];
        approvalLevel: number;
        canApprove: boolean;
        moduleAccess?: string[];
      };
    }
  }
}

/**
 * Middleware to authenticate user based on token
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError('No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      
      // Check if token has a JTI (JWT ID)
      if (!decoded.jti) {
        throw new ApiError('Invalid token format - missing token ID', 401);
      }
      
      // Check if token is blacklisted in Redis
      const isBlacklisted = await redisClient.get(`blacklist:${decoded.jti}`);
      if (isBlacklisted) {
        throw new ApiError('Token has been revoked', 401);
      }

      // Get user with roles and permissions
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
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
          adminProfile: true,
        },
      });

      if (!user || !user.isActive) {
        throw new ApiError('User not found or inactive', 401);
      }

      // Get active session - verify against the database source of truth
      const session = await prisma.session.findFirst({
        where: {
          userId: user.id,
          token: token,
          isActive: true,
          isRevoked: false,
          expiresAt: {
            gt: new Date()
          }
        },
      });

      if (!session) {
        throw new ApiError('Session expired or invalid', 401);
      }

      // Update session last activity
      await prisma.session.update({
        where: { id: session.id },
        data: { lastActive: new Date() }
      });

      const userPerms = await userService.getUserPermissions(user.id);
      
      // Create authenticated user object
      const authenticatedUser: AuthenticatedUser = {
          id: user.id,
          biodataId: user.biodataId ?? '',
          roles: user.roleAssignments.map(ra => ({
              name: ra.role.name,
              isAdmin: !!user.adminProfile
          })),
          permissions: userPerms.permissions || [],
          approvalLevel: userPerms.approvalLevel || 0,
          isAdmin: !!user.adminProfile,
          username: user.username || '',
          erpId: decoded.erpId || null,
          sessionId: session.id,
          tokenJti: decoded.jti // Store JTI for potential revocation
      };

      req.user = authenticatedUser;
      req.session = session;

      // After setting req.user, also fetch and cache permissions
      req.userPermissions = userPerms;
      
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError('Invalid token signature', 401);
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError('Token expired', 401);
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has specified roles
 */
export const authorizeRoles = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If permissions haven't been cached, fetch them
      if (!req.userPermissions) {
        req.userPermissions = await userService.getUserPermissions(req.user.id);
      }
      
      // Check roles directly from user object first - More reliable
      const userRoleNames = req.user.roles.map(r => r.name);
      
      // Debug output
      console.log("Required roles:", roles);
      console.log("User role names from req.user:", userRoleNames);
      console.log("User role names from req.userPermissions:", req.userPermissions.roles);
      
      // Check both sources of role information
      const hasRoleFromUser = userRoleNames.some(role => roles.includes(role));
      const hasRoleFromPermissions = req.userPermissions.roles.some(role => roles.includes(role));
      
      if (hasRoleFromUser || hasRoleFromPermissions) {
        return next();
      }
      
      // Super admin bypass - Always allow super admin access
      if (userRoleNames.includes('SUPER_ADMIN')) {
        console.log('Granting access via SUPER_ADMIN role');
        return next();
      }
      
      throw new ApiError('Insufficient role permissions', 403);
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError('Role authorization failed', 403));
      }
    }
  };
};

/**
 * Middleware to check if user has specific permission
 */
export const checkPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate that the permission exists in our defined permissions
      const permissionExists = PERMISSIONS.some(p => p.name === permission);
      if (!permissionExists) {
        throw new ApiError(`Invalid permission: ${permission}`, 500);
      }

      // If permissions haven't been cached, fetch them
      if (!req.userPermissions) {
        req.userPermissions = await userService.getUserPermissions(req.user.id);
      }
      
      if (!req.userPermissions.permissions.includes(permission)) {
        throw new ApiError(`Missing required permission: ${permission}`, 403);
      }
      
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError('Permission check failed', 403));
      }
    }
  };
};

/**
 * Middleware to check if user has access to specified module
 */
export const checkModuleAccess = (module: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If permissions haven't been cached, fetch them
      if (!req.userPermissions) {
        req.userPermissions = await userService.getUserPermissions(req.user.id);
      }
      
      // Module access check logic - this will depend on how your user service returns module access
      // For this example, assuming there's a modules property in the userPermissions object
      // Check if any role has admin access or if module access is granted
      const hasAccess = req.user.roles.some(role => role.isAdmin) || 
                      req.userPermissions.moduleAccess?.includes(module);
      
      if (!hasAccess) {
        throw new ApiError(`Access to module ${module} denied`, 403);
      }
      
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError('Module access check failed', 403));
      }
    }
  };
};

/**
 * Middleware to check if user has sufficient approval level
 */
export const checkApprovalLevel = (requiredLevel: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If permissions haven't been cached, fetch them
      if (!req.userPermissions) {
        req.userPermissions = await userService.getUserPermissions(req.user.id);
      }
      
      const { approvalLevel, canApprove } = req.userPermissions;
      
      if (!canApprove || approvalLevel < requiredLevel) {
        throw new ApiError(
          `Insufficient approval level. Required: ${requiredLevel}, Your level: ${approvalLevel}`, 
          403
        );
      }
      
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError('Approval level check failed', 403));
      }
    }
  };
};

/**
 * Middleware for combined permission and approval level check
 */
export const checkPermissionAndLevel = (permission: string, requiredLevel: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If permissions haven't been cached, fetch them
      if (!req.userPermissions) {
        req.userPermissions = await userService.getUserPermissions(req.user.id);
      }
      
      // Check permission first
      if (!req.userPermissions.permissions.includes(permission)) {
        throw new ApiError(`Missing required permission: ${permission}`, 403);
      }
      
      // Get the permission details to check if it's an approval action
      const permissionDetails = PERMISSIONS.find(p => p.name === permission);
      const isApprovalAction = permissionDetails?.action === Action.APPROVE;
      
      // Check approval level based on action type
      const { approvalLevel, canApprove } = req.userPermissions;
      
      if (approvalLevel < requiredLevel) {
        // Always check approval level regardless of action type
        throw new ApiError(
          `Insufficient approval level. Required: ${requiredLevel}, Your level: ${approvalLevel}`, 
          403
        );
      } else if (isApprovalAction && !canApprove) {
        // Only check canApprove for approval actions
        throw new ApiError(
          `Your role doesn't have approval authority. Required: approval authority`, 
          403
        );
      }
      
      next();
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        next(new ApiError('Permission and approval level check failed', 403));
      }
    }
  };
};