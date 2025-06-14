import { faker } from '@faker-js/faker';
import { PrismaClient, MembershipStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface BiodataCreateInput {
  id: string;
  erpId: string;
  ippisId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  dateOfEmployment: Date;
  department: string;
  staffNo: string;
  residentialAddress: string;
  emailAddress: string;
  phoneNumber: string;
  nextOfKin: string;
  relationshipOfNextOfKin: string;
  nextOfKinPhoneNumber: string;
  nextOfKinEmailAddress: string;
  profilePhoto: string;
  isVerified: boolean;
  isApproved: boolean;
  isDeleted: boolean;
  membershipStatus?: MembershipStatus;
}

function generateUniqueId(): string {
  return faker.string.uuid();
}

function generateNigerianPhoneNumber(): string {
  // Generate first digit (7,8,9)
  const firstDigit = faker.helpers.arrayElement(['7', '8', '9']);
  // Generate second digit (0,1)
  const secondDigit = faker.helpers.arrayElement(['0', '1']);
  // Generate remaining 8 digits
  const remainingDigits = faker.string.numeric(8);
  
  // Return in international format (+234)
  return `+234${firstDigit}${secondDigit}${remainingDigits}`;
}

async function seedBiodata(count: number = 1): Promise<void> {
  try {
    // First, delete all Transaction records that reference Biodata
    // await prisma.transaction.deleteMany({});

    // Then, delete all Biodata records
    // await prisma.biodata.deleteMany();

    const departments = [
      'Finance', 'Human Resources', 'Information Technology', 
      'Operations', 'Research', 'Administration', 'Marketing'
    ];

    const biodataEntries: BiodataCreateInput[] = [];
    const uniqueIppisIds = new Set<string>();

    for (let i = 0; i < count; i++) {
      const id = generateUniqueId();
      let ippisId: string;

      // Generate a unique ippisId
      do {
        ippisId = `IP${faker.string.numeric(4)}`;
      } while (uniqueIppisIds.has(ippisId));
      uniqueIppisIds.add(ippisId);

      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const middleName = Math.random() > 0.3 ? faker.person.firstName() : undefined; // 70% chance of having a middle name
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

      biodataEntries.push({
        id,
        erpId: `ERP${faker.string.numeric(5)}`,
        ippisId: ippisId,
        firstName,
        middleName,
        lastName,
        fullName,
        dateOfEmployment: faker.date.past({ years: 5 }),
        department: faker.helpers.arrayElement(departments),
        staffNo: `STAFF${faker.string.numeric(5)}`,
        residentialAddress: faker.location.streetAddress({ useFullAddress: true }),
        emailAddress: faker.internet.email().toLowerCase(),
        phoneNumber: generateNigerianPhoneNumber(),
        nextOfKin: faker.person.fullName(),
        relationshipOfNextOfKin: faker.helpers.arrayElement([
          'Spouse', 'Parent', 'Sibling', 'Child', 'Friend'
        ]),
        nextOfKinPhoneNumber: generateNigerianPhoneNumber(),
        nextOfKinEmailAddress: faker.internet.email().toLowerCase(),
        profilePhoto: faker.image.avatar(),
        isVerified: faker.helpers.arrayElement([false]),
        isApproved: faker.helpers.arrayElement([false]),
        isDeleted: false,
        membershipStatus: MembershipStatus.PENDING,
      });
    }

    // Log the first entry for debugging
    console.log('Sample Biodata Entry:', biodataEntries[0]);

    // Insert data in chunks to prevent memory issues
    const chunkSize = 50;
    for (let i = 0; i < biodataEntries.length; i += chunkSize) {
      const chunk = biodataEntries.slice(i, i + chunkSize);
      await prisma.$transaction(
        chunk.map(biodata => 
          prisma.biodata.create({ 
            data: biodata,
          })
        )
      );
      console.log(`Processed entries ${i + 1} to ${Math.min(i + chunkSize, biodataEntries.length)}`);
    }

    console.log(`Successfully seeded ${count} biodata entries!`);
  } catch (error) {
    console.error('Error seeding biodata:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedBiodata(100); // Seed 100 biodata entries
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute main function if script is run directly
if (require.main === module) {
  main();
}

export { seedBiodata };