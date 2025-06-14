import { PrismaClient } from '@prisma/client';
import { PERMISSIONS, DEFAULT_ROLES } from '../types/permissions';
import logger from './logger';

export class PermissionSyncService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async syncPermissions() {
        logger.info('Starting permissions sync...');
        
        try {
            // Validate permissions first
            const validPermissionNames = PERMISSIONS.map(p => p.name);
            
            // Sync roles and their permissions
            for (const roleData of DEFAULT_ROLES) {
                // Validate that all permissions in role exist in PERMISSIONS
                const invalidPermissions = roleData.permissions.filter(
                    p => !validPermissionNames.includes(p)
                );
                
                if (invalidPermissions.length > 0) {
                    logger.warn(`Invalid permissions found for role ${roleData.name}:`, invalidPermissions);
                }

                const existingRole = await this.prisma.role.findFirst({
                    where: { name: roleData.name }
                });

                if (!existingRole) {
                    // Create new role
                    await this.prisma.role.create({
                        data: {
                            name: roleData.name,
                            description: roleData.description || '',
                            permissions: roleData.permissions,
                            approvalLevel: roleData.approvalLevel,
                            canApprove: roleData.canApprove || false,
                            moduleAccess: roleData.moduleAccess,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        }
                    });
                    logger.info(`Created new role: ${roleData.name}`);
                } else {
                    // Update existing role
                    await this.prisma.role.update({
                        where: { id: existingRole.id },
                        data: {
                            description: roleData.description,
                            permissions: {
                                set: roleData.permissions
                            },
                            moduleAccess: {
                                set: roleData.moduleAccess
                            },
                            approvalLevel: roleData.approvalLevel,
                            canApprove: roleData.canApprove || false,
                            updatedAt: new Date()
                        }
                    });
                    // logger.info(`Updated role: ${roleData.name}`);

                    // Update existing role assignments if approval level changed
                    if (existingRole.approvalLevel !== roleData.approvalLevel) {
                        await this.prisma.userRole.updateMany({
                            where: {
                                roleId: existingRole.id,
                                isActive: true
                            },
                            data: {}
                        });
                        logger.info(`Updated role assignments for: ${roleData.name}`);
                    }
                }
            }

            logger.info('Permission sync completed successfully');
        } catch (error) {
            logger.error('Permission sync failed:', error);
            throw error;
        }
    }

    // Helper method to validate permissions
    private validatePermissions(permissions: string[]): boolean {
        const validPermissions = PERMISSIONS.map(p => p.name);
        return permissions.every(p => validPermissions.includes(p));
    }
}