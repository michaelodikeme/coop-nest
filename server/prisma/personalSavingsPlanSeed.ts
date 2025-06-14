import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function main() {
  console.log('Seeding personal savings plan types...');
  
  // First, delete existing plan types if needed
  // Uncomment this if you want to reset the table
  // await prisma.personalSavings.deleteMany({});
  // await prisma.personalSavingsPlan.deleteMany({});
  
  const planTypes = [
    {
      id: uuidv4(),
      name: "Emergency Fund",
      description: "Set aside money for unexpected financial emergencies like medical expenses, car repairs, etc.",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Vacation Fund",
      description: "Save money for your next vacation or travel adventure",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Education Fund",
      description: "Save for future education expenses for yourself or your children",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Home Purchase",
      description: "Save for a down payment on a home or property purchase",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Car Purchase",
      description: "Save for buying a new or used vehicle",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Wedding Fund",
      description: "Save for wedding expenses and celebrations",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Tech Upgrade",
      description: "Save for new technology purchases like computers, phones, etc.",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Medical Fund",
      description: "Save for planned medical procedures or healthcare expenses",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Home Renovation",
      description: "Save for home improvement and renovation projects",
      isActive: true
    },    
    {
      id: uuidv4(),
      name: "General Purpose",
      description: "A flexible savings plan for any purpose",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Children's Fund",
      description: "Save for your children's future needs and expenses",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Comodity Savings",
      description: "Save for purchasing commodities like food stuffs, and house hold equipment, etc.",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Fixed Savings",
      description: "Save a fixed amount regularly. This plan is ideal for those who want to save a specific amount anytime.",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Debt Repayment",
      description: "Save to pay off personal debts or loans",
      isActive: true
    },
    {
      id: uuidv4(),
      name: "Charity Fund",
      description: "Save to donate to charitable causes or organizations",
      isActive: true
    }
  ];

  console.log(`Creating ${planTypes.length} plan types...`);

  try {
    // Create plan types, skipping if name already exists
    for (const planType of planTypes) {
      const existingPlan = await prisma.personalSavingsPlan.findUnique({
        where: { name: planType.name },
      });

      if (!existingPlan) {
        await prisma.personalSavingsPlan.create({
          data: planType,
        });
        console.log(`Created plan type: ${planType.name}`);
      } else {
        console.log(`Plan type already exists: ${planType.name}`);
      }
    }

    const count = await prisma.personalSavingsPlan.count();
    console.log(`Personal savings plan types seeding completed: ${count} types total in database`);
  } catch (error) {
    console.error('Error seeding personal savings plan types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Allow the file to be run directly
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('Error during personal savings plan seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}