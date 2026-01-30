import * as dotenv from 'dotenv'; // 1. Import dotenv
dotenv.config();
import { DEFAULT_ROLES } from '../src/types/permissions';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting smart database seeding...\n');

  try {
    // Step 1: Seed/Update Roles
    console.log('👥 Processing roles...');
    let rolesCreated = 0;
    let rolesUpdated = 0;

    for (const roleData of DEFAULT_ROLES) {
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name },
      });

      if (!existingRole) {
        await prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            permissions: [...roleData.permissions],
            approvalLevel: roleData.approvalLevel,
            canApprove: roleData.canApprove,
            moduleAccess: [...roleData.moduleAccess],
          },
        });
        rolesCreated++;
        console.log(`  ✅ Created role: ${roleData.name}`);
      } else {
        // Only update if there are actual changes
        const needsUpdate =
          JSON.stringify(existingRole.permissions) !== JSON.stringify(roleData.permissions) ||
          JSON.stringify(existingRole.moduleAccess) !== JSON.stringify(roleData.moduleAccess) ||
          existingRole.approvalLevel !== roleData.approvalLevel ||
          existingRole.canApprove !== roleData.canApprove;

        if (needsUpdate) {
          await prisma.role.update({
            where: { id: existingRole.id },
            data: {
              permissions: { set: roleData.permissions },
              moduleAccess: { set: roleData.moduleAccess },
              approvalLevel: roleData.approvalLevel,
              canApprove: roleData.canApprove,
              description: roleData.description,
            },
          });
          rolesUpdated++;
          console.log(`  🔄 Updated role: ${roleData.name}`);
        } else {
          console.log(`  ⏭️  Skipped role: ${roleData.name} (no changes)`);
        }
      }
    }

    console.log(`\n📊 Roles Summary: ${rolesCreated} created, ${rolesUpdated} updated\n`);

    // Step 2: Check/Create Super Admin
    console.log('👑 Processing super admin...');

    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        roleAssignment: {
          role: { name: 'SUPER_ADMIN' }
        }
      },
      include: {
        roleAssignment: {
          include: { role: true }
        },
        adminProfile: true
      }
    });

    if (!existingSuperAdmin) {
      const superAdminRole = await prisma.role.findUnique({
        where: { name: 'SUPER_ADMIN' }
      });

      if (!superAdminRole) {
        throw new Error('SUPER_ADMIN role not found. Run role seeding first.');
      }

      const user = await prisma.user.create({
        data: {
          username: 'superadmin',
          password: await bcrypt.hash('Admin@1234', 10),
          isActive: true,
          isMember: false,
          adminProfile: {
            create: {
              firstName: 'System',
              lastName: 'Administrator',
              emailAddress: 'admin@system.local',
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
            include: { role: true }
          },
          adminProfile: true
        }
      });

      console.log('  ✅ Created super admin user');
      console.log('  📝 Username: superadmin');
      console.log('  🔑 Password: Admin@1234');
      console.log('  ⚠️  IMPORTANT: Change this password after first login!\n');
    } else {
      console.log('  ⏭️  Super admin already exists');
      console.log(`  👤 Username: ${existingSuperAdmin.username}`);
      console.log(`  📧 Email: ${existingSuperAdmin.adminProfile?.emailAddress || 'N/A'}\n`);
    }

    console.log('✅ Smart seeding completed successfully!\n');

    // Summary
    console.log('📋 Database Summary:');
    const roleCount = await prisma.role.count();
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({
      where: {
        roleAssignment: {
          role: {
            name: { in: ['SUPER_ADMIN', 'CHAIRMAN', 'TREASURER', 'SECRETARY'] }
          }
        }
      }
    });

    console.log(`  - Total Roles: ${roleCount}`);
    console.log(`  - Total Users: ${userCount}`);
    console.log(`  - Admin Users: ${adminCount}`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
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