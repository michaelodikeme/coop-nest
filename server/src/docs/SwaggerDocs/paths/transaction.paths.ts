export const transactionPaths = {
    '/transactions': {
        post: {
            tags: ['Transaction'],
            summary: 'Create transaction',
            description: 'Create a new transaction (Requires CREATE_TRANSACTION permission)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/CreateTransaction'
                        },
                        examples: {
                            savingsDeposit: {
                                summary: 'Savings deposit transaction',
                                value: {
                                    transactionType: 'SAVINGS_DEPOSIT',
                                    module: 'SAVINGS',
                                    amount: 5000,
                                    description: 'Monthly savings deposit',
                                    relatedEntityId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                                    relatedEntityType: 'SAVINGS'
                                }
                            },
                            loanRepayment: {
                                summary: 'Loan repayment transaction',
                                value: {
                                    transactionType: 'LOAN_REPAYMENT',
                                    module: 'LOAN',
                                    amount: 10000,
                                    description: 'Monthly loan repayment',
                                    relatedEntityId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                                    relatedEntityType: 'LOAN'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Transaction created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/TransactionResponse'
                            }
                        }
                    }
                },
                '400': {
                    description: 'Invalid input data',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ValidationError'
                            }
                        }
                    }
                },
                '403': {
                    description: 'Insufficient permissions'
                }
            }
        },
        get: {
            tags: ['Transaction'],
            summary: 'Search for transactions',
            description: 'Search for transactions with various filters and pagination',
            parameters: [
                {
                    in: 'query',
                    name: 'module',
                    schema: {
                        type: 'string',
                        enum: ['SAVINGS', 'LOAN', 'SHARES', 'ADMIN', 'SYSTEM']
                    },
                    description: 'Filter by module'
                },
                {
                    in: 'query',
                    name: 'transactionType',
                    schema: {
                        type: 'string',
                        enum: [
                            'CREDIT', 'DEBIT',
                            'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAWAL', 'SAVINGS_INTEREST',
                            'SHARES_PURCHASE', 'SHARES_LIQUIDATION', 'SHARES_DIVIDEND',
                            'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'LOAN_INTEREST', 'LOAN_PENALTY',
                            'FEE', 'REVERSAL', 'ADJUSTMENT'
                        ]
                    },
                    description: 'Filter by transaction type'
                },
                {
                    in: 'query',
                    name: 'status',
                    schema: {
                        type: 'string',
                        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED']
                    },
                    description: 'Filter by transaction status'
                },
                {
                    in: 'query',
                    name: 'startDate',
                    schema: {
                        type: 'string',
                        format: 'date-time'
                    },
                    description: 'Filter transactions from this date'
                },
                {
                    in: 'query',
                    name: 'endDate',
                    schema: {
                        type: 'string',
                        format: 'date-time'
                    },
                    description: 'Filter transactions until this date'
                },
                {
                    in: 'query',
                    name: 'relatedEntityId',
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    },
                    description: 'Filter by related entity ID'
                },
                {
                    in: 'query',
                    name: 'relatedEntityType',
                    schema: {
                        type: 'string',
                        enum: ['SAVINGS', 'LOAN', 'SHARES', 'BIODATA']
                    },
                    description: 'Filter by related entity type'
                },
                {
                    in: 'query',
                    name: 'initiatedBy',
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    },
                    description: 'Filter by user who initiated the transaction'
                },
                {
                    in: 'query',
                    name: 'page',
                    schema: {
                        type: 'integer',
                        default: 1
                    },
                    description: 'Page number'
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: {
                        type: 'integer',
                        default: 20,
                        maximum: 100
                    },
                    description: 'Items per page'
                }
            ],
            responses: {
                '200': {
                    description: 'Successfully retrieved transactions',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: {
                                        type: 'boolean',
                                        example: true
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Transactions retrieved successfully'
                                    },
                                    data: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/TransactionWithDetails'
                                        }
                                    },
                                    pagination: {
                                        $ref: '#/components/schemas/Pagination'
                                    }
                                }
                            }
                        }
                    }
                },
                '400': {
                    description: 'Invalid query parameters'
                },
                '403': {
                    description: 'Insufficient permissions'
                }
            }
        }
    },
    '/transactions/batch': {
        post: {
            tags: ['Transaction'],
            summary: 'Create batch transactions',
            description: 'Create multiple transactions in a batch (Requires CREATE_TRANSACTION permission)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['transactions'],
                            properties: {
                                transactions: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/CreateTransaction'
                                    },
                                    minItems: 1
                                },
                                processAsUnit: {
                                    type: 'boolean',
                                    description: 'Whether to process all transactions as a single unit (all succeed or all fail)',
                                    default: false
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Transactions created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: {
                                        type: 'string',
                                        example: 'Successfully created 5 transactions'
                                    },
                                    data: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/TransactionResponse'
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                '400': {
                    description: 'Invalid input data'
                },
                '403': {
                    description: 'Insufficient permissions'
                }
            }
        }
    },
    '/transactions/search': {
        get: {
            tags: ['Transaction'],
            summary: 'Search transactions',
            description: 'Search transactions with various filters (Requires VIEW_TRANSACTIONS permission)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'module',
                    schema: {
                        type: 'string',
                        enum: ['SAVINGS', 'LOAN', 'SHARES', 'ADMIN', 'SYSTEM']
                    }
                },
                {
                    in: 'query',
                    name: 'transactionType',
                    schema: {
                        type: 'string',
                        enum: [
                            'CREDIT', 'DEBIT',
                            'SAVINGS_DEPOSIT', 'SAVINGS_WITHDRAWAL', 'SAVINGS_INTEREST',
                            'SHARES_PURCHASE', 'SHARES_LIQUIDATION', 'SHARES_DIVIDEND',
                            'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'LOAN_INTEREST', 'LOAN_PENALTY',
                            'FEE', 'REVERSAL', 'ADJUSTMENT'
                        ]
                    }
                },
                {
                    in: 'query',
                    name: 'status',
                    schema: {
                        type: 'string',
                        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED']
                    }
                },
                {
                    in: 'query',
                    name: 'startDate',
                    schema: {
                        type: 'string',
                        format: 'date-time'
                    }
                },
                {
                    in: 'query',
                    name: 'endDate',
                    schema: {
                        type: 'string',
                        format: 'date-time'
                    }
                },
                {
                    in: 'query',
                    name: 'page',
                    schema: {
                        type: 'integer',
                        default: 1
                    }
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: {
                        type: 'integer',
                        default: 20
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Transactions retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/TransactionWithDetails'
                                        }
                                    },
                                    pagination: {
                                        $ref: '#/components/schemas/Pagination'
                                    }
                                }
                            }
                        }
                    }
                },
                '403': {
                    description: 'Insufficient permissions'
                }
            }
        }
    },
    '/transactions/{id}': {
        get: {
            tags: ['Transaction'],
            summary: 'Get transaction',
            description: 'Get transaction by ID (Requires VIEW_TRANSACTIONS permission)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Transaction retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/TransactionWithDetails'
                            }
                        }
                    }
                },
                '403': {
                    description: 'Insufficient permissions'
                },
                '404': {
                    description: 'Transaction not found'
                }
            }
        }
    },
    '/transactions/{id}/status': {
        patch: {
            tags: ['Transaction'],
            summary: 'Update transaction status',
            description: 'Update the status of a transaction (Requires UPDATE_TRANSACTION permission)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['status'],
                            properties: {
                                status: {
                                    type: 'string',
                                    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED']
                                },
                                notes: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Transaction status updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/TransactionResponse'
                            }
                        }
                    }
                },
                '400': {
                    description: 'Invalid status transition'
                },
                '403': {
                    description: 'Insufficient permissions'
                },
                '404': {
                    description: 'Transaction not found'
                }
            }
        }
    },
    '/transactions/{id}/reverse': {
        post: {
            tags: ['Transaction'],
            summary: 'Reverse transaction',
            description: 'Create a reversal transaction (Requires REVERSE_TRANSACTION permission)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['reason'],
                            properties: {
                                reason: {
                                    type: 'string',
                                    minLength: 1
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Transaction reversed successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/TransactionResponse'
                            }
                        }
                    }
                },
                '400': {
                    description: 'Transaction cannot be reversed'
                },
                '403': {
                    description: 'Insufficient permissions'
                },
                '404': {
                    description: 'Transaction not found'
                }
            }
        }
    },
    '/transactions/entity/{entityType}/{entityId}': {
        get: {
            tags: ['Transaction'],
            summary: 'Get entity transactions',
            description: 'Get all transactions for a specific entity (Requires VIEW_TRANSACTIONS permission)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'entityType',
                    required: true,
                    schema: {
                        type: 'string',
                        enum: ['SAVINGS', 'LOAN', 'SHARES', 'BIODATA']
                    }
                },
                {
                    in: 'path',
                    name: 'entityId',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                },
                {
                    in: 'query',
                    name: 'page',
                    schema: {
                        type: 'integer',
                        default: 1
                    }
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: {
                        type: 'integer',
                        default: 20
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Entity transactions retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/TransactionWithDetails'
                                        }
                                    },
                                    pagination: {
                                        $ref: '#/components/schemas/Pagination'
                                    }
                                }
                            }
                        }
                    }
                },
                '403': {
                    description: 'Insufficient permissions'
                },
                '404': {
                    description: 'Entity not found'
                }
            }
        }
    },
    '/transactions/user/{userId}': {
        get: {
            tags: ['Transaction'],
            summary: 'Get transactions for a specific user',
            description: 'Retrieve all transactions associated with a specific user ID',
            parameters: [
                {
                    name: 'userId',
                    in: 'path',
                    description: 'ID of the user to get transactions for (defaults to current user if omitted)',
                    required: false,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                },
                {
                    in: 'query',
                    name: 'page',
                    schema: {
                        type: 'integer',
                        default: 1
                    }
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: {
                        type: 'integer',
                        default: 20
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Successfully retrieved user transactions',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: {
                                        type: 'boolean',
                                        example: true
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'User transactions retrieved successfully'
                                    },
                                    data: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/TransactionWithDetails'
                                        }
                                    },
                                    pagination: {
                                        $ref: '#/components/schemas/Pagination'
                                    }
                                }
                            }
                        }
                    }
                },
                '403': {
                    description: 'Insufficient permissions'
                }
            }
        }
    },
    '/transactions/summary': {
        get: {
            tags: ['Transaction'],
            summary: 'Get transaction summary',
            description: 'Get summary statistics of transactions (Requires VIEW_TRANSACTION_ANALYTICS permission)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'module',
                    schema: {
                        type: 'string',
                        enum: ['SAVINGS', 'LOAN', 'SHARES', 'ADMIN', 'SYSTEM']
                    }
                },
                {
                    in: 'query',
                    name: 'startDate',
                    schema: {
                        type: 'string',
                        format: 'date-time'
                    }
                },
                {
                    in: 'query',
                    name: 'endDate',
                    schema: {
                        type: 'string',
                        format: 'date-time'
                    }
                },
                {
                    in: 'query',
                    name: 'status',
                    schema: {
                        type: 'string',
                        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REVERSED']
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Transaction summary retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/TransactionSummary'
                            }
                        }
                    }
                },
                '403': {
                    description: 'Insufficient permissions'
                }
            }
        }
    },
    '/transactions/reports': {
        get: {
            tags: ['Transaction'],
            summary: 'Generate transaction report',
            description: 'Generate a transaction report with various options (Requires GENERATE_REPORTS permission)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'module',
                    schema: {
                        type: 'string',
                        enum: ['SAVINGS', 'LOAN', 'SHARES', 'ADMIN', 'SYSTEM']
                    }
                },
                {
                    in: 'query',
                    name: 'startDate',
                    schema: {
                        type: 'string',
                        format: 'date-time'
                    }
                },
                {
                    in: 'query',
                    name: 'endDate',
                    schema: {
                        type: 'string',
                        format: 'date-time'
                    }
                },
                {
                    in: 'query',
                    name: 'groupBy',
                    schema: {
                        type: 'string',
                        enum: ['day', 'week', 'month', 'module', 'type'],
                        default: 'day'
                    }
                },
                {
                    in: 'query',
                    name: 'format',
                    schema: {
                        type: 'string',
                        enum: ['json', 'csv', 'pdf', 'excel'],
                        default: 'json'
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Transaction report generated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'object',
                                        additionalProperties: true
                                    }
                                }
                            }
                        },
                        'application/octet-stream': {
                            schema: {
                                type: 'string',
                                format: 'binary'
                            }
                        }
                    }
                },
                '403': {
                    description: 'Insufficient permissions'
                }
            }
        }
    },
    '/transactions/counts': {
        get: {
            tags: ['Transaction'],
            summary: 'Get transaction counts',
            description: 'Get counts of transactions by status (Requires VIEW_TRANSACTION_ANALYTICS permission)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'module',
                    schema: {
                        type: 'string',
                        enum: ['SAVINGS', 'LOAN', 'SHARES', 'ADMIN', 'SYSTEM']
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Transaction counts retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    PENDING: {
                                        type: 'integer'
                                    },
                                    PROCESSING: {
                                        type: 'integer'
                                    },
                                    COMPLETED: {
                                        type: 'integer'
                                    },
                                    FAILED: {
                                        type: 'integer'
                                    },
                                    CANCELLED: {
                                        type: 'integer'
                                    },
                                    REVERSED: {
                                        type: 'integer'
                                    },
                                    TOTAL: {
                                        type: 'integer'
                                    }
                                }
                            }
                        }
                    }
                },
                '403': {
                    description: 'Insufficient permissions'
                }
            }
        }
    }
};
