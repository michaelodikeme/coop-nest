import { Router } from 'express';
import { ConfigurationController } from '../controllers/shares.controller';
import { validateRequest } from '../../../middlewares/validateRequest';
import { updateShareAmountSchema } from '../validations/shares.validation';
import { 
    authenticateUser, 
    checkPermission, 
    checkApprovalLevel,
    authorizeRoles 
} from '../../../middlewares/auth';

const router = Router();
const configController = new ConfigurationController();

router.use(authenticateUser);

router.get(
    '/share-amount',
    authorizeRoles(['CHAIRMAN', 'SUPER_ADMIN']),
    checkPermission('VIEW_SHARES_CONFIG'),
    configController.getDefaultShareAmount.bind(configController)
);

router.patch(
    '/share-amount',
    validateRequest(updateShareAmountSchema),
    checkPermission('MANAGE_SHARE_AMOUNT'),
    checkApprovalLevel(3), // Requires highest approval level
    configController.updateDefaultShareAmount.bind(configController)
);

export default router;