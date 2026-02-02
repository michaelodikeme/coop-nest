export const loanSchemas = {
    LoanType: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid',
                description: 'Loan type unique identifier'
            },
            name: {
                type: 'string',
                description: 'Name of the loan type'
            },
            description: {
                type: 'string',
                description: 'Description of the loan type'
            },
            interestRate: {
                type: 'number',
                format: 'float',
                description: 'Annual interest rate'
            },
            maxTenure: {
                type: 'integer',
                description: 'Maximum loan tenure in months'
            },
            maxAmount: {
                type: 'number',
                description: 'Maximum loan amount'
            }
        }
    },
    LoanApplication: {
        type: 'object',
        required: ['loanTypeId', 'loanAmount', 'loanTenure', 'loanPurpose'],
        properties: {
            loanTypeId: {
                type: 'string',
                format: 'uuid',
                description: 'ID of the loan type'
            },
            loanAmount: {
                type: 'number',
                description: 'Requested loan amount'
            },
            loanTenure: {
                type: 'integer',
                description: 'Requested loan tenure in months'
            },
            loanPurpose: {
                type: 'string',
                description: 'Purpose of the loan'
            }
        }
    },
    LoanCalculation: {
        type: 'object',
        required: ['loanTypeId', 'amount', 'tenure'],
        properties: {
            loanTypeId: {
                type: 'string',
                format: 'uuid'
            },
            amount: {
                type: 'number'
            },
            tenure: {
                type: 'integer'
            }
        }
    },
    LoanEligibility: {
        type: 'object',
        required: ['loanTypeId', 'requestedAmount'],
        properties: {
            loanTypeId: {
                type: 'string',
                format: 'uuid'
            },
            requestedAmount: {
                type: 'number'
            }
        }
    },
    LoanStatusUpdate: {
        type: 'object',
        required: ['status'],
        properties: {
            status: {
                type: 'string',
                enum: ['PENDING', 'REVIEWED', 'APPROVED', 'REJECTED', 'DISBURSED', 'COMPLETED', 'DEFAULTED'],
                description: 'New loan status'
            },
            notes: {
                type: 'string',
                description: 'Notes or comments about the status update'
            }
        }
    },
    Repayment: {
        type: 'object',
        required: ['loanId', 'amount', 'paymentDate'],
        properties: {
            loanId: {
                type: 'string',
                format: 'uuid'
            },
            amount: {
                type: 'number'
            },
            paymentDate: {
                type: 'string',
                format: 'date-time'
            },
            reference: {
                type: 'string'
            }
        }
    },
    RepaymentBulkUpload: {
        type: 'object',
        required: ['file'],
        properties: {
            file: {
                type: 'string',
                format: 'binary',
                description: 'Excel file containing repayment records'
            }
        }
    },
    LoanRepaymentRequest: {
        type: 'object',
        required: ['loanId', 'erpId', 'uploadedAmount', 'repaymentMonth', 'repaymentYear'],
        properties: {
            loanId: {
                type: 'string',
                format: 'uuid',
                description: 'ID of the loan being repaid'
            },
            erpId: {
                type: 'string',
                description: 'ERP ID of the member'
            },
            uploadedAmount: {
                type: 'number',
                description: 'Amount being repaid'
            },
            repaymentMonth: {
                type: 'integer',
                minimum: 1,
                maximum: 12,
                description: 'Month for which repayment is being made'
            },
            repaymentYear: {
                type: 'integer',
                description: 'Year for which repayment is being made'
            },
            scheduleId: {
                type: 'string',
                format: 'uuid',
                description: 'Optional ID of specific schedule being repaid'
            },
            repaymentDate: {
                type: 'string',
                format: 'date-time',
                description: 'Date of repayment'
            }
        }
    },
    RepaymentResult: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean'
            },
            message: {
                type: 'string'
            },
            data: {
                type: 'object',
                properties: {
                    repaymentId: {
                        type: 'string',
                        format: 'uuid'
                    },
                    amountPaid: {
                        type: 'string'
                    },
                    remainingBalance: {
                        type: 'string'
                    },
                    isFullyPaid: {
                        type: 'boolean'
                    },
                    totalRepayableAmount: {
                        type: 'string'
                    },
                    totalInterest: {
                        type: 'string'
                    },
                    paymentProgress: {
                        type: 'number'
                    }
                }
            }
        }
    },
    BulkRepaymentResult: {
        type: 'object',
        properties: {
            batchId: {
                type: 'string',
                format: 'uuid',
                description: 'ID of the batch upload'
            },
            status: {
                type: 'string',
                enum: ['COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED'],
                description: 'Status of the bulk upload'
            },
            successful: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        rowNumber: {
                            type: 'integer'
                        },
                        erpId: {
                            type: 'string'
                        },
                        loanId: {
                            type: 'string'
                        },
                        amount: {
                            type: 'string'
                        }
                    }
                }
            },
            failed: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        rowNumber: {
                            type: 'integer'
                        },
                        erpId: {
                            type: 'string'
                        },
                        loanId: {
                            type: 'string'
                        },
                        error: {
                            type: 'string'
                        }
                    }
                }
            },
            totalProcessed: {
                type: 'integer'
            },
            totalAmount: {
                type: 'string'
            }
        }
    },
    RepaymentHistory: {
        type: 'object',
        properties: {
            loanId: {
                type: 'string',
                format: 'uuid'
            },
            totalAmount: {
                type: 'string',
                description: 'Total loan amount including interest'
            },
            paidAmount: {
                type: 'string',
                description: 'Total amount repaid so far'
            },
            remainingBalance: {
                type: 'string',
                description: 'Remaining balance to be paid'
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'IN_REVIEW', 'REVIEWED', 'APPROVED', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'DEFAULTED']
            },
            schedules: {
                type: 'array',
                items: {
                    $ref: '#/components/schemas/LoanSchedule'
                }
            },
            repayments: {
                type: 'array',
                items: {
                    $ref: '#/components/schemas/LoanRepayment'
                }
            }
        }
    },
    LoanSchedule: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid'
            },
            loanId: {
                type: 'string',
                format: 'uuid'
            },
            dueDate: {
                type: 'string',
                format: 'date-time'
            },
            expectedAmount: {
                type: 'string'
            },
            principalAmount: {
                type: 'string'
            },
            interestAmount: {
                type: 'string'
            },
            remainingBalance: {
                type: 'string'
            },
            paidAmount: {
                type: 'string'
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']
            },
            actualPaymentDate: {
                type: 'string',
                format: 'date-time',
                nullable: true
            }
        }
    },
    LoanRepayment: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid'
            },
            loanId: {
                type: 'string',
                format: 'uuid'
            },
            scheduleId: {
                type: 'string',
                format: 'uuid',
                nullable: true
            },
            amount: {
                type: 'string'
            },
            repaymentDate: {
                type: 'string',
                format: 'date-time'
            },
            uploadedDate: {
                type: 'string',
                format: 'date-time'
            },
            repaymentMonth: {
                type: 'integer'
            },
            repaymentYear: {
                type: 'integer'
            },
            uploadedBy: {
                type: 'string'
            },
            isReconciled: {
                type: 'boolean'
            }
        }
    },
    OutstandingLoan: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid'
            },
            erpId: {
                type: 'string'
            },
            loanType: {
                $ref: '#/components/schemas/LoanType'
            },
            member: {
                type: 'object',
                properties: {
                    fullName: {
                        type: 'string'
                    },
                    department: {
                        type: 'string'
                    }
                }
            },
            principalAmount: {
                type: 'string'
            },
            totalAmount: {
                type: 'string'
            },
            remainingBalance: {
                type: 'string'
            },
            status: {
                type: 'string',
                enum: ['ACTIVE', 'DISBURSED']
            },
            tenure: {
                type: 'integer'
            },
            disbursedAt: {
                type: 'string',
                format: 'date-time'
            },
            paymentSchedules: {
                type: 'array',
                items: {
                    $ref: '#/components/schemas/LoanSchedule'
                }
            }
        }
    },
    LoanWithRepayments: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid'
            },
            erpId: {
                type: 'string'
            },
            loanType: {
                $ref: '#/components/schemas/LoanType'
            },
            principalAmount: {
                type: 'string'
            },
            totalAmount: {
                type: 'string'
            },
            remainingBalance: {
                type: 'string'
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'IN_REVIEW', 'REVIEWED', 'APPROVED', 'DISBURSED', 'ACTIVE', 'COMPLETED', 'DEFAULTED']
            },
            repayments: {
                type: 'array',
                items: {
                    $ref: '#/components/schemas/LoanRepayment'
                }
            }
        }
    },
    AgingReport: {
        type: 'object',
        properties: {
            summary: {
                type: 'object',
                properties: {
                    totalLoans: {
                        type: 'integer',
                        description: 'Total number of loans with outstanding balances'
                    },
                    totalOutstanding: {
                        type: 'string',
                        description: 'Total outstanding balance across all loans'
                    },
                    buckets: {
                        type: 'object',
                        additionalProperties: {
                            type: 'object',
                            properties: {
                                count: {
                                    type: 'integer'
                                },
                                amount: {
                                    type: 'string'
                                }
                            }
                        },
                        description: 'Aging buckets with counts and amounts'
                    }
                }
            },
            byLoanType: {
                type: 'object',
                additionalProperties: {
                    type: 'object',
                    properties: {
                        count: {
                            type: 'integer'
                        },
                        totalOutstanding: {
                            type: 'string'
                        },
                        buckets: {
                            type: 'object',
                            additionalProperties: {
                                type: 'object',
                                properties: {
                                    count: {
                                        type: 'integer'
                                    },
                                    amount: {
                                        type: 'string'
                                    }
                                }
                            }
                        }
                    }
                },
                description: 'Aging data broken down by loan type'
            },
            details: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        erpId: {
                            type: 'string'
                        },
                        memberName: {
                            type: 'string'
                        },
                        department: {
                            type: 'string'
                        },
                        loanType: {
                            type: 'string'
                        },
                        scheduleId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        dueDate: {
                            type: 'string',
                            format: 'date-time'
                        },
                        daysOverdue: {
                            type: 'integer'
                        },
                        expectedAmount: {
                            type: 'string'
                        },
                        paidAmount: {
                            type: 'string'
                        },
                        outstandingAmount: {
                            type: 'string'
                        },
                        agingBucket: {
                            type: 'string'
                        }
                    }
                },
                description: 'Detailed list of all overdue payments'
            }
        }
    },
    MonthlyRepaymentReport: {
        type: 'object',
        properties: {
            month: {
                type: 'integer'
            },
            year: {
                type: 'integer'
            },
            totalDue: {
                type: 'integer',
                description: 'Total number of payments due this month'
            },
            totalAmount: {
                type: 'string',
                description: 'Total amount due this month'
            },
            byLoanType: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        loanType: {
                            type: 'string'
                        },
                        count: {
                            type: 'integer'
                        },
                        totalExpected: {
                            type: 'string'
                        }
                    }
                },
                description: 'Due payments grouped by loan type'
            },
            schedules: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        loanId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        dueDate: {
                            type: 'string',
                            format: 'date-time'
                        },
                        expectedAmount: {
                            type: 'string'
                        },
                        status: {
                            type: 'string'
                        },
                        loan: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                    format: 'uuid'
                                },
                                erpId: {
                                    type: 'string'
                                },
                                member: {
                                    type: 'object',
                                    properties: {
                                        fullName: {
                                            type: 'string'
                                        },
                                        department: {
                                            type: 'string'
                                        }
                                    }
                                },
                                loanType: {
                                    type: 'object',
                                    properties: {
                                        name: {
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                description: 'List of all schedules due this month'
            }
        }
    }
}
