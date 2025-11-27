import { redisClient } from '../../../config/redis';
import { Biodata, PrismaClient, Role, User, UserRole } from '@prisma/client';
import jwt, { SignOptions } from 'jsonwebtoken';
import env from '../../../config/env';
import logger from '../../../utils/logger';
import crypto from 'crypto';
import { TokenPayload, TokenPair, SessionMetadata } from '../interfaces/token.interface';
import { hash, compare } from 'bcrypt';

const prisma = new PrismaClient();

class TokenService {
    // Read expiry times from environment variables
    private readonly accessTokenExpiry = env.JWT_ACCESS_EXPIRY || '1h';
    private readonly refreshTokenExpiry = env.JWT_REFRESH_EXPIRY || '7d'; 
    
    // Redis prefixes consolidated
    private readonly redisKeyPrefix = 'auth:';
    private readonly blacklistPrefix = 'blacklist:';
    
    // Convert time string (e.g. '1h') to seconds for Redis
    private timeToSeconds(timeString: string): number {
        const units: Record<string, number> = {
            s: 1,
            m: 60,
            h: 60 * 60,
            d: 24 * 60 * 60
        };
        
        const match = timeString.match(/^(\d+)([smhd])$/);
        if (!match) return 3600; // Default to 1 hour if format is invalid
        
        const [, value, unit] = match;
        return parseInt(value) * (units[unit] || 1);
    }
    
    private getAccessTokenExpirySeconds(): number {
        return this.timeToSeconds(this.accessTokenExpiry);
    }
    
    private getRefreshTokenExpirySeconds(): number {
        return this.timeToSeconds(this.refreshTokenExpiry);
    }
    
    private getAccessTokenExpiryDate(): Date {
        return new Date(Date.now() + this.getAccessTokenExpirySeconds() * 1000);
    }
    
    private getRefreshTokenExpiryDate(): Date {
        return new Date(Date.now() + this.getRefreshTokenExpirySeconds() * 1000);
    }

    private generateTokenId(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private validateUser(user: any): void {
        if (!user?.id) {
            throw new Error('Invalid user object: missing id');
        }

        console.log("user from validate user", user)
        if (!user.roleAssignment) {
            throw new Error('User has no active roles');
        }
    }

    async generateTokenPair(user: any): Promise<TokenPair> {
        try {
            this.validateUser(user);

            const sessionId = this.generateTokenId();
            const accessTokenJti = this.generateTokenId();
            const refreshTokenJti = this.generateTokenId();

            if (!user.roleAssignment) {
                throw new Error('User role assignments are undefined');
            }
            const activeRole = user.roleAssignment.role;

            const payload: TokenPayload = {
                userId: user.id,
                biodataId: user.biodataId || null,
                role: {
                    name: activeRole.name,
                    permissions: activeRole.permissions || []
                },
                username: user.username || '',
                erpId: user.biodata?.erpId || null,
                sessionId,
                jti: accessTokenJti,
                roleAssignment: {
                    role: {
                        name: user.roleAssignment.role.name,
                        permissions: user.roleAssignment.role.permissions || []
                    }
                }
            };

            const accessToken = jwt.sign(
                payload,
                env.JWT_SECRET as string,
                { expiresIn: this.accessTokenExpiry } as SignOptions
            );

            const refreshToken = jwt.sign(
                { userId: user.id, sessionId, jti: refreshTokenJti },
                env.JWT_REFRESH_SECRET as string,
                { expiresIn: this.refreshTokenExpiry } as SignOptions
            );

            const sessionMetadata: SessionMetadata = {
                createdAt: Date.now(),
                lastActive: Date.now(),
                userAgent: global.userAgent || 'unknown',
                deviceInfo: global.deviceInfo,
                ipAddress: global.ipAddress
            };

            // Hash refresh token for database storage
            const hashedRefreshToken = await hash(refreshToken, 10);
            
            // Create or update Session record in database as source of truth
            const session = await prisma.session.upsert({
                where: {
                    userId_token: {
                        userId: user.id,
                        token: accessToken
                    }
                },
                create: {
                    userId: user.id,
                    deviceInfo: sessionMetadata.deviceInfo || 'unknown',
                    ipAddress: sessionMetadata.ipAddress || 'unknown',
                    userAgent: sessionMetadata.userAgent,
                    isActive: true,
                    token: accessToken,
                    refreshToken: hashedRefreshToken,
                    expiresAt: this.getAccessTokenExpiryDate(),
                    lastActive: new Date()
                },
                update: {
                    deviceInfo: sessionMetadata.deviceInfo || 'unknown',
                    ipAddress: sessionMetadata.ipAddress || 'unknown',
                    userAgent: sessionMetadata.userAgent,
                    lastActive: new Date(),
                    isActive: true,
                    refreshToken: hashedRefreshToken,
                    expiresAt: this.getAccessTokenExpiryDate()
                }
            });
            
            // Use Redis only as a secondary cache for blacklisting and performance
            await redisClient.setex(
                `${this.redisKeyPrefix}jti:${accessTokenJti}`,
                this.getAccessTokenExpirySeconds(),
                session.id
            );

            return {
                accessToken,
                refreshToken,
                expiresIn: this.getAccessTokenExpirySeconds(),
                session
            };
        } catch (error) {
            logger.error('Error generating token pair:', error);
            throw error;
        }
    }

    async refreshAccessToken(refreshToken: string): Promise<{ refreshToken: string, accessToken: string; expiresIn: number } | null> {
        try {
            // Verify the refresh token
            const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET as string) as {
                userId: string;
                sessionId: string;
                jti: string;
                exp?: number;
                iat?: number;
            };
            
            // Find the session in the database (source of truth)
            const session = await prisma.session.findFirst({
                where: {
                    userId: decoded.userId,
                    isActive: true,
                    isRevoked: false,
                    expiresAt: { gt: new Date() }
                }
            });
            
            if (!session) {
                return null;
            }
            
            // Verify refresh token hash matches
            const isValidToken = await compare(refreshToken, session.refreshToken || '');
            if (!isValidToken) {
                // Token doesn't match - possible theft attempt
                await this.invalidateSession(decoded.userId, decoded.sessionId);
                return null;
            }

            // Get user data to generate new access token
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                include: {
                    biodata: true,
                    roleAssignment: {
                        include: {
                            role: {
                                select: {
                                    name: true,
                                    permissions: true
                                }
                            }
                        }
                    }
                }
            });

            if (!user || !user.roleAssignment) {
                return null;
            }

            // Generate new token IDs
            const newAccessTokenJti = this.generateTokenId();
            const newRefreshTokenJti = this.generateTokenId();
            
            // Create new access token
            const accessToken = jwt.sign(
                {
                    userId: user.id,
                    username: user.username || '',
                    biodataId: user.biodataId,
                    erpId: user.biodata?.erpId || null,
                    role: {
                        name: user.roleAssignment.role.name,
                        permissions: user.roleAssignment.role.permissions
                    },
                    sessionId: decoded.sessionId,
                    jti: newAccessTokenJti
                },
                env.JWT_SECRET as string,
                { expiresIn: this.accessTokenExpiry } as SignOptions
            );
            
            // Create new refresh token (rotation)
            const newRefreshToken = jwt.sign(
                { userId: user.id, sessionId: decoded.sessionId, jti: newRefreshTokenJti },
                env.JWT_REFRESH_SECRET as string,
                { expiresIn: this.refreshTokenExpiry } as SignOptions
            );
            
            // Blacklist old refresh token
            await this.invalidateToken(refreshToken);
            
            // Hash new refresh token
            const hashedRefreshToken = await hash(newRefreshToken, 10);
            
            // Update session in database with new tokens
            await prisma.session.update({
                where: { id: session.id },
                data: {
                    token: accessToken,
                    refreshToken: hashedRefreshToken,
                    lastActive: new Date(),
                    expiresAt: this.getAccessTokenExpiryDate()
                }
            });
            
            // Update Redis cache for fast lookup
            await redisClient.setex(
                `${this.redisKeyPrefix}jti:${newAccessTokenJti}`,
                this.getAccessTokenExpirySeconds(),
                session.id
            );

            return {
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn: this.getAccessTokenExpirySeconds()
            };
        } catch (error) {
            logger.error('Error refreshing access token:', error);
            return null;
        }
    }

    async invalidateToken(token: string): Promise<void> {
        try {
            // Add to blacklist regardless of token type (access or refresh)
            const decoded = jwt.decode(token) as { jti: string; exp: number } | null;
            if (decoded?.jti) {
                const timeToExpiry = (decoded.exp * 1000) - Date.now();
                if (timeToExpiry > 0) {
                    // Add to blacklist in Redis for fast lookup during validation
                    await redisClient.setex(
                        `${this.blacklistPrefix}${decoded.jti}`,
                        Math.ceil(timeToExpiry / 1000),
                        '1'
                    );
                }
            }
        } catch (error) {
            logger.error('Error invalidating token:', error);
        }
    }

    async invalidateSession(userId: string, sessionId: string): Promise<void> {
        try {
            // Update session in database
            await prisma.session.updateMany({
                where: {
                    userId,
                    isActive: true
                },
                data: {
                    isActive: false,
                    isRevoked: true
                }
            });
            
            // Remove from Redis cache
            await redisClient.del(`${this.redisKeyPrefix}session:${userId}:${sessionId}`);
        } catch (error) {
            logger.error('Error invalidating session:', error);
        }
    }

    async invalidateAllUserSessions(userId: string): Promise<void> {
        try {
            // Update all sessions in database
            await prisma.session.updateMany({
                where: {
                    userId,
                    isActive: true
                },
                data: {
                    isActive: false,
                    isRevoked: true
                }
            });
            
            // Remove from Redis cache - use pattern matching
            const keys = await redisClient.keys(`${this.redisKeyPrefix}session:${userId}:*`);
            if (keys.length > 0) {
                await redisClient.del(...keys);
            }
        } catch (error) {
            logger.error('Error invalidating all user sessions:', error);
        }
    }

    async getActiveSessions(userId: string): Promise<any[]> {
        // Get active sessions directly from database
        const sessions = await prisma.session.findMany({
            where: {
                userId,
                isActive: true,
                isRevoked: false,
                expiresAt: { gt: new Date() }
            },
            orderBy: {
                lastActive: 'desc'
            }
        });
        
        return sessions;
    }

    async verifyToken(token: string): Promise<TokenPayload | null> {
        try {
            // Verify token signature
            const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
            
            // Check if token is blacklisted in Redis (for performance)
            if (decoded.jti) {
                const isBlacklisted = await redisClient.get(`${this.blacklistPrefix}${decoded.jti}`);
                if (isBlacklisted) {
                    return null;
                }
            }
            
            return decoded;
        } catch (error) {
            logger.error('Token verification failed:', error);
            return null;
        }
    }
    
    // Health check for Redis
    async checkRedisHealth(): Promise<boolean> {
        try {
            await redisClient.ping();
            return true;
        } catch (error) {
            logger.error('Redis health check failed:', error);
            return false;
        }
    }
}

export const tokenService = new TokenService();