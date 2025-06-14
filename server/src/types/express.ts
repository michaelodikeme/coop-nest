import { Request } from 'express';

export interface AuthenticatedUser {
    id: string;
    biodataId: string;
    roles: Array<{
        name: string;
        isAdmin: boolean;
    }>;
    permissions: string[];
    approvalLevel: number;
    isAdmin: boolean;
    username: string;
    erpId?: string | null;
    sessionId: string;
    tokenJti: string;
}

export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}

// Add proper type declarations for global variables used throughout the app
declare global {
    var userAgent: string | undefined;
    var deviceInfo: string | undefined;
    var ipAddress: string | undefined;
    
    namespace NodeJS {
        interface Global {
            userAgent: string | undefined;
            deviceInfo: string | undefined;
            ipAddress: string | undefined;
        }
    }
}

export {};