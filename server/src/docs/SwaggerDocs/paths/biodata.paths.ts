export const biodataPaths = {
    '/biodata/verify': {
        post: {
            tags: ['Biodata'],
            summary: 'Initial biodata verification',
            description: 'Verify biodata information',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['biodataId'],
                            properties: {
                                phoneNumber: {
                                    type: 'string',
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Verification initiated successfully'
                },
                '400': {
                    description: 'Invalid input'
                }
            }
        }
    },
    '/biodata/verify-otp': {
        post: {
            tags: ['Biodata'],
            summary: 'Verify phone OTP',
            description: 'Verify phone number using OTP',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['otp'],
                            properties: {
                                otp: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Phone number verified successfully'
                },
                '400': {
                    description: 'Invalid OTP'
                }
            }
        }
    },
    
    '/biodata': {
        post: {
            tags: ['Biodata Management'],
            summary: 'Create new biodata',
            description: 'Create a new member biodata record (Requires ADMIN role and CREATE_MEMBERS permission)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/CreateBiodataRequest'
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Biodata created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/BiodataResponse'
                            }
                        }
                    }
                },
                '400': {
                    description: 'Invalid input or member already exists'
                },
                '403': {
                    description: 'Insufficient permissions or approval level'
                }
            }
        },
        get: {
            tags: ['Biodata Management'],
            summary: 'Get all biodata',
            description: 'Get list of all biodata records (Requires VIEW_MEMBERS permission)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'searchTerm',
                    schema: { type: 'string' },
                    description: 'Search by name, staff no, ERP ID, or IPPIS ID'
                },
                {
                    in: 'query',
                    name: 'department',
                    schema: { type: 'string' }
                },
                {
                    in: 'query',
                    name: 'isVerified',
                    schema: { type: 'boolean' }
                },
                {
                    in: 'query',
                    name: 'isApproved',
                    schema: { type: 'boolean' }
                },
                {
                    in: 'query',
                    name: 'membershipStatus',
                    schema: {
                        type: 'string',
                        enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED']
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Success',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/BiodataListResponse'
                            }
                        }
                    }
                }
            }
        }
    },

    '/biodata/member/unapproved': {
        get: {
            tags: ['Biodata Management'],
            summary: 'Get unapproved biodata',
            description: 'Get biodata records pending approval (Requires approval level 2)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'query',
                    name: 'page',
                    schema: { type: 'integer', default: 1 }
                },
                {
                    in: 'query',
                    name: 'limit',
                    schema: { type: 'integer', default: 10 }
                },
                {
                    in: 'query',
                    name: 'department',
                    schema: { type: 'string' }
                },
                {
                    in: 'query',
                    name: 'searchTerm',
                    schema: { type: 'string' }
                }
            ],
            responses: {
                '200': {
                    description: 'Success',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/BiodataListResponse'
                            }
                        }
                    }
                },
                '403': {
                    description: 'Insufficient approval level'
                }
            }
        }
    },

    '/biodata/member/approve': {
        post: {
            tags: ['Biodata Approval'],
            summary: 'Approve biodata',
            description: 'Approve biodata record (supports both request-based and legacy approvals)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/BiodataApprovalRequest'
                        },
                        examples: {
                            requestApproval: {
                                summary: 'Approve with request ID',
                                value: {
                                    requestId: "uuid-of-request",
                                    approverNotes: "Approved after verification"
                                }
                            },
                            legacyApproval: {
                                summary: 'Approve legacy biodata',
                                value: {
                                    biodataId: "uuid-of-biodata",
                                    approverNotes: "Legacy data verified and approved"
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Biodata approved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/BiodataApprovalResponse'
                            },
                            examples: {
                                requestApproval: {
                                    summary: 'Request-based approval response',
                                    value: {
                                        request: {
                                            id: "request-uuid",
                                            status: "APPROVED",
                                            completedAt: "2025-05-21T22:39:35Z"
                                        },
                                        biodata: {
                                            id: "biodata-uuid",
                                            isApproved: true,
                                            membershipStatus: "ACTIVE"
                                        }
                                    }
                                },
                                legacyApproval: {
                                    summary: 'Legacy approval response',
                                    value: {
                                        request: {
                                            id: "new-request-uuid",
                                            status: "APPROVED",
                                            completedAt: "2025-05-21T22:39:35Z"
                                        },
                                        biodata: {
                                            id: "biodata-uuid",
                                            isApproved: true,
                                            membershipStatus: "ACTIVE"
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                '400': {
                    description: 'Invalid request or biodata already approved',
                    content: {
                        'application/json': {
                            examples: {
                                alreadyApproved: {
                                    summary: 'Already approved',
                                    value: {
                                        message: 'Biodata already approved'
                                    }
                                },
                                invalidRequest: {
                                    summary: 'Invalid request',
                                    value: {
                                        message: 'Pending approval request not found'
                                    }
                                }
                            }
                        }
                    }
                },
                '403': {
                    description: 'Insufficient approval level',
                    content: {
                        'application/json': {
                            example: {
                                message: 'Insufficient approval level. Requires Treasurer (Level 2) or higher.'
                            }
                        }
                    }
                },
                '404': {
                    description: 'Biodata or request not found'
                }
            }
        }
    },

    '/biodata/member/{id}/status': {
        post: {
            tags: ['Biodata'],
            summary: 'Update membership status',
            description: 'Update member\'s membership status',
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
                    description: 'Biodata ID'
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
                                    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']
                                },
                                reason: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Membership status updated successfully'
                },
                '401': {
                    description: 'Not authenticated'
                },
                '403': {
                    description: 'Insufficient permissions'
                }
            }
        }
    },
    '/biodata/upload': {
        post: {
            tags: ['Biodata'],
            summary: 'Upload biodata records',
            description: 'Upload multiple biodata records via Excel file (Treasurer and above)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            $ref: '#/components/schemas/BiodataUpload'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Upload initiated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    requestId: {
                                        type: 'string'
                                    },
                                    status: {
                                        type: 'string',
                                        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/biodata/upload/{requestId}/status': {
        get: {
            tags: ['Biodata'],
            summary: 'Check upload status',
            description: 'Check the status of a biodata upload request',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'requestId',
                    required: true,
                    schema: {
                        type: 'string'
                    },
                    description: 'Upload request ID'
                }
            ],
            responses: {
                '200': {
                    description: 'Upload status retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    status: {
                                        type: 'string',
                                        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']
                                    },
                                    progress: {
                                        type: 'number'
                                    },
                                    totalRecords: {
                                        type: 'number'
                                    },
                                    processedRecords: {
                                        type: 'number'
                                    },
                                    errors: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                row: {
                                                    type: 'number'
                                                },
                                                message: {
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
            }
        }
    },
    '/biodata/upload/{requestId}/cancel': {
        post: {
            tags: ['Biodata'],
            summary: 'Cancel upload',
            description: 'Cancel an ongoing biodata upload request',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'requestId',
                    required: true,
                    schema: {
                        type: 'string'
                    },
                    description: 'Upload request ID'
                }
            ],
            responses: {
                '200': {
                    description: 'Upload cancelled successfully'
                },
                '400': {
                    description: 'Cannot cancel upload'
                }
            }
        }
    },
    '/biodata/{id}': {
        get: {
            tags: ['Biodata'],
            summary: 'Get biodata by ID',
            description: 'Retrieve biodata record by ID',
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
                    description: 'Biodata ID'
                }
            ],
            responses: {
                '200': {
                    description: 'Biodata record retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Biodata'
                            }
                        }
                    }
                }
            }
        },
        put: {
            tags: ['Biodata'],
            summary: 'Update biodata',
            description: 'Update biodata record',
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
                    description: 'Biodata ID'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/Biodata'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Biodata updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Biodata'
                            }
                        }
                    }
                }
            }
        },
        delete: {
            tags: ['Biodata'],
            summary: 'Delete biodata',
            description: 'Delete biodata record (Admin only)',
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
                    description: 'Biodata ID'
                }
            ],
            responses: {
                '200': {
                    description: 'Biodata deleted successfully'
                },
                '403': {
                    description: 'Not authorized to delete biodata'
                }
            }
        }
    },
    '/biodata/{id}/verify': {
        post: {
            tags: ['Biodata'],
            summary: 'Verify biodata record',
            description: 'Verify or reject a member\'s biodata record',
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
                    description: 'Biodata record ID'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/BiodataVerificationRequest'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Biodata verification status updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Biodata'
                            }
                        }
                    }
                },
                '400': {
                    description: 'Invalid verification request'
                },
                '401': {
                    description: 'Not authenticated'
                },
                '403': {
                    description: 'Not authorized to verify biodata records'
                },
                '404': {
                    description: 'Biodata record not found'
                }
            }
        }
    },

    '/biodata/backup/export': {
        get: {
            tags: ['Biodata Backup'],
            summary: 'Export biodata backup',
            description: 'Generate and download Excel backup of all biodata records',
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
                },
                '400': {
                    description: 'No data to backup',
                    content: {
                        'application/json': {
                            example: {
                                message: 'No active biodata entries found'
                            }
                        }
                    }
                },
                '403': {
                    description: 'Insufficient permissions',
                    content: {
                        'application/json': {
                            example: {
                                message: 'Requires ADMIN or CHAIRMAN role and VIEW_MEMBERS permission'
                            }
                        }
                    }
                },
                '500': {
                    description: 'Server error',
                    content: {
                        'application/json': {
                            example: {
                                message: 'Failed to generate backup file'
                            }
                        }
                    }
                }
            }
        }
    }
};
