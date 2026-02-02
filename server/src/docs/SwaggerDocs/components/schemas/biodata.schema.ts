export const biodataSchemas = {
    CreateBiodataRequest: {
        type: 'object',
        required: [
            'erpId',
            'ippisId',
            'firstName',
            'lastName',
            'dateOfEmployment',
            'staffNo',
            'department',
            'residentialAddress',
            'emailAddress',
            'phoneNumber',
            'nextOfKin',
            'relationshipOfNextOfKin',
            'nextOfKinPhoneNumber',
            'nextOfKinEmailAddress'
        ],
        properties: {
            erpId: {
                type: 'string',
                description: 'ERP identification number'
            },
            ippisId: {
                type: 'string',
                description: 'IPPIS identification number'
            },
            firstName: {
                type: 'string',
                minLength: 2,
                description: 'Member\'s first name'
            },
            middleName: {
                type: 'string',
                description: 'Member\'s middle name (optional)'
            },
            lastName: {
                type: 'string',
                minLength: 2,
                description: 'Member\'s last name'
            },
            dateOfEmployment: {
                type: 'string',
                format: 'date',
                description: 'Date of employment'
            },
            staffNo: {
                type: 'string',
                description: 'Staff number'
            },
            department: {
                type: 'string',
                description: 'Department or unit'
            },
            residentialAddress: {
                type: 'string',
                minLength: 5,
                description: 'Residential address'
            },
            emailAddress: {
                type: 'string',
                format: 'email',
                description: 'Work email address'
            },
            phoneNumber: {
                type: 'string',
                description: 'Nigerian phone number in international format'
            },
            nextOfKin: {
                type: 'string',
                minLength: 2,
                description: 'Next of kin full name'
            },
            relationshipOfNextOfKin: {
                type: 'string',
                minLength: 2,
                description: 'Relationship with next of kin'
            },
            nextOfKinPhoneNumber: {
                type: 'string',
                description: 'Next of kin Nigerian phone number in international format'
            },
            nextOfKinEmailAddress: {
                type: 'string',
                format: 'email',
                description: 'Next of kin email address'
            },
            profilePhoto: {
                type: 'string',
                description: 'Profile photo URL (optional)'
            }
        }
    },

    BiodataResponse: {
        allOf: [
            { $ref: '#/components/schemas/CreateBiodataRequest' },
            {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid'
                    },
                    fullName: {
                        type: 'string'
                    },
                    membershipStatus: {
                        type: 'string',
                        enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED']
                    },
                    isVerified: {
                        type: 'boolean'
                    },
                    isApproved: {
                        type: 'boolean'
                    },
                    isDeleted: {
                        type: 'boolean'
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
            }
        ]
    },

    BiodataListResponse: {
        type: 'object',
        properties: {
            data: {
                type: 'array',
                items: {
                    $ref: '#/components/schemas/BiodataResponse'
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
    },

    BiodataStatusUpdate: {
        type: 'object',
        required: ['membershipStatus', 'reason'],
        properties: {
            membershipStatus: {
                type: 'string',
                enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED'],
                description: 'New membership status'
            },
            reason: {
                type: 'string',
                description: 'Reason for status change'
            }
        }
    },

    BiodataApprovalRequest: {
        oneOf: [
            {
                type: 'object',
                required: ['requestId', 'approverNotes'],
                description: 'For approving biodata with pending requests',
                properties: {
                    requestId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID of the pending approval request'
                    },
                    approverNotes: {
                        type: 'string',
                        description: 'Notes from the approver'
                    }
                }
            },
            {
                type: 'object',
                required: ['biodataId', 'approverNotes'],
                description: 'For approving legacy/seeded biodata without requests',
                properties: {
                    biodataId: {
                        type: 'string',
                        format: 'uuid',
                        description: 'ID of the biodata to approve'
                    },
                    approverNotes: {
                        type: 'string',
                        description: 'Notes from the approver'
                    }
                }
            }
        ]
    },

    BiodataApprovalResponse: {
        type: 'object',
        properties: {
            request: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid'
                    },
                    status: {
                        type: 'string',
                        enum: ['PENDING', 'APPROVED', 'REJECTED']
                    },
                    completedAt: {
                        type: 'string',
                        format: 'date-time'
                    }
                }
            },
            biodata: {
                $ref: '#/components/schemas/BiodataResponse'
            }
        }
    },

    BiodataUpload: {
        type: 'object',
        required: ['file'],
        properties: {
            file: {
                type: 'string',
                format: 'binary',
                description: 'Excel file containing biodata records'
            }
        }
    },
    
    BiodataVerificationRequest: {
        type: 'object',
        required: ['biodataId', 'status'],
        properties: {
            biodataId: {
                type: 'string',
                format: 'uuid'
            },
            status: {
                type: 'string',
                enum: ['VERIFIED', 'REJECTED']
            },
            comment: {
                type: 'string',
                description: 'Verification comment or reason for rejection'
            }
        }
    },

    BiodataAccountInfo: {
        type: 'object',
        required: ['bankId', 'accountNumber', 'bvn', 'accountName'],
        properties: {
            bankId: {
                type: 'string',
                format: 'uuid',
                description: 'Bank ID'
            },
            accountNumber: {
                type: 'string',
                pattern: '^\\d{10}$',
                description: '10-digit account number'
            },
            bvn: {
                type: 'string',
                pattern: '^\\d{11}$',
                description: '11-digit BVN'
            },
            accountName: {
                type: 'string',
                minLength: 2,
                description: 'Account holder name'
            }
        }
    },

    BiodataQueryFilters: {
        type: 'object',
        properties: {
            erpId: {
                type: 'string'
            },
            ippisId: {
                type: 'string'
            },
            staffNo: {
                type: 'string'
            },
            department: {
                type: 'string'
            },
            isVerified: {
                type: 'boolean'
            },
            isApproved: {
                type: 'boolean'
            },
            isDeleted: {
                type: 'boolean'
            },
            membershipStatus: {
                type: 'string',
                enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED']
            },
            searchTerm: {
                type: 'string',
                description: 'Search across multiple fields'
            }
        }
    },

    BiodataBackupResponse: {
        type: 'object',
        properties: {
            filename: {
                type: 'string',
                description: 'Name of the generated backup file'
            },
            path: {
                type: 'string',
                description: 'Path where the backup file is stored'
            },
            timestamp: {
                type: 'string',
                format: 'date-time',
                description: 'When the backup was created'
            },
            totalRecords: {
                type: 'integer',
                description: 'Number of biodata records backed up'
            }
        }
    }
};
