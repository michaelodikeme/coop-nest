import { Router } from 'express';
import { BiodataController } from '../controllers/biodata.controller';
import { BiodataBackupController } from '../controllers/biodataBackup.controller';
import { BiodataUploadController } from '../controllers/biodataUpload.controller';
import { BiodataApprovalController } from '../controllers/biodataApproval.controller';
import { BiodataVerificationController } from '../controllers/biodataVerification.controller';
import { 
    authorizeRoles, 
    checkPermission, 
    authenticateUser, 
    checkModuleAccess, 
    checkApprovalLevel 
} from '../../../middlewares/auth';
import { upload } from '../../../utils/upload';
// Import the profilePhotoUpload middleware
import { profilePhotoUpload } from '../../../utils/imageUpload';

const router = Router();
const biodataController = new BiodataController();
const uploadController = new BiodataUploadController();
const approvalController = new BiodataApprovalController();
const verificationController = new BiodataVerificationController();
const biodataBackupController = new BiodataBackupController();

// Verification routes
router.post('/verify', verificationController.verifyBiodata.bind(verificationController));
router.post('/verify-otp', verificationController.verifyPhoneOtp.bind(verificationController));
router.post('/register', biodataController.createNewMember.bind(biodataController));

// Protected routes - requires authentication
router.use(authenticateUser);

// Regular biodata routes //
// Public routes (require only authentication)
router.get('/',
    checkPermission('VIEW_MEMBERS'),
    authorizeRoles(['ADMIN', 'CHAIRMAN', 'SUOER_ADMIN']),
    biodataController.getBiodata.bind(biodataController)
);
router.get('/:id', 
    checkPermission('VIEW_MEMBERS'),
    biodataController.getBiodataById.bind(biodataController)
);

// Member and account info routes
router.post('/:id/account-info', 
    biodataController.addAccountInfo.bind(biodataController)
);

// Admin routes
router.post('/', 
    authorizeRoles(['ADMIN', 'CHAIRMAN', 'SUOER_ADMIN']),
    // checkApprovalLevel(1), 
    checkPermission('CREATE_MEMBERS'),
    biodataController.createBiodata.bind(biodataController)
);
router.put('/:id', 
    checkPermission('EDIT_MEMBERS'),
    checkModuleAccess('MEMBERS'),
    biodataController.updateBiodata.bind(biodataController)
);
router.delete('/:id', 
    authorizeRoles(['ADMIN']), 
    biodataController.deleteBiodata.bind(biodataController)
);

// Biodata Membership Routes
// Verification and approval routes
router.post('/member/verify', 
    authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']), 
    verificationController.verifyBiodata.bind(verificationController)
);

// Get unapproved biodata - requires treasurer level or higher
router.get('/member/unapproved',
    authorizeRoles(['TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
    checkApprovalLevel(2),
    biodataController.getUnapprovedBiodata.bind(biodataController)
);

router.post('/member/approve', 
    authorizeRoles(['TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']), 
    biodataController.approveBiodata.bind(biodataController)
);
router.post('/member/:id/status', 
    authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']), 
    biodataController.updateMembershipStatus.bind(biodataController)
);

// Upload routes - Treasurer level (2) and above required
router.post('/upload',
    authorizeRoles(['ADMIN', 'TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
    // checkApprovalLevel(3),
    upload,
    uploadController.uploadBiodata.bind(uploadController)
);

router.get('/upload/:requestId/status',
    authorizeRoles(['TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
    checkApprovalLevel(2),
    uploadController.checkUploadStatus.bind(uploadController)
);

router.post('/upload/:requestId/cancel',
    authorizeRoles(['TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
    checkApprovalLevel(2),
    uploadController.cancelUpload.bind(uploadController)
);

// Approval routes - Chairman level (3) required
router.post('/upload/:requestId/approve',
    authorizeRoles(['CHAIRMAN', 'SUPER_ADMIN']),
    checkApprovalLevel(3),
    approvalController.approveBiodataUpload.bind(approvalController)
);

router.post('/upload/:requestId/reject',
    authorizeRoles(['CHAIRMAN', 'SUPER_ADMIN']),
    checkApprovalLevel(3),
    approvalController.rejectBiodataUpload.bind(approvalController)
);

// Request management routes - Treasurer and Chairman
router.get('/upload/requests',
    authorizeRoles(['TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
    checkApprovalLevel(2),
    approvalController.getUploadRequests.bind(approvalController)
);

router.get('/upload/requests/:requestId',
    authorizeRoles(['TREASURER', 'CHAIRMAN', 'SUPER_ADMIN']),
    checkApprovalLevel(2),
    approvalController.getUploadRequestDetails.bind(approvalController)
);

// Backup routes
router.get('/backup/export',
    authorizeRoles(['ADMIN', 'CHAIRMAN']),
    checkPermission('VIEW_MEMBERS'),
    biodataBackupController.exportBiodata.bind(biodataBackupController)
);

// Upload/update profile photo
router.post('/:id/profile-photo', 
  authenticateUser,
  profilePhotoUpload,
  biodataController.updateProfilePhoto.bind(biodataController)
);

export default router;