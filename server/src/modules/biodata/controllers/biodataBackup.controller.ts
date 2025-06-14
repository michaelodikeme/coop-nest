import { Request, Response, NextFunction } from 'express';
import { BiodataBackupService } from '../services/biodataBackup.service';
import { ApiError } from '../../../utils/apiError';
import path from 'path';
import * as fs from 'fs';

export class BiodataBackupController {
    private backupService: BiodataBackupService;

    constructor() {
        this.backupService = new BiodataBackupService();
    }

    async exportBiodata(req: Request, res: Response, next: NextFunction) {
        try {
            const filepath = await this.backupService.exportBiodataToExcel();
            
            res.download(filepath, path.basename(filepath), (err) => {
                if (err) {
                    console.error('Download error:', err);
                }
                // Clean up file after download
                fs.unlink(filepath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting temporary file:', unlinkErr);
                    }
                });
            });
        } catch (error) {
            next(error);
        }
    }
}