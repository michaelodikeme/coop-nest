import fs from 'fs';
import multer from 'multer';
import path from 'path';

const profilePhotoDir = path.join(__dirname, '..', '..', 'uploads', 'profile-photos');
if (!fs.existsSync(profilePhotoDir)) {
    fs.mkdirSync(profilePhotoDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profilePhotoDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `profile-${req.params.id}-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req: any, file: any, cb: any) => {
    // Check if file exists
    if (!file) {
        cb(new Error('No file uploaded'), false);
        return;
    }

    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Create multer instance for profile photos
export const profilePhotoUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 3 * 1024 * 1024, // 3MB limit
    },
}).single('profilePhoto');