export const requestSchemas = {
    Request: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid'
            },
            type: {
                type: 'string',
                enum: ['LOAN_APPLICATION', 'BIODATA_APPROVAL', 'ACCOUNT_UPDATE', 'SAVINGS_WITHDRAWAL', 'SHARE_WITHDRAWAL']
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
            },
            priority: {
                type: 'string',
                enum: ['HIGH', 'MEDIUM', 'LOW']
            },
            initiatedBy: {
                type: 'string',
                format: 'uuid'
            },
            assignedTo: {
                type: 'string',
                format: 'uuid'
            },
            approvalSteps: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        level: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 3
                        },
                        status: {
                            type: 'string',
                            enum: ['PENDING', 'APPROVED', 'REJECTED']
                        },
                        approverRole: {
                            type: 'string'
                        }
                    }
                }
            }
        }
    },
    CreateRequest: {
        type: 'object',
        required: ['type'],
        properties: {
            type: {
                type: 'string',
                enum: ['LOAN_APPLICATION', 'BIODATA_APPROVAL', 'ACCOUNT_UPDATE', 'SAVINGS_WITHDRAWAL', 'SHARE_WITHDRAWAL']
            },
            priority: {
                type: 'string',
                enum: ['HIGH', 'MEDIUM', 'LOW']
            },
            details: {
                type: 'object'
            }
        }
    },
    UpdateRequest: {
        type: 'object',
        required: ['status'],
        properties: {
            status: {
                type: 'string',
                enum: ['APPROVED', 'REJECTED', 'CANCELLED']
            },
            comment: {
                type: 'string'
            }
        }
    },
    RequestQuery: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                enum: ['LOAN_APPLICATION', 'BIODATA_APPROVAL', 'ACCOUNT_UPDATE', 'SAVINGS_WITHDRAWAL', 'SHARE_WITHDRAWAL']
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']
            },
            startDate: {
                type: 'string',
                format: 'date'
            },
            endDate: {
                type: 'string',
                format: 'date'
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
    }
}
