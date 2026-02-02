export const savingsSchemas = {
    Savings: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid'
            },
            biodataId: {
                type: 'string',
                format: 'uuid'
            },
            year: {
                type: 'integer'
            },
            month: {
                type: 'integer',
                minimum: 1,
                maximum: 12
            },
            amount: {
                type: 'number',
                format: 'decimal'
            },
            type: {
                type: 'string',
                enum: ['REGULAR', 'SPECIAL']
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'PROCESSED', 'FAILED']
            },
            processedAt: {
                type: 'string',
                format: 'date-time'
            }
        }
    },
    CreateSavings: {
        type: 'object',
        required: ['biodataId', 'year', 'month', 'amount'],
        properties: {
            biodataId: {
                type: 'string',
                format: 'uuid'
            },
            year: {
                type: 'integer'
            },
            month: {
                type: 'integer',
                minimum: 1,
                maximum: 12
            },
            amount: {
                type: 'number',
                format: 'decimal'
            },
            type: {
                type: 'string',
                enum: ['REGULAR', 'SPECIAL'],
                default: 'REGULAR'
            }
        }
    },
    SavingsSummary: {
        type: 'object',
        properties: {
            totalSavings: {
                type: 'number',
                format: 'decimal'
            },
            regularSavings: {
                type: 'number',
                format: 'decimal'
            },
            specialSavings: {
                type: 'number',
                format: 'decimal'
            },
            lastContribution: {
                type: 'string',
                format: 'date-time'
            }
        }
    },
    SavingsStatistics: {
        type: 'object',
        properties: {
            yearlyTotal: {
                type: 'number',
                format: 'decimal'
            },
            monthlyAverage: {
                type: 'number',
                format: 'decimal'
            },
            monthlyBreakdown: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        month: {
                            type: 'integer'
                        },
                        amount: {
                            type: 'number',
                            format: 'decimal'
                        }
                    }
                }
            }
        }
    },
    SavingsUpload: {
        type: 'object',
        required: ['file'],
        properties: {
            file: {
                type: 'string',
                format: 'binary',
                description: 'Excel file containing savings records'
            }
        }
    },
    SavingsFilter: {
        type: 'object',
        properties: {
            year: {
                type: 'integer'
            },
            month: {
                type: 'integer',
                minimum: 1,
                maximum: 12
            },
            type: {
                type: 'string',
                enum: ['REGULAR', 'SPECIAL']
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'PROCESSED', 'FAILED']
            },
            minAmount: {
                type: 'number'
            },
            maxAmount: {
                type: 'number'
            },
            page: {
                type: 'integer',
                minimum: 1,
                default: 1
            },
            limit: {
                type: 'integer',
                minimum: 1,
                maximum: 100,
                default: 10
            }
        }
    },
    CreateWithdrawalRequest: {
        type: 'object',
        required: ['amount', 'reason'],
        properties: {
            amount: {
                type: 'number',
                format: 'decimal',
                minimum: 1000,
                description: 'Withdrawal amount (minimum ₦1,000)'
            },
            reason: {
                type: 'string',
                minLength: 10,
                maxLength: 500,
                description: 'Detailed reason for the withdrawal request'
            }
        }
    },
    WithdrawalStatusUpdate: {
        type: 'object',
        required: ['status'],
        properties: {
            status: {
                type: 'string',
                enum: ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED'],
                description: 'New status for the withdrawal request'
            },
            notes: {
                type: 'string',
                description: 'Optional notes or reason for the status change'
            },
            isLastApproval: {
                type: 'boolean',
                description: 'Whether this is the final approval step (required for CHAIRMAN level approvals)'
            }
        }
    },
    WithdrawalDetails: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid',
                description: 'Withdrawal request ID'
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED'],
                description: 'Current status of the withdrawal request'
            },
            amount: {
                type: 'object',
                properties: {
                    formatted: {
                        type: 'string',
                        description: 'Formatted amount with currency symbol'
                    },
                    raw: {
                        type: 'string',
                        description: 'Raw amount value'
                    }
                }
            },
            reason: {
                type: 'string',
                description: 'Reason provided for the withdrawal'
            },
            requestDate: {
                type: 'string',
                format: 'date-time',
                description: 'Date when request was created'
            },
            completedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Date when request was completed or rejected',
                nullable: true
            },
            member: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid'
                    },
                    name: {
                        type: 'string'
                    },
                    department: {
                        type: 'string'
                    },
                    erpId: {
                        type: 'string'
                    },
                    email: {
                        type: 'string',
                        format: 'email'
                    },
                    phone: {
                        type: 'string'
                    }
                }
            },
            currentApprovalLevel: {
                type: 'integer',
                description: 'Current level in the approval workflow (1-3)'
            },
            approvalSteps: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        level: {
                            type: 'integer'
                        },
                        role: {
                            type: 'string'
                        },
                        status: {
                            type: 'string',
                            enum: ['PENDING', 'APPROVED', 'REJECTED']
                        },
                        approver: {
                            type: 'object',
                            nullable: true,
                            properties: {
                                id: {
                                    type: 'string',
                                    format: 'uuid'
                                },
                                username: {
                                    type: 'string'
                                }
                            }
                        },
                        approvedAt: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true
                        },
                        notes: {
                            type: 'string',
                            nullable: true
                        }
                    }
                }
            },
            transaction: {
                type: 'object',
                nullable: true,
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid'
                    },
                    status: {
                        type: 'string'
                    },
                    amount: {
                        type: 'string'
                    },
                    date: {
                        type: 'string',
                        format: 'date-time'
                    },
                    initiator: {
                        $ref: '#/components/schemas/User'
                    },
                    approver: {
                        $ref: '#/components/schemas/User'
                    }
                }
            },
            savings: {
                type: 'object',
                nullable: true,
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid'
                    },
                    currentBalance: {
                        type: 'string'
                    },
                    totalSavings: {
                        type: 'string'
                    },
                    monthlyTarget: {
                        type: 'string'
                    },
                    remainingBalance: {
                        type: 'string',
                        nullable: true
                    }
                }
            },
            initiator: {
                $ref: '#/components/schemas/User'
            },
            approver: {
                $ref: '#/components/schemas/User',
                nullable: true
            },
            notes: {
                type: 'string',
                nullable: true
            }
        }
    },
    WithdrawalSummary: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid'
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED']
            },
            amount: {
                type: 'string',
                description: 'Formatted amount with currency symbol'
            },
            rawAmount: {
                type: 'string',
                description: 'Raw amount value'
            },
            reason: {
                type: 'string'
            },
            member: {
                type: 'object',
                nullable: true,
                properties: {
                    name: {
                        type: 'string'
                    },
                    department: {
                        type: 'string'
                    },
                    erpId: {
                        type: 'string'
                    }
                }
            },
            requestDate: {
                type: 'string',
                format: 'date-time'
            },
            completedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true
            },
            currentApprovalLevel: {
                type: 'integer'
            }
        }
    },
    WithdrawalStatistics: {
        type: 'object',
        properties: {
            total: {
                type: 'integer',
                description: 'Total number of withdrawal requests'
            },
            pending: {
                type: 'integer',
                description: 'Number of pending withdrawal requests'
            },
            approved: {
                type: 'integer',
                description: 'Number of approved withdrawal requests'
            },
            rejected: {
                type: 'integer',
                description: 'Number of rejected withdrawal requests'
            },
            totalAmount: {
                type: 'string',
                description: 'Total amount from completed withdrawals (Decimal)'
            },
            formattedTotalAmount: {
                type: 'string',
                description: 'Formatted total amount with currency symbol'
            }
        }
    }
}
