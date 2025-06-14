import fs from 'fs';
import multer from 'multer';
import path from 'path';

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const fileFilter = (req: any, file: any, cb: any) => {
    // Check if file exists
    if (!file) {
        cb(new Error('No file uploaded'), false);
        return;
    }

    if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'text/csv'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Only Excel and CSV files are allowed!'), false);
    }
};

// Create multer instance with specific field name
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
}).single('fileUpload'); // Explicitly specify the field name expected
