import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { RoleService } from "../services/role.service";
import {
  createUserSchema,
  updateUserSchema,
  userLoginSchema,
  changePasswordSchema,
  assignRoleSchema,
  updateRoleSchema,
  userQuerySchema,
  approveUsernameUpdateSchema,
} from "../validations/user.validation";
import { ApiError } from "../../../utils/apiError";
import { DEFAULT_ROLES, RoleDefinition } from "../../../types/permissions";
import { z } from "zod";
import logger from "../../../utils/logger";
import { RequestStatus, RequestType } from "@prisma/client";
import { ICreateUserInput, IUserLoginInput, IChangePasswordInput, IAssignRoleInput } from "../interfaces/user.interface";

// Extend Express Request to include authenticated user
interface AuthRequest extends Request {
  user: {
    id: string;
    biodataId: string;
    role: {
      name: string;
      isAdmin: boolean;
    };
    permissions?: string[];
    approvalLevel: number;
  };
  session?: {
    id: string;
  };
}

export class UserController {
  private userService: UserService;
  private roleService: RoleService;

  constructor() {
    this.userService = new UserService();
    this.roleService = new RoleService();
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const biodataId = req.cookies.biodataId;

      if (!biodataId) {
        return res.status(400).json({
          status: "error",
          message:
            "biodataId cookie is missing. Please verify your biodata first.",
        });
      }

      // Since this is a public route, always force the MEMBER role for security
      // (remove any roleIds sent from the client)
      const userData = {
        ...req.body,
        biodataId,
        roleIds: undefined, // Clear any roleIds to ensure only MEMBER role is assigned by default
      };

      const validatedData = createUserSchema.parse(userData) as ICreateUserInput;
      const user = await this.userService.createUser(validatedData);

      res.clearCookie("biodataId");

      res.status(201).json({
        status: "success",
        data: user,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  // async createAdminUser(req: AuthRequest, res: Response, next: NextFunction) {
  //   try {
  //     // Only super admin can create other admin users
  //     if (!req.user.permissions?.includes('MANAGE_ROLES') ||
  //     !req.user.roles.some(role => role.name === 'CHAIRMAN', 'SUPER_ADMIN')) {
  //       throw new ApiError('Unauthorized to create admin users', 403);
  //     }

  //     const validatedData = createAdminUserSchema.parse(req.body);
  //     const result = await this.userService.createAdminUser(validatedData);

  //     res.status(201).json({
  //       status: 'success',
  //       data: result
  //     });
  //   } catch (error: unknown) {
  //     next(error);
  //   }
  // }

  async loginUser(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = userLoginSchema.parse({
        ...req.body,
        deviceInfo: global.deviceInfo,
        ipAddress: global.ipAddress,
      }) as IUserLoginInput;
      const result = await this.userService.loginUser(validatedData);
      console.log("login from user", {
        status: "success",
        data: result.user.roleAssignment,
      });
      res.json({
        status: "success",
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async updateUsername(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const validatedData = updateUserSchema.parse(req.body);
      const result = await this.userService.updateUsername(
        userId,
        validatedData
      );

      res.json({
        status: "success",
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
  async approveUsernameUpdate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { requestId } = req.params;
      // const { status, comment } = req.body;

      const validatedData = approveUsernameUpdateSchema.parse(req.body);

      // Validate input
      // const validatedData = z.object({
      //     status: z.enum(['APPROVED', 'REJECTED']),
      //     comment: z.string().optional()
      // }).parse({ status, comment });

      const result = await this.userService.approveUsernameUpdate(
        requestId,
        req.user.id,
        validatedData.status,
        validatedData.comment
      );

      res.json({
        status: "success",
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = changePasswordSchema.parse(req.body) as IChangePasswordInput;
      const result = await this.userService.changePassword(
        req.user.id,
        validatedData
      );
      res.json({
        status: "success",
        data: result,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async assignRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      console.log("user request", assignRoleSchema.parse(req.body));
      const validatedData = assignRoleSchema.parse(req.body) as IAssignRoleInput;

      // Prevent users from changing their own role
      if (validatedData.userId === req.user.id) {
        throw new ApiError("You cannot change your own role", 403);
      }

      const roleAssigned = await this.roleService.findRoleById(
        validatedData.roleId
      );

      console.log("roleAssigned", roleAssigned);

      // Check if user has sufficient approval level to assign this role
      if (roleAssigned && req.user.approvalLevel < roleAssigned.approvalLevel) {
        console.log(
          "here is where users are",
          req.user.approvalLevel,
          roleAssigned.approvalLevel
        );
        throw new ApiError("Insufficient permissions to assign this role", 403);
      }

      const userRole = await this.userService.assignRole(validatedData);
      res.json({
        status: "success",
        data: userRole,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  // async createAdminProfile(req: AuthRequest, res: Response, next: NextFunction) {
  //   try {
  //     const userId = req.params.id;
  //     // Only super admin can create admin profiles
  //     if (!req.user.permissions?.includes('MANAGE_ROLES')) {
  //       throw new ApiError('Unauthorized to create admin profiles', 403);
  //     }

  //     const validatedData = createAdminProfileSchema.parse(req.body);
  //     const adminProfile = await this.userService.createAdminProfile(userId, validatedData);
  //     res.json({
  //       status: 'success',
  //       data: adminProfile
  //     });
  //   } catch (error: unknown) {
  //     next(error);
  //   }
  // }

  async deactivateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id;
      // Check if user has permission to deactivate users
      if (!req.user.permissions?.includes("MANAGE_ROLES")) {
        throw new ApiError("Unauthorized to deactivate users", 403);
      }

      // Prevent deactivating own account
      if (userId === req.user.id) {
        throw new ApiError("You cannot deactivate your own account", 403);
      }

      const user = await this.userService.deactivateUser(userId);
      res.json({
        status: "success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async reactivateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id;
      // Check if user has permission to reactivate users
      if (!req.user.permissions?.includes("MANAGE_ROLES")) {
        throw new ApiError("Unauthorized to reactivate users", 403);
      }

      const user = await this.userService.reactivateUser(userId);
      res.json({
        status: "success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Check if user has permission to view all users
      if (!req.user.permissions?.includes("VIEW_USERS")) {
        throw new ApiError("Unauthorized to view users", 403);
      }

      const filters = userQuerySchema.parse(req.query);
      const users = await this.userService.getUsers(filters);
      res.json({
        status: "success",
        data: users,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getUserById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.params.id || req.user.id;
      // Check if user is viewing their own profile or has permission
      if (
        userId !== req.user.id &&
        !req.user.permissions?.includes("VIEW_OWN_PROFILE")
      ) {
        throw new ApiError("Unauthorized to view user details", 403);
      }

      const user = await this.userService.getUserById(userId);
      res.json({
        status: "success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserPermissions(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.params.id || req.user.id;
      // Check if user is viewing their own permissions or has admin rights
      if (
        userId !== req.user.id &&
        !req.user.permissions?.includes("VIEW_PERMISSIONS")
      ) {
        throw new ApiError("Unauthorized to view user permissions", 403);
      }

      const permissions = await this.userService.getUserPermissions(userId);
      res.json({
        status: "success",
        data: permissions,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getUserModuleAccess(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.params.id;
      // Check if user is viewing their own module access or has admin rights
      if (
        userId !== req.user.id &&
        !req.user.permissions?.includes("VIEW_PERMISSIONS")
      ) {
        throw new ApiError("Unauthorized to view module access", 403);
      }

      const moduleAccess = await this.userService.getUserModuleAccess(userId);
      res.json({
        status: "success",
        data: moduleAccess,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userRoleId } = req.params;
      // Check if user has permission to update roles
      if (!req.user.permissions?.includes("MANAGE_ROLES")) {
        throw new ApiError("Unauthorized to update roles", 403);
      }

      const updates = updateRoleSchema.parse(req.body);
      const userRole = await this.userService.updateUserRole(
        userRoleId,
        updates
      );
      res.json({
        status: "success",
        data: userRole,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getRolesByApprovalLevel(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Check if user has permission to view roles
      if (!req.user.permissions?.includes("MANAGE_ROLES")) {
        throw new ApiError("Unauthorized to view roles", 403);
      }

      const level = parseInt(req.params.level);
      if (isNaN(level)) {
        throw new ApiError("Invalid approval level", 400);
      }
      const roles = await this.userService.getRolesByApprovalLevel(level);
      res.json({
        status: "success",
        data: roles,
      });
    } catch (error) {
      next(error);
    }
  }

  async getApprovers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const level = parseInt(req.params.level);
      if (isNaN(level)) {
        throw new ApiError("Invalid approval level", 400);
      }
      const approvers = await this.userService.getApprovers(level);
      res.json({
        status: "success",
        data: approvers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUsersByRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Check if user has permission to view users
      if (!req.user.permissions?.includes("VIEW_USERS")) {
        throw new ApiError("Unauthorized to view users", 403);
      }

      const { roleId } = req.params;
      const users = await this.userService.getUsersByRole(roleId);
      res.json({
        status: "success",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const sessions = await this.userService.getUserSessions(userId);
      res.json({
        status: "success",
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  async invalidateAllSessions(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user.id;
      const currentSessionId = req.session?.id;
      if (!currentSessionId) {
        throw new ApiError("No active session found", 400);
      }

      await this.userService.invalidateAllSessions(userId, currentSessionId);
      res.json({
        status: "success",
        message: "All other sessions have been invalidated",
      });
    } catch (error) {
      next(error);
    }
  }

  async getAssignedRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { page = 1, limit = 10, status, type, priority } = req.query;

      // Parse query parameters and ensure arrays are string[]
      const toStringArray = (input: any): string[] | undefined => {
        if (!input) return undefined;
        return (Array.isArray(input) ? input : [input]).map(String);
      };

      const queryParams = {
        page: parseInt(page as string) || 1,
        limit: Math.min(parseInt(limit as string) || 10, 50), // Max 50 items per page
        status: toStringArray(status),
        type: toStringArray(type),
        priority: toStringArray(priority),
      };

      const result = await this.userService.getAssignedRequests(
        userId,
        queryParams
      );

      return res.status(200).json({
        success: true,
        message: "Assigned requests retrieved successfully",
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      logger.error("Error getting assigned requests:", error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      next(error);
    }
  }

  async getInitiatedRequests(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user.id;
      const requests = await this.userService.getInitiatedRequests(userId);
      res.json({
        status: "success",
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  async getApprovedRequests(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const userId = req.user.id;
      const requests = await this.userService.getApprovedRequests(userId);
      res.json({
        status: "success",
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  async logoutUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const accessToken = req.headers.authorization?.split(" ")[1];

      if (!accessToken) {
        throw new ApiError("No access token provided", 400);
      }

      const result = await this.userService.logoutUser(userId, accessToken);
      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // Log to debug
      console.log("Refresh token request received");

      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ApiError("Refresh token is required", 400);
      }

      // Use the tokenService to refresh the access token
      const result = await this.userService.refreshUserToken(refreshToken);

      if (!result) {
        throw new ApiError("Invalid or expired refresh token", 401);
      }

      res.json({
        status: "success",
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
