export const transactionSchemas = {
    Transaction: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid'
            },
            type: {
                type: 'string',
                enum: ['DEPOSIT', 'WITHDRAWAL', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'SHARE_PURCHASE', 'SHARE_REDEMPTION']
            },
            amount: {
                type: 'number',
                format: 'decimal'
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED']
            },
            entityType: {
                type: 'string',
                enum: ['SAVINGS', 'LOAN', 'SHARE']
            },
            entityId: {
                type: 'string',
                format: 'uuid'
            },
            referenceNumber: {
                type: 'string'
            },
            metadata: {
                type: 'object'
            },
            createdAt: {
                type: 'string',
                format: 'date-time'
            },
            updatedAt: {
                type: 'string',
                format: 'date-time'
            }
        }
    },
    CreateTransaction: {
        type: 'object',
        required: ['type', 'amount', 'entityType', 'entityId'],
        properties: {
            type: {
                type: 'string',
                enum: ['DEPOSIT', 'WITHDRAWAL', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'SHARE_PURCHASE', 'SHARE_REDEMPTION']
            },
            amount: {
                type: 'number',
                format: 'decimal'
            },
            entityType: {
                type: 'string',
                enum: ['SAVINGS', 'LOAN', 'SHARE']
            },
            entityId: {
                type: 'string',
                format: 'uuid'
            },
            referenceNumber: {
                type: 'string'
            },
            metadata: {
                type: 'object'
            }
        }
    },
    UpdateTransactionStatus: {
        type: 'object',
        required: ['status'],
        properties: {
            status: {
                type: 'string',
                enum: ['COMPLETED', 'FAILED', 'REVERSED']
            },
            reason: {
                type: 'string'
            }
        }
    },
    TransactionFilter: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                enum: ['DEPOSIT', 'WITHDRAWAL', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'SHARE_PURCHASE', 'SHARE_REDEMPTION']
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED']
            },
            entityType: {
                type: 'string',
                enum: ['SAVINGS', 'LOAN', 'SHARE']
            },
            startDate: {
                type: 'string',
                format: 'date'
            },
            endDate: {
                type: 'string',
                format: 'date'
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
    TransactionSummary: {
        type: 'object',
        properties: {
            totalCount: {
                type: 'integer'
            },
            totalAmount: {
                type: 'number',
                format: 'decimal'
            },
            typeBreakdown: {
                type: 'object',
                additionalProperties: {
                    type: 'object',
                    properties: {
                        count: {
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
    TransactionWithDetails: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid',
                example: '550e8400-e29b-41d4-a716-446655440000'
            },
            type: {
                type: 'string',
                enum: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'FEE', 'INTEREST', 'OTHER'],
                example: 'DEPOSIT'
            },
            amount: {
                type: 'number',
                format: 'float',
                example: 1000.00
            },
            description: {
                type: 'string',
                example: 'Monthly savings deposit'
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'],
                example: 'COMPLETED'
            },
            reference: {
                type: 'string',
                example: 'TRX12345678'
            },
            initiatedBy: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid'
                    },
                    firstName: {
                        type: 'string'
                    },
                    lastName: {
                        type: 'string'
                    },
                    email: {
                        type: 'string',
                        format: 'email'
                    }
                }
            },
            approvedBy: {
                type: 'object',
                nullable: true,
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid'
                    },
                    firstName: {
                        type: 'string'
                    },
                    lastName: {
                        type: 'string'
                    },
                    email: {
                        type: 'string',
                        format: 'email'
                    }
                }
            },
            sourceAccount: {
                type: 'object',
                nullable: true,
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid'
                    },
                    accountNumber: {
                        type: 'string'
                    },
                    accountName: {
                        type: 'string'
                    }
                }
            },
            destinationAccount: {
                type: 'object',
                nullable: true,
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid'
                    },
                    accountNumber: {
                        type: 'string'
                    },
                    accountName: {
                        type: 'string'
                    }
                }
            },
            relatedEntityType: {
                type: 'string',
                enum: ['LOAN', 'SAVINGS', 'MEMBER', 'ACCOUNT', 'SHARE'],
                example: 'SAVINGS'
            },
            relatedEntityId: {
                type: 'string',
                format: 'uuid',
                example: '550e8400-e29b-41d4-a716-446655440000'
            },
            metadata: {
                type: 'object',
                additionalProperties: true,
                example: {
                    paymentMethod: 'CASH',
                    receiptNumber: 'RCP12345'
                }
            },
            createdAt: {
                type: 'string',
                format: 'date-time'
            },
            updatedAt: {
                type: 'string',
                format: 'date-time'
            }
        },
        required: ['id', 'type', 'amount', 'status', 'initiatedBy']
    },
    Pagination : {
        type: 'object',
        properties: {
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
            },
            totalCount: {
                type: 'integer'
            },
            totalPages: {
                type: 'integer'
            }
        }
    }
}
