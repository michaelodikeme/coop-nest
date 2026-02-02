export const accountSchemas = {
    Account: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid',
                description: 'Account unique identifier'
            },
            userId: {
                type: 'string',
                format: 'uuid',
                description: 'Associated user ID'
            },
            accountNumber: {
                type: 'string',
                description: 'Bank account number'
            },
            bankCode: {
                type: 'string',
                description: 'Bank code/identifier'
            },
            bankName: {
                type: 'string',
                description: 'Name of the bank'
            },
            accountName: {
                type: 'string',
                description: 'Name on the bank account'
            },
            status: {
                type: 'string',
                enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED'],
                description: 'Account status'
            },
            verificationStatus: {
                type: 'string',
                enum: ['PENDING', 'VERIFIED', 'REJECTED'],
                description: 'Account verification status'
            }
        }
    },
    CreateAccountRequest: {
        type: 'object',
        required: ['accountNumber', 'bankCode', 'accountName'],
        properties: {
            accountNumber: {
                type: 'string',
                description: 'Bank account number'
            },
            bankCode: {
                type: 'string',
                description: 'Bank code/identifier'
            },
            accountName: {
                type: 'string',
                description: 'Name on the bank account'
            }
        }
    },
    UpdateAccountRequest: {
        type: 'object',
        required: ['accountNumber', 'bankCode', 'accountName'],
        properties: {
            accountNumber: {
                type: 'string',
                description: 'New bank account number'
            },
            bankCode: {
                type: 'string',
                description: 'New bank code/identifier'
            },
            accountName: {
                type: 'string',
                description: 'New name on the bank account'
            },
            reason: {
                type: 'string',
                description: 'Reason for account update'
            }
        }
    },
    VerifyAccountRequest: {
        type: 'object',
        required: ['accountId', 'status'],
        properties: {
            accountId: {
                type: 'string',
                format: 'uuid',
                description: 'ID of the account to verify'
            },
            status: {
                type: 'string',
                enum: ['VERIFIED', 'REJECTED'],
                description: 'Verification status to set'
            },
            comment: {
                type: 'string',
                description: 'Verification comment or rejection reason'
            }
        }
    },
    ProcessAccountRequestRequest: {
        type: 'object',
        required: ['status', 'comment'],
        properties: {
            status: {
                type: 'string',
                enum: ['APPROVED', 'REJECTED'],
                description: 'Decision on the account update request'
            },
            comment: {
                type: 'string',
                description: 'Comment explaining the decision'
            }
        }
    }
};
