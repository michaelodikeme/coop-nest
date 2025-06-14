export interface TokenPayload {
    userId: string;
    biodataId: string | null;
    username: string;
    erpId: string | null;
    sessionId: string;
    jti: string; // JWT ID for token tracking
    role: {
        name: string;
        permissions: string[];
    };
    roleAssignments?: Array<{
        role: {
            name: string;
            permissions: string[];
        }
    }>;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    session?: any;
}

export interface SessionMetadata {
    createdAt: number;
    lastActive: number;
    userAgent?: string;
    deviceInfo?: string;
    ipAddress?: string;
}
