import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { LoanCalculationResult, PaymentScheduleEntry } from '../interfaces/loan-calculation.interface';
import { ApiError } from '../../../utils/apiError';
import { prisma } from '../../../utils/prisma';

export class CalculatorService {


    constructor() {
    }

    async calculateLoan(
        loanTypeId: string,
        amount: number,
        tenure: number,
        biodataId?: string // Make biodataId optional
    ): Promise<LoanCalculationResult> {


        const loanType = await prisma.loanType.findUnique({
            where: { id: loanTypeId }
        });



        if (!loanType) {
            throw new ApiError('Loan type not found', 404);
        }

        if (!loanType.isActive) {
            throw new ApiError('Selected loan type is not currently active', 400);
        }

        console.log("loan calculator", {loanTypeId, amount, tenure
        }, loanType)
        const loanAmount = new Decimal(amount);

        // Validate tenure
        if (tenure < loanType.minDuration || tenure > loanType.maxDuration) {
            throw new ApiError(
                `Loan tenure must be between ${loanType.minDuration} and ${loanType.maxDuration} months`,
                400
            );
        }

        // For regular loans, validate against savings only if biodataId is provided
        let validation;
        if (biodataId) {
            validation = await this.validateLoanAmount(loanType, loanAmount, biodataId);
        } else {
            // For admins or when biodataId is not provided
            validation = this.validateLoanAmountWithoutSavings(loanType, loanAmount);
        }

        if (!validation.isValid) {
            throw new ApiError(validation.reason!, 400);
        }

        const interestRate = loanType.interestRate;

        // Determine if this is a soft loan based on max duration
        const isSoftLoan = loanType.maxDuration <= 6;

        // Calculate monthly interest rate based on loan type
        // let monthlyInterestRate: Decimal = interestRate;
        // if (isSoftLoan) {
        //     // Soft loans: 10% monthly interest (as per business rules)
        //     monthlyInterestRate = interestRate;
        // } else {
        //     // Regular loans: annual rate divided by 12
        //     // monthlyInterestRate = interestRate.div(12);
        //     monthlyInterestRate = interestRate.div(tenure);
        // }

        let monthlyPayment: Decimal;
        let totalInterest: Decimal;

        if (isSoftLoan) {
            // For soft loans: simple interest calculation
            // Total interest = Principal × Monthly Rate × Tenure
            totalInterest = loanAmount.mul(interestRate).mul(tenure);

            console.log("totalInterest", totalInterest);
            // Monthly payment = (Principal + Total Interest) / Tenure
            monthlyPayment = loanAmount.add(totalInterest).div(tenure);
            console.log("monthlyPayment", monthlyPayment);
        } else {
            // For regular loans: annual interest rate applied once
            // Total interest = Principal × Annual Rate
            totalInterest = loanAmount.mul(interestRate);
            // Monthly payment = (Principal + Total Interest) / Tenure
            monthlyPayment = loanAmount.add(totalInterest).div(tenure);
        }

        // Generate amortization schedule
        const schedule: PaymentScheduleEntry[] = [];
        let remainingBalance = loanAmount;

        // Calculate monthly principal and interest for the schedule
        const monthlyPrincipal = loanAmount.div(tenure);
        const monthlyInterest = totalInterest.div(tenure);

        for (let month = 1; month <= tenure; month++) {
            let principalPayment = monthlyPrincipal;
            let interestPayment = monthlyInterest;

            // Adjust final payment for rounding
            if (month === tenure) {
                // Ensure the final payment clears the remaining balance
                principalPayment = remainingBalance;
            }

            remainingBalance = remainingBalance.minus(principalPayment);

            schedule.push({
                paymentNumber: month,
                paymentDate: this.calculatePaymentDate(month),
                principalAmount: principalPayment,
                interestAmount: interestPayment,
                totalPayment: principalPayment.add(interestPayment),
                remainingBalance: remainingBalance.lt(0) ? new Decimal(0) : remainingBalance
            });
        }

        return {
            loanAmount,
            interestRate,
            totalInterest,
            totalRepayment: loanAmount.add(totalInterest),
            monthlyPayment,
            tenure,
            schedule,
            isSoftLoan,
            maxEligibleAmount: validation.maxAmount,
            loanType: {
                id: loanType.id,
                name: loanType.name,
                description: loanType.description,
                interestRate: loanType.interestRate,
                minDuration: loanType.minDuration,
                maxDuration: loanType.maxDuration,
                maxLoanAmount: loanType.maxLoanAmount,
                savingsMultiplier: loanType.savingsMultiplier,
            },
        };
    }

    private calculatePMT(principal: Decimal, monthlyRate: Decimal, periods: number): Decimal {
        // PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
        const onePlusRate = monthlyRate.add(1);
        const rateFactorPower = onePlusRate.pow(periods);
        const numerator = monthlyRate.mul(rateFactorPower);
        const denominator = rateFactorPower.minus(1);

        return principal.mul(numerator.div(denominator));
    }

    private calculatePaymentDate(monthOffset: number): Date {
        const date = new Date();
        date.setMonth(date.getMonth() + monthOffset);
        date.setDate(1); // Set to first of the month
        return date;
    }

    private validateLoanAmountWithoutSavings(
        loanType: any,
        amount: Decimal
    ): { isValid: boolean; maxAmount: Decimal; reason?: string } {
        // For soft loans
        if (loanType.maxDuration <= 6) {
            const isValid = amount.lte(loanType.maxLoanAmount);
            return {
                isValid,
                maxAmount: new Decimal(loanType.maxLoanAmount),
                reason: isValid ? undefined : `Loan amount exceeds maximum of ₦${loanType.maxLoanAmount.toLocaleString()}`
            };
        }

        // For regular loans without savings check
        return {
            isValid: true,
            maxAmount: new Decimal(Number.MAX_SAFE_INTEGER), // Or any suitable maximum value
            reason: undefined
        };
    }

    private async validateLoanAmount(
        loanType: any,
        amount: Decimal,
        biodataId: string
    ): Promise<{ isValid: boolean; maxAmount: Decimal; reason?: string }> {
        // For soft loans, just check against maxLoanAmount
        if (loanType.maxDuration <= 6) {
            const isValid = amount.lte(loanType.maxLoanAmount);
            return {
                isValid,
                maxAmount: new Decimal(loanType.maxLoanAmount),
                reason: isValid ? undefined : 
                    `Loan amount exceeds maximum of ₦${loanType.maxLoanAmount.toNumber().toLocaleString()}`
            };
        }

        // For regular loans, get total savings amount
        const latestSavings = await prisma.savings.findFirst({
            where: { 
                memberId: biodataId,
                status: 'ACTIVE'
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ],
            select: { 
                totalSavingsAmount: true,
                balance: true,
                status: true
            }
        });

        if (!latestSavings) {
            return {
                isValid: false,
                maxAmount: new Decimal(0),
                reason: 'No active savings record found. Cannot calculate loan eligibility.'
            };
        }

        if (latestSavings.status !== 'ACTIVE') {
            return {
                isValid: false,
                maxAmount: new Decimal(0),
                reason: 'Savings account is not active. Cannot proceed with loan application.'
            };
        }

        // Use totalSavingsAmount for loan calculation
        const effectiveBalance = latestSavings.totalSavingsAmount;
        const maxAmount = effectiveBalance.mul(loanType.savingsMultiplier);
        const isValid = amount.lte(maxAmount);

        // Enhanced error message with more details
        const errorMessage = !isValid ? 
            `Requested amount (₦${amount.toNumber().toLocaleString()}) exceeds maximum eligible amount of ₦${maxAmount.toNumber().toLocaleString()}:\n` +
            `- Total Savings Balance: ₦${effectiveBalance.toNumber().toLocaleString()}\n` +
            `- Multiplier: ${loanType.savingsMultiplier}x\n` +
            `- Maximum Eligible: ₦${maxAmount.toNumber().toLocaleString()}`
            : undefined;

        return {
            isValid,
            maxAmount,
            reason: errorMessage
        };
    }
}

export default new CalculatorService();
