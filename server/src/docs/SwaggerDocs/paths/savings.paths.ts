export const savingsPaths = {
    '/savings/my-savings': {
        get: {
            tags: ['Savings'],
            summary: 'Get member savings',
            description: 'Get savings records for the authenticated member',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'year',
                    schema: {
                        type: 'integer'
                    }
                },
                {
                    in: 'query',
                    name: 'month',
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 12
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
                        default: 10
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Member savings retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/Savings'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/savings/summary': {
        get: {
            tags: ['Savings'],
            summary: 'Get savings summary',
            description: 'Get summary of member\'s savings',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Savings summary retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/SavingsSummary'
                            }
                        }
                    }
                }
            }
        }
    },
    '/savings/transactions/{savingsId}': {
        get: {
            tags: ['Savings'],
            summary: 'Get transaction history',
            description: 'Get transaction history for a savings account',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'savingsId',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Transaction history retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/Transaction'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/savings/monthly/{year}/{month}': {
        get: {
            tags: ['Savings'],
            summary: 'Get monthly savings',
            description: 'Get savings records for a specific month',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'year',
                    required: true,
                    schema: {
                        type: 'integer'
                    }
                },
                {
                    in: 'path',
                    name: 'month',
                    required: true,
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 12
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Monthly savings retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/Savings'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/savings/stats/{year}': {
        get: {
            tags: ['Savings'],
            summary: 'Get savings statistics',
            description: 'Get yearly savings statistics',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'year',
                    required: true,
                    schema: {
                        type: 'integer'
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Savings statistics retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/SavingsStatistics'
                            }
                        }
                    }
                }
            }
        }
    },
    '/savings': {
        get: {
            tags: ['Savings'],
            summary: 'Get all savings records',
            description: 'Get all savings records with filtering (admin only)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    $ref: '#/components/schemas/SavingsFilter'
                }
            ],
            responses: {
                '200': {
                    description: 'Savings records retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/Savings'
                                        }
                                    },
                                    pagination: {
                                        type: 'object',
                                        properties: {
                                            total: {
                                                type: 'integer'
                                            },
                                            pages: {
                                                type: 'integer'
                                            },
                                            current: {
                                                type: 'integer'
                                            },
                                            perPage: {
                                                type: 'integer'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/savings/create': {
        post: {
            tags: ['Savings'],
            summary: 'Create savings entry',
            description: 'Create a new savings entry',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/CreateSavings'
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Savings entry created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Savings'
                            }
                        }
                    }
                }
            }
        }
    },
    '/savings/upload': {
        post: {
            tags: ['Savings'],
            summary: 'Upload bulk savings',
            description: 'Upload multiple savings records via file (Chairman level)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            $ref: '#/components/schemas/SavingsUpload'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Bulk upload processed successfully'
                }
            }
        }
    },
    '/savings/backup': {
        get: {
            tags: ['Savings'],
            summary: 'Backup savings data',
            description: 'Download backup of savings data (Chairman level)',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Backup file generated successfully',
                    content: {
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                            schema: {
                                type: 'string',
                                format: 'binary'
                            }
                        }
                    }
                }
            }
        }
    },
    '/savings/statement/{erpId}': {
        get: {
            tags: ['Savings'],
            summary: 'Get savings statement',
            description: 'Get member\'s savings statement',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'erpId',
                    required: true,
                    schema: {
                        type: 'string'
                    }
                },
                {
                    in: 'query',
                    name: 'year',
                    required: true,
                    schema: {
                        type: 'integer'
                    }
                },
                {
                    in: 'query',
                    name: 'month',
                    required: true,
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 12
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Savings statement retrieved successfully'
                }
            }
        }
    },
    '/savings/statement/{erpId}/download': {
        get: {
            tags: ['Savings'],
            summary: 'Download savings statement',
            description: 'Download member\'s savings statement as PDF',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'erpId',
                    required: true,
                    schema: {
                        type: 'string'
                    }
                },
                {
                    in: 'query',
                    name: 'startDate',
                    schema: {
                        type: 'string',
                        format: 'date'
                    }
                },
                {
                    in: 'query',
                    name: 'endDate',
                    schema: {
                        type: 'string',
                        format: 'date'
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Statement PDF generated successfully',
                    content: {
                        'application/pdf': {
                            schema: {
                                type: 'string',
                                format: 'binary'
                            }
                        }
                    }
                }
            }
        }
    },
    '/savings/withdrawal': {
        post: {
            tags: ['Savings Withdrawal'],
            summary: 'Create withdrawal request',
            description: 'Submit a new withdrawal request from savings account (limited to one per year)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/CreateWithdrawalRequest'
                        },
                        examples: {
                            basic: {
                                summary: 'Basic withdrawal request',
                                value: {
                                    amount: 10000,
                                    reason: 'Emergency medical expenses'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Withdrawal request submitted successfully',
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
                                        example: 'Withdrawal request submitted successfully'
                                    },
                                    data: {
                                        $ref: '#/components/schemas/WithdrawalDetails'
                                    }
                                }
                            }
                        }
                    }
                },
                '400': {
                    description: 'Validation error or business rule violation',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: {
                                        type: 'boolean',
                                        example: false
                                    },
                                    message: {
                                        type: 'string'
                                    },
                                    errors: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                field: {
                                                    type: 'string'
                                                },
                                                message: {
                                                    type: 'string'
                                                }
                                            }
                                        }
                                    }
                                }
                            },
                            examples: {
                                validationError: {
                                    summary: 'Validation error',
                                    value: {
                                        success: false,
                                        message: 'Validation error',
                                        errors: [
                                            {
                                                field: 'amount',
                                                message: 'Minimum withdrawal amount is ₦1,000'
                                            }
                                        ]
                                    }
                                },
                                yearlyLimit: {
                                    summary: 'Yearly withdrawal limit reached',
                                    value: {
                                        success: false,
                                        message: 'You can only make one withdrawal request per year',
                                        code: 'WITHDRAWAL_LIMIT_EXCEEDED'
                                    }
                                },
                                insufficientBalance: {
                                    summary: 'Insufficient balance',
                                    value: {
                                        success: false,
                                        message: 'Withdrawal amount exceeds available balance of ₦45,000',
                                        code: 'INSUFFICIENT_BALANCE'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        get: {
            tags: ['Savings Withdrawal'],
            summary: 'Get withdrawal requests',
            description: 'Retrieve withdrawal requests with filtering and pagination. Regular members can only view their own requests; admins can view all.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'status',
                    schema: {
                        type: 'string',
                        enum: ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED']
                    },
                    description: 'Filter by request status'
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
                        default: 10,
                        maximum: 100
                    }
                },
                {
                    in: 'query',
                    name: 'startDate',
                    schema: {
                        type: 'string',
                        format: 'date-time'
                    },
                    description: 'Filter from this date'
                },
                {
                    in: 'query',
                    name: 'endDate',
                    schema: {
                        type: 'string',
                        format: 'date-time'
                    },
                    description: 'Filter until this date'
                },
                {
                    in: 'query',
                    name: 'sortBy',
                    schema: {
                        type: 'string',
                        default: 'createdAt'
                    }
                },
                {
                    in: 'query',
                    name: 'sortOrder',
                    schema: {
                        type: 'string',
                        enum: ['asc', 'desc'],
                        default: 'desc'
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Withdrawal requests retrieved successfully',
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
                                        example: 'Withdrawal requests retrieved successfully'
                                    },
                                    data: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/WithdrawalSummary'
                                        }
                                    },
                                    meta: {
                                        type: 'object',
                                        properties: {
                                            total: {
                                                type: 'integer'
                                            },
                                            page: {
                                                type: 'integer'
                                            },
                                            limit: {
                                                type: 'integer'
                                            },
                                            totalPages: {
                                                type: 'integer'
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/savings/withdrawal/stats': {
        get: {
            tags: ['Savings Withdrawal'],
            summary: 'Get withdrawal statistics',
            description: 'Retrieve summary statistics for withdrawal requests (Admin only)',
            security: [{ bearerAuth: [] }],
            parameters: [
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
                }
            ],
            responses: {
                '200': {
                    description: 'Withdrawal statistics retrieved successfully',
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
                                        example: 'Withdrawal statistics retrieved successfully'
                                    },
                                    data: {
                                        $ref: '#/components/schemas/WithdrawalStatistics'
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
    '/savings/withdrawal/{id}': {
        get: {
            tags: ['Savings Withdrawal'],
            summary: 'Get withdrawal details',
            description: 'Retrieve detailed information about a specific withdrawal request',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    },
                    description: 'Withdrawal request ID'
                }
            ],
            responses: {
                '200': {
                    description: 'Withdrawal request retrieved successfully',
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
                                        example: 'Withdrawal request retrieved successfully'
                                    },
                                    data: {
                                        $ref: '#/components/schemas/WithdrawalDetails'
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
                    description: 'Withdrawal request not found'
                }
            }
        }
    },
    '/savings/withdrawal/{id}/status': {
        patch: {
            tags: ['Savings Withdrawal'],
            summary: 'Update withdrawal status',
            description: 'Update the status of a withdrawal request through the multi-level approval workflow',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    },
                    description: 'Withdrawal request ID'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/WithdrawalStatusUpdate'
                        },
                        examples: {
                            review: {
                                summary: 'Move to review',
                                value: {
                                    status: 'IN_REVIEW',
                                    notes: 'Moving to financial verification phase'
                                }
                            },
                            approve: {
                                summary: 'Final approval',
                                value: {
                                    status: 'APPROVED',
                                    notes: 'Approved for disbursement',
                                    isLastApproval: true
                                }
                            },
                            reject: {
                                summary: 'Reject request',
                                value: {
                                    status: 'REJECTED',
                                    notes: 'Insufficient documentation provided'
                                }
                            }
                        }
                    }
                },
                responses: {
                    '200': {
                        description: 'Withdrawal request status updated successfully',
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
                                            example: 'Withdrawal request status updated successfully'
                                        },
                                        data: {
                                            $ref: '#/components/schemas/WithdrawalDetails'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '400': {
                        description: 'Invalid status transition or validation error'
                    },
                    '403': {
                        description: 'Insufficient permissions or approval level'
                    },
                    '404': {
                        description: 'Withdrawal request not found'
                    }
                }
            }
        }
    },
    '/savings/members-summary': {
        get: {
            tags: ['Savings'],
            summary: 'Get members savings summary',
            description: 'Get aggregated savings summary for all members',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'page',
                    schema: { type: 'integer', default: 1 },
                    description: 'Page number'
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'integer', default: 10 },
                    description: 'Records per page'
                },
                {
                    in: 'query',
                    name: 'search',
                    schema: { type: 'string' },
                    description: 'Search term for member name or ERP ID'
                },
                {
                    in: 'query',
                    name: 'department',
                    schema: { type: 'string' },
                    description: 'Filter by department'
                },
                {
                    in: 'query',
                    name: 'sortBy',
                    schema: { type: 'string', default: 'lastDeposit' },
                    description: 'Field to sort by'
                },
                {
                    in: 'query',
                    name: 'sortOrder',
                    schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
                    description: 'Sort order'
                },
                {
                    in: 'query',
                    name: 'status',
                    schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
                    description: 'Filter by account status'
                }
            ],
            responses: {
                '200': {
                    description: 'Members savings summary retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean' },
                                    message: { type: 'string' },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            data: {
                                                type: 'array',
                                                items: {
                                                    $ref: '#/components/schemas/MemberSavingsSummary'
                                                }
                                            },
                                            meta: {
                                                type: 'object',
                                                properties: {
                                                    total: { type: 'integer' },
                                                    page: { type: 'integer' },
                                                    limit: { type: 'integer' },
                                                    totalPages: { type: 'integer' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
