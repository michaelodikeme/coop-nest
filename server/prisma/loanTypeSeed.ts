import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Delete in correct order to handle foreign key constraints
    // await prisma.loanSchedule.deleteMany({});
    // await prisma.loanRepayment.deleteMany({});
    // await prisma.loan.deleteMany({});
    // await prisma.loanType.deleteMany({});

    const loanTypes = [
        {
            name: 'Soft Loan',
            description: 'Short-term loan with 1-6 months duration. 10% monthly interest rate. No savings-based limit on amount.',
            interestRate: 0.10,
            minDuration: 1,
            maxDuration: 6,
            maxLoanAmount: 500000
        },
        {
            name: 'Regular Loan (1 Year)',
            description: '12-month loan with 10% annual interest rate. Maximum amount is 3x your total savings.',
            interestRate: 0.10,
            minDuration: 1,
            maxDuration: 12,
            maxLoanAmount: 0
        },
        {
            name: 'Regular Loan (1 Year Plus)',
            description: 'Long-term loan (13-36 months) with 15% annual interest rate. Maximum amount is 3x your total savings.',
            interestRate: 0.15,
            minDuration: 13,
            maxDuration: 36,
            maxLoanAmount: 0
        }
    ];

    for (const loanType of loanTypes) {
        await prisma.loanType.create({
            data: loanType
        });
    }

    console.log('Loan types seeded successfully');
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