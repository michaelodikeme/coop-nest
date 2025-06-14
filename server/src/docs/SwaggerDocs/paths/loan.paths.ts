export const loanPaths = {
    '/loan/types': {
        get: {
            tags: ['Loan'],
            summary: 'Get all loan types',
            description: 'Retrieve a list of available loan types',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'List of loan types retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/LoanType'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/loan/eligibility': {
        post: {
            tags: ['Loan'],
            summary: 'Check loan eligibility',
            description: 'Check if a member is eligible for a specific loan type and amount',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/LoanEligibility'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Eligibility check completed successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    isEligible: {
                                        type: 'boolean'
                                    },
                                    maxAmount: {
                                        type: 'number'
                                    },
                                    reasons: {
                                        type: 'array',
                                        items: {
                                            type: 'string'
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
    '/loan/calculate': {
        post: {
            tags: ['Loan'],
            summary: 'Calculate loan details',
            description: 'Calculate repayment schedule and other loan details',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/LoanCalculation'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Loan calculation completed',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    monthlyPayment: {
                                        type: 'number'
                                    },
                                    totalInterest: {
                                        type: 'number'
                                    },
                                    totalRepayment: {
                                        type: 'number'
                                    },
                                    schedule: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                paymentDate: {
                                                    type: 'string',
                                                    format: 'date'
                                                },
                                                principal: {
                                                    type: 'number'
                                                },
                                                interest: {
                                                    type: 'number'
                                                },
                                                balance: {
                                                    type: 'number'
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
    },
    '/loan/apply': {
        post: {
            tags: ['Loan'],
            summary: 'Apply for loan',
            description: 'Submit a new loan application',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/LoanApplication'
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Loan application submitted successfully'
                }
            }
        }
    },
    '/loan/member/{biodataId}': {
        get: {
            tags: ['Loan'],
            summary: 'Get member loans',
            description: 'Retrieve all loans for a specific member',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'biodataId',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Member loans retrieved successfully'
                }
            }
        }
    },
    '/loan/{id}': {
        get: {
            tags: ['Loan'],
            summary: 'Get loan details',
            description: 'Get detailed information about a specific loan',
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
                    description: 'Loan details retrieved successfully'
                }
            }
        }
    },
    '/loan/{id}/status': {
        patch: {
            tags: ['Loan'],
            summary: 'Update loan status',
            description: 'Update the status of a loan (requires appropriate approval level)',
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
                            $ref: '#/components/schemas/LoanStatusUpdate'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Loan status updated successfully'
                }
            }
        }
    },
    '/loan/summary': {
        get: {
            tags: ['Loan'],
            summary: 'Get loans summary',
            description: 'Get summary statistics of all loans',
            security: [{ bearerAuth: [] }],
            parameters: [
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
                    description: 'Loan summary retrieved successfully'
                }
            }
        }
    },
    '/loan/repayment/process': {
        post: {
            tags: ['Loan Repayment'],
            summary: 'Process loan repayment',
            description: 'Process a single loan repayment (Treasurer level)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/LoanRepaymentRequest'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Repayment processed successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/RepaymentResult'
                            }
                        }
                    }
                },
                '400': {
                    description: 'Invalid repayment data',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/ErrorResponse'
                            }
                        }
                    }
                }
            }
        }
    },
    '/loan/repayment/bulk': {
        post: {
            tags: ['Loan Repayment'],
            summary: 'Process bulk repayments',
            description: 'Process multiple loan repayments via Excel file upload (Treasurer level)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            properties: {
                                file: {
                                    type: 'string',
                                    format: 'binary',
                                    description: 'Excel file containing repayment records'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Bulk repayments processed successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/BulkRepaymentResult'
                            }
                        }
                    }
                }
            }
        }
    },
    '/loan/repayment/template': {
        get: {
            tags: ['Loan Repayment'],
            summary: 'Download repayment template',
            description: 'Download template for bulk repayment upload with pre-populated expected repayments',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'month',
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 12
                    },
                    description: 'Month for which the template should be generated (1-12), defaults to current month'
                },
                {
                    in: 'query',
                    name: 'year',
                    schema: {
                        type: 'integer'
                    },
                    description: 'Year for which the template should be generated, defaults to current year'
                }
            ],
            responses: {
                '200': {
                    description: 'Template Excel file downloaded successfully',
                    content: {
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                            schema: {
                                type: 'string',
                                format: 'binary'
                            }
                        }
                    }
                },
                '500': {
                    description: 'Error generating template',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: {
                                        type: 'boolean',
                                        example: false
                                    },
                                    status: {
                                        type: 'string',
                                        example: 'error'
                                    },
                                    message: {
                                        type: 'string',
                                        example: 'Error generating repayment template'
                                    },
                                    code: {
                                        type: 'integer',
                                        example: 500
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/loan/repayment/loan/{loanId}': {
        get: {
            tags: ['Loan Repayment'],
            summary: 'Get loan repayment history',
            description: 'Get detailed repayment history for a specific loan',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'loanId',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    },
                    description: 'ID of the loan to retrieve repayment history'
                }
            ],
            responses: {
                '200': {
                    description: 'Repayment history retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/RepaymentHistory'
                            }
                        }
                    }
                }
            }
        }
    },
    '/loan/repayment/outstanding': {
        get: {
            tags: ['Loan Repayment'],
            summary: 'Get outstanding loans',
            description: 'Get all loans with outstanding repayments (Treasurer level)',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Outstanding loans retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/OutstandingLoan'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/loan/repayment/member/{erpId}': {
        get: {
            tags: ['Loan Repayment'],
            summary: 'Get member repayment history',
            description: 'Get complete repayment history for all loans of a member',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'erpId',
                    required: true,
                    schema: {
                        type: 'string'
                    },
                    description: 'ERP ID of the member'
                }
            ],
            responses: {
                '200': {
                    description: 'Member repayment history retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/LoanWithRepayments'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/loan/repayment/aging-report': {
        get: {
            tags: ['Loan Repayment'],
            summary: 'Get loan aging report',
            description: 'Generate a comprehensive aging report for overdue loan repayments',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Aging report generated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/AgingReport'
                            }
                        }
                    }
                }
            }
        }
    },
    '/loan/repayment/check-overdue': {
        post: {
            tags: ['Loan Repayment'],
            summary: 'Check and update overdue payments',
            description: 'Automatically mark schedules as overdue and potentially set loans as defaulted',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Overdue payments checked and updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: {
                                        type: 'boolean'
                                    },
                                    message: {
                                        type: 'string'
                                    },
                                    updatedCount: {
                                        type: 'integer',
                                        description: 'Number of schedules updated'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/loan/repayment/monthly-report': {
        get: {
            tags: ['Loan Repayment'],
            summary: 'Get monthly repayment report',
            description: 'Generate a monthly repayment report for specific month and year',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'month',
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 12
                    },
                    description: 'Month for the report (1-12)'
                },
                {
                    in: 'query',
                    name: 'year',
                    schema: {
                        type: 'integer'
                    },
                    description: 'Year for the report'
                }
            ],
            responses: {
                '200': {
                    description: 'Monthly report generated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/MonthlyRepaymentReport'
                            }
                        }
                    }
                }
            }
        }
    },
    '/loan/repayment/monthly-template': {
        get: {
            tags: ['Loan Repayment'],
            summary: 'Download monthly repayment template by loan type',
            description: 'Download an organized template with separate sheets for each loan type',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'month',
                    schema: {
                        type: 'integer',
                        minimum: 1,
                        maximum: 12
                    },
                    description: 'Month for which the template should be generated (1-12)'
                },
                {
                    in: 'query',
                    name: 'year',
                    schema: {
                        type: 'integer'
                    },
                    description: 'Year for which the template should be generated'
                }
            ],
            responses: {
                '200': {
                    description: 'Template Excel file downloaded successfully',
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
    }
}