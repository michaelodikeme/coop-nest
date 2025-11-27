import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role.service';
import { ApiError } from '../../../utils/apiError';
import { z } from 'zod';

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
}

export class RoleController {
  private roleService: RoleService;

  constructor() {
    this.roleService = new RoleService();
  }

  /**
   * Get all roles
   * GET /roles
   */
  async getAllRoles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Check if user has permission to view roles
      if (!req.user.permissions?.includes('MANAGE_ROLES')) {
        throw new ApiError('Unauthorized to view roles', 403);
      }

      console.log('request getting here', req.user.permissions);

      const roles = await this.roleService.getRoles();

      res.json({
        status: 'success',
        data: roles
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Get role by ID
   * GET /roles/:id
   */
  async getRoleById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Check if user has permission to view roles
      if (!req.user.permissions?.includes('MANAGE_ROLES')) {
        throw new ApiError('Unauthorized to view roles', 403);
      }

      const { id } = req.params;
      const role = await this.roleService.findRoleById(id);

      res.json({
        status: 'success',
        data: role
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Get roles by approval level
   * GET /roles/by-level/:level
   */
  async getRolesByApprovalLevel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Check if user has permission to view roles
      if (!req.user.permissions?.includes('MANAGE_ROLES')) {
        throw new ApiError('Unauthorized to view roles', 403);
      }

      const level = parseInt(req.params.level);
      if (isNaN(level)) {
        throw new ApiError('Invalid approval level', 400);
      }

      const roles = await this.roleService.getRolesByApprovalLevel(level);

      res.json({
        status: 'success',
        data: roles
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Get approver roles for a specific level
   * GET /roles/approvers/:level
   */
  async getApproverRoles(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Check if user has permission to view roles
      if (!req.user.permissions?.includes('MANAGE_ROLES')) {
        throw new ApiError('Unauthorized to view roles', 403);
      }

      const level = parseInt(req.params.level);
      if (isNaN(level)) {
        throw new ApiError('Invalid approval level', 400);
      }

      const roles = await this.roleService.getApproverRoles(level);

      res.json({
        status: 'success',
        data: roles
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Create a new role
   * POST /roles
   */
  async createRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Check if user has permission to manage roles
      if (!req.user.permissions?.includes('MANAGE_ROLES')) {
        throw new ApiError('Unauthorized to create roles', 403);
      }

      // Only SUPER_ADMIN can create roles
      if (req.user.role.name !== 'SUPER_ADMIN') {
        throw new ApiError('Only SUPER_ADMIN can create roles', 403);
      }

      // Validate input
      const createRoleSchema = z.object({
        name: z.string().min(2, 'Role name must be at least 2 characters'),
        description: z.string().optional(),
        permissions: z.array(z.string()),
        approvalLevel: z.number().int().min(0).max(5),
        canApprove: z.boolean(),
        moduleAccess: z.array(z.string())
      });

      const validatedData = createRoleSchema.parse(req.body);
      const role = await this.roleService.createRole(validatedData);

      res.status(201).json({
        status: 'success',
        data: role
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Update a role
   * PUT /roles/:id
   */
  async updateRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Check if user has permission to manage roles
      if (!req.user.permissions?.includes('MANAGE_ROLES')) {
        throw new ApiError('Unauthorized to update roles', 403);
      }

      // Only SUPER_ADMIN can update roles
      if (req.user.role.name !== 'SUPER_ADMIN') {
        throw new ApiError('Only SUPER_ADMIN can update roles', 403);
      }

      const { id } = req.params;

      // Validate input
      const updateRoleSchema = z.object({
        description: z.string().optional(),
        permissions: z.array(z.string()).optional(),
        approvalLevel: z.number().int().min(0).max(5).optional(),
        canApprove: z.boolean().optional(),
        moduleAccess: z.array(z.string()).optional()
      });

      const validatedData = updateRoleSchema.parse(req.body);
      const role = await this.roleService.updateRole(id, validatedData);

      res.json({
        status: 'success',
        data: role
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Delete a role
   * DELETE /roles/:id
   */
  async deleteRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Check if user has permission to manage roles
      if (!req.user.permissions?.includes('MANAGE_ROLES')) {
        throw new ApiError('Unauthorized to delete roles', 403);
      }

      // Only SUPER_ADMIN can delete roles
      if (req.user.role.name !== 'SUPER_ADMIN') {
        throw new ApiError('Only SUPER_ADMIN can delete roles', 403);
      }

      const { id } = req.params;
      const result = await this.roleService.deleteRole(id);

      res.json({
        status: 'success',
        data: result
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}
