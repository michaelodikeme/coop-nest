import { Request, Response, NextFunction } from 'express';
import { SystemSettingsService } from '../services/systemSettings.service';
import { ApiResponse } from '../../../utils/apiResponse';
import { ApiError } from '../../../utils/apiError';

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

export class ConfigurationController {
    private systemSettings: SystemSettingsService;

    constructor() {
        // Use getInstance instead of new
        this.systemSettings = SystemSettingsService.getInstance();
    }

    async updateDefaultShareAmount(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { amount, reason } = req.body;
            
            if (!req.user) {
                throw new ApiError('Unauthorized', 401);
            }

            const setting = await this.systemSettings.updateSetting(
                'DEFAULT_SHARE_AMOUNT',
                amount,
                req.user.id,
                reason
            );

            return ApiResponse.success(res, 'Default share amount updated successfully', {
                key: setting.key,
                value: JSON.parse(setting.value),
                updatedAt: setting.updatedAt
            });
        } catch (error) {
            next(error);
        }
    }

    async getDefaultShareAmount(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const amount = await this.systemSettings.getSetting<number>('DEFAULT_SHARE_AMOUNT');
            return ApiResponse.success(res, 'Default share amount retrieved', { amount });
        } catch (error) {
            next(error);
        }
    }
}