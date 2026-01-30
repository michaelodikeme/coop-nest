import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { EligibilityCheckResult, LoanTypeConflictCheck } from '../interfaces/loan-calculation.interface';
import { ApiError } from '../../../utils/apiError';
import { prisma } from '../../../utils/prisma';

interface FormattedResponse {
    success: boolean;
    data: {
        isEligible: boolean;
        maxAmount: string;
        formattedMaxAmount: string;
        reason?: string;
        savingsBalance?: string;
        formattedSavingsBalance?: string;
        loanTypeDetails?: {
            name: string;
            interestRate: number;
            duration: {
                min: number;
                max: number;
            }
        };
        activeLoans: {
            hasSoftLoan: boolean;
            hasRegularLoan: boolean;
            hasOneYearPlusLoan: boolean;
        };
    };
}

export class EligibilityService {


    constructor() {

    }

    private async checkCrossLoanTypeRestrictions(
        biodataId: string,
        loanTypeId: string
    ): Promise<LoanTypeConflictCheck> {
        // Get the requested loan type information
        const requestedLoanType = await prisma.loanType.findUnique({
            where: { id: loanTypeId }
        });

        if (!requestedLoanType) {
            throw new ApiError('Loan type not found', 404);
        }

        // Fetch active loans for the member
        const activeLoans = await prisma.loan.findMany({
            where: {
                memberId: biodataId,
                status: { in: ['ACTIVE', 'APPROVED', 'PENDING', 'DISBURSED'] }
            },
            include: {
                loanType: true
            }
        });

        // Check for loan type restrictions
        const isRegularLoan = requestedLoanType.name.toLowerCase().includes('regular');
        const isOneYearPlusLoan = requestedLoanType.name.toLowerCase().includes('1 year plus') || 
                                requestedLoanType.name.toLowerCase().includes('one year plus');
        const isSoftLoan = requestedLoanType.name.toLowerCase().includes('soft');

        // Check if member has conflicting loan types
        const hasActiveRegularLoan = activeLoans.some(loan => 
            loan.loanType.name.toLowerCase().includes('regular')
        );
        
        const hasActiveOneYearPlusLoan = activeLoans.some(loan => 
            loan.loanType.name.toLowerCase().includes('1 year plus') || 
            loan.loanType.name.toLowerCase().includes('one year plus')
        );

        const hasActiveSoftLoan = activeLoans.some(loan =>
            loan.loanType.name.toLowerCase().includes('soft')
        );

        // Apply restriction logic for Soft Loans
        if (isSoftLoan && hasActiveSoftLoan) {
            return {
                hasConflict: true,
                errorMessage: 'Cannot apply for a Soft loan when you already have an active Soft loan',
                loanTypeInfo: {
                    isRegularLoan,
                    isOneYearPlusLoan,
                    isSoftLoan,
                    hasActiveRegularLoan,
                    hasActiveOneYearPlusLoan,
                    hasActiveSoftLoan
                }
            };
        }

        // Apply restriction logic for Regular Loans
        if (isRegularLoan && hasActiveOneYearPlusLoan) {
            return {
                hasConflict: true,
                errorMessage: 'Cannot apply for a Regular loan when you have an active 1 Year Plus loan',
                loanTypeInfo: {
                    isRegularLoan,
                    isOneYearPlusLoan,
                    isSoftLoan,
                    hasActiveRegularLoan,
                    hasActiveOneYearPlusLoan,
                    hasActiveSoftLoan
                }
            };
        }

        // Apply restriction logic for One Year Plus Loans
        if (isOneYearPlusLoan && hasActiveRegularLoan) {
            return {
                hasConflict: true,
                errorMessage: 'Cannot apply for a 1 Year Plus loan when you have an active Regular loan',
                loanTypeInfo: {
                    isRegularLoan,
                    isOneYearPlusLoan,
                    isSoftLoan,
                    hasActiveRegularLoan,
                    hasActiveOneYearPlusLoan,
                    hasActiveSoftLoan
                }
            };
        }

        // Enforce single regular loan rule
        if (isRegularLoan && hasActiveRegularLoan) {
            return {
                hasConflict: true,
                errorMessage: 'Cannot apply for another Regular loan when you have an active Regular loan',
                loanTypeInfo: {
                    isRegularLoan,
                    isOneYearPlusLoan,
                    isSoftLoan,
                    hasActiveRegularLoan,
                    hasActiveOneYearPlusLoan,
                    hasActiveSoftLoan
                }
            };
        }

        return {
            hasConflict: false,
            loanTypeInfo: {
                isRegularLoan,
                isOneYearPlusLoan,
                isSoftLoan,
                hasActiveRegularLoan,
                hasActiveOneYearPlusLoan,
                hasActiveSoftLoan
            }
        };
    }

    private async getMemberSavingsSummary(biodataId: string): Promise<{
        totalSavingsAmount: Decimal;
        totalGrossAmount: Decimal;
        balance: Decimal;
        monthlyTarget: Decimal;
    }> {
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
                balance: true,
                totalSavingsAmount: true,
                totalGrossAmount: true,
                monthlyTarget: true
            }
        });

        if (!latestSavings) {
            return {
                totalSavingsAmount: new Decimal(0),
                totalGrossAmount: new Decimal(0),
                balance: new Decimal(0),
                monthlyTarget: new Decimal(0)
            };
        }

        return latestSavings;
    }

    private validateLoanDuration(tenure: number, loanType: any): boolean {
        const isSoftLoan = loanType.maxDuration <= 6;
        const isOneYearPlus = loanType.name.toLowerCase().includes('1 year plus');
        
        if (isSoftLoan) {
            return tenure >= 1 && tenure <= 6;
        }
        
        if (isOneYearPlus) {
            return tenure >= 12 && tenure <= 36;
        }
        
        return tenure >= 1 && tenure <= 12; // Regular loan
    }

    private validateInterestRate(loanType: any): boolean {
        const isSoftLoan = loanType.maxDuration <= 6;
        const isOneYearPlus = loanType.name.toLowerCase().includes('1 year plus');
        
        if (isSoftLoan) {
            return loanType.interestRate.equals(new Decimal(0.075)); // 7.5% monthly
        }
        
        if (isOneYearPlus) {
            return loanType.interestRate.equals(new Decimal(0.15)); // 15% annually
        }
        
        return loanType.interestRate.equals(new Decimal(0.10)); // 10% annually for regular
    }

    private calculateMaxLoanAmount(
        loanType: any, 
        savingsSummary: {
            totalSavingsAmount: Decimal;
            totalGrossAmount: Decimal;
            balance: Decimal;
            monthlyTarget: Decimal;
        }
    ): { maxAmount: Decimal; reason?: string } {
        let maxAmount: Decimal;

        // For Soft Loans - fixed 500,000 maximum
        if (loanType.maxDuration <= 6) {
            maxAmount = new Decimal(500000);
            return { 
                maxAmount,
                reason: 'Soft loan maximum amount is ₦500,000'
            };
        }

        // For Regular and Plus loans - 3x savings balance
        const multiplier = new Decimal(3);
        maxAmount = savingsSummary.totalSavingsAmount.mul(multiplier);

        return { 
            maxAmount,
            reason: `Maximum amount is ${multiplier}x your total savings of ${this.formatCurrency(savingsSummary.totalSavingsAmount)}`
        };
    }

    private formatCurrency(amount: Decimal): string {
        return `₦${amount.toNumber().toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    async checkLoanEligibility(
        biodataId: string,
        loanTypeId: string,
        requestedAmount?: number,
        tenure?: number
    ): Promise<FormattedResponse> {
        const loanType = await prisma.loanType.findUnique({
            where: { id: loanTypeId }
        });
        
        if (!loanType) {
            throw new ApiError('Invalid loan type', 404);
        }

        // Get cross-loan type restrictions
        const crossLoanCheck = await this.checkCrossLoanTypeRestrictions(biodataId, loanTypeId);
        if (crossLoanCheck.hasConflict) {
            return {
                success: false,
                data: {
                    isEligible: false,
                    maxAmount: '0',
                    formattedMaxAmount: '₦0.00',
                    reason: crossLoanCheck.errorMessage,
                    activeLoans: {
                        hasSoftLoan: crossLoanCheck.loanTypeInfo.hasActiveSoftLoan,
                        hasRegularLoan: crossLoanCheck.loanTypeInfo.hasActiveRegularLoan,
                        hasOneYearPlusLoan: crossLoanCheck.loanTypeInfo.hasActiveOneYearPlusLoan
                    }
                }
            };
        }

        // Get member's savings summary with enhanced fields
        const savingsSummary = await this.getMemberSavingsSummary(biodataId);

        if (savingsSummary.totalSavingsAmount.equals(0)) {
            return {
                success: false,
                data: {
                    isEligible: false,
                    maxAmount: '0',
                    formattedMaxAmount: '₦0.00',
                    reason: 'No active savings record found',
                    activeLoans: {
                        hasSoftLoan: false,
                        hasRegularLoan: false,
                        hasOneYearPlusLoan: false
                    }
                }
            };
        }

        // Add tenure validation if provided
        if (tenure && !this.validateLoanDuration(tenure, loanType)) {
            return {
                success: false,
                data: {
                    isEligible: false,
                    maxAmount: '0',
                    formattedMaxAmount: '₦0.00',
                    reason: `Invalid loan duration. ${loanType.name} must be between ${loanType.minDuration}-${loanType.maxDuration} months`,
                    activeLoans: {
                        hasSoftLoan: false,
                        hasRegularLoan: false,
                        hasOneYearPlusLoan: false
                    }
                }
            };
        }

        // Validate interest rate configuration
        if (!this.validateInterestRate(loanType)) {
            throw new ApiError('Invalid interest rate configuration', 400);
        }

        // Check for defaulted loans
        const hasDefaultedLoans = await prisma.loan.findFirst({
            where: {
                memberId: biodataId,
                status: 'DEFAULTED'
            }
        });

        if (hasDefaultedLoans) {
            return {
                success: false,
                data: {
                    isEligible: false,
                    maxAmount: '0',
                    formattedMaxAmount: '₦0.00',
                    reason: 'Cannot apply for new loan with defaulted loans',
                    activeLoans: {
                        hasSoftLoan: false,
                        hasRegularLoan: false,
                        hasOneYearPlusLoan: false
                    }
                }
            };
        }

        // Calculate maximum eligible amount with enhanced logic
        const { maxAmount, reason: maxAmountReason } = this.calculateMaxLoanAmount(
            loanType, 
            savingsSummary
        );


        console.log("eligibility", {
            success: true,
            data: {
                isEligible: true,
                maxAmount: maxAmount.toString(),
                formattedMaxAmount: this.formatCurrency(maxAmount),
                reason: maxAmountReason,
                savingsSummary: {
                    totalSavingsAmount: savingsSummary.totalSavingsAmount.toString(),
                    formattedTotalSavings: this.formatCurrency(savingsSummary.totalSavingsAmount),
                    totalGrossAmount: savingsSummary.totalGrossAmount.toString(),
                    formattedGrossAmount: this.formatCurrency(savingsSummary.totalGrossAmount),
                    currentBalance: savingsSummary.balance.toString(),
                    formattedBalance: this.formatCurrency(savingsSummary.balance),
                    monthlyTarget: savingsSummary.monthlyTarget.toString(),
                    formattedMonthlyTarget: this.formatCurrency(savingsSummary.monthlyTarget)
                },
                loanTypeDetails: {
                    name: loanType.name,
                    interestRate: Number(loanType.interestRate),
                    duration: {
                        min: loanType.minDuration,
                        max: loanType.maxDuration
                    },
                    savingsMultiplier: Number(loanType.savingsMultiplier)
                },
                activeLoans: {
                    hasSoftLoan: crossLoanCheck.loanTypeInfo.hasActiveSoftLoan,
                    hasRegularLoan: crossLoanCheck.loanTypeInfo.hasActiveRegularLoan,
                    hasOneYearPlusLoan: crossLoanCheck.loanTypeInfo.hasActiveOneYearPlusLoan
                }
            }
        })

        // Enhanced response format
        const response = {
            success: true,
            data: {
                isEligible: true,
                maxAmount: maxAmount.toString(),
                formattedMaxAmount: this.formatCurrency(maxAmount),
                reason: maxAmountReason,
                savingsSummary: {
                    totalSavingsAmount: savingsSummary.totalSavingsAmount.toString(),
                    formattedTotalSavings: this.formatCurrency(savingsSummary.totalSavingsAmount),
                    totalGrossAmount: savingsSummary.totalGrossAmount.toString(),
                    formattedGrossAmount: this.formatCurrency(savingsSummary.totalGrossAmount),
                    currentBalance: savingsSummary.balance.toString(),
                    formattedBalance: this.formatCurrency(savingsSummary.balance),
                    monthlyTarget: savingsSummary.monthlyTarget.toString(),
                    formattedMonthlyTarget: this.formatCurrency(savingsSummary.monthlyTarget)
                },
                loanTypeDetails: {
                    name: loanType.name,
                    interestRate: Number(loanType.interestRate),
                    duration: {
                        min: loanType.minDuration,
                        max: loanType.maxDuration
                    },
                    savingsMultiplier: Number(loanType.savingsMultiplier)
                },
                activeLoans: {
                    hasSoftLoan: crossLoanCheck.loanTypeInfo.hasActiveSoftLoan,
                    hasRegularLoan: crossLoanCheck.loanTypeInfo.hasActiveRegularLoan,
                    hasOneYearPlusLoan: crossLoanCheck.loanTypeInfo.hasActiveOneYearPlusLoan
                }
            }
        };

        // Check if requested amount exceeds maximum
        if (requestedAmount && new Decimal(requestedAmount).gt(maxAmount)) {
            return {
                ...response,
                success: false,
                data: {
                    ...response.data,
                    isEligible: false,
                    reason: `Requested amount exceeds maximum eligible amount of ${this.formatCurrency(maxAmount)}`
                }
            };
        }

        return response;
    }
}

export default new EligibilityService();
