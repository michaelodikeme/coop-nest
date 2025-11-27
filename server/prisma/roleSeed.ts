import { DEFAULT_ROLES } from '../src/types/permissions';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  try {
    // Create default roles
    for (const roleData of DEFAULT_ROLES) {
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        await prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            permissions: [...roleData.permissions], // Ensure array is properly spread
            approvalLevel: roleData.approvalLevel,
            canApprove: roleData.canApprove,
            moduleAccess: [...roleData.moduleAccess], // Ensure array is properly spread
          },
        });
        console.log(`Created role: ${roleData.name}`);
      } else {
        // Update existing role with force refresh
        await prisma.role.update({
          where: { id: existingRole.id },
          data: {
            permissions: {
              set: roleData.permissions // Use set to force update
            },
            moduleAccess: {
              set: roleData.moduleAccess
            },
            approvalLevel: roleData.approvalLevel,
            canApprove: roleData.canApprove,
          },
        });
        console.log(`Updated role: ${roleData.name}`);
      }
    }

    // Create initial super admin user if none exists
    const superAdminEmail = 'admin@system.local';
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        roleAssignment: {
          role: {
            name: 'SUPER_ADMIN'
          }
        }
      },
      include: {
        roleAssignment: {
          include: {
            role: true
          }
        },
        adminProfile: true
      }
    });

    if (!existingSuperAdmin) {
      const superAdminRole = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' }
      });

      if (!superAdminRole) {
        throw new Error('SUPER_ADMIN role not found');
      }

      // Create super admin user with all required fields
      const user = await prisma.user.create({
        data: {
          username: 'superadmin',
          password: await bcrypt.hash('Admin@1234', 10),
          isActive: true,
          isMember: false, // Super admin is not a member
          adminProfile: {
            create: {
              firstName: 'System',
              lastName: 'Administrator',
              emailAddress: superAdminEmail,
              phoneNumber: '00000000000',
              department: 'System Administration',
              staffId: 'SA001',
              position: 'Super Admin',
              isVerified: true,
              isActive: true
            }
          },
          roleAssignment: {
            create: {
              roleId: superAdminRole.id,
              isActive: true,
              assignedAt: new Date()
            }
          }
        },
        include: {
          roleAssignment: {
            include: {
              role: true
            }
          },
          adminProfile: true
        }
      });

      console.log('Created super admin user:', {
        data: user,
        username: user.username,
        role: user.roleAssignment?.role?.name || 'No role'
      });
    } else {
      console.log('Super admin user already exists');
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error during database seeding:', error);
    throw error;
  }
}

export { main };

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}