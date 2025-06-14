export const accountPaths = {
    '/accounts': {
        post: {
            tags: ['Account'],
            summary: 'Create bank account',
            description: 'Create a new bank account for the authenticated member',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/CreateAccountRequest'
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'Account created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Account'
                            }
                        }
                    }
                },
                '400': {
                    description: 'Invalid input data'
                },
                '401': {
                    description: 'Not authenticated'
                }
            }
        },
        get: {
            tags: ['Account'],
            summary: 'Get all accounts',
            description: 'Retrieve all bank accounts (admin only)',
            security: [{ bearerAuth: [] }],
            parameters: [
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
                        default: 10
                    },
                    description: 'Items per page'
                },
                {
                    in: 'query',
                    name: 'status',
                    schema: {
                        type: 'string',
                        enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED']
                    },
                    description: 'Filter by account status'
                },
                {
                    in: 'query',
                    name: 'verificationStatus',
                    schema: {
                        type: 'string',
                        enum: ['PENDING', 'VERIFIED', 'REJECTED']
                    },
                    description: 'Filter by verification status'
                }
            ],
            responses: {
                '200': {
                    description: 'List of accounts retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: {
                                            $ref: '#/components/schemas/Account'
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
                },
                '401': {
                    description: 'Not authenticated'
                },
                '403': {
                    description: 'Not authorized to view accounts'
                }
            }
        }
    },
    '/accounts/me': {
        get: {
            tags: ['Account'],
            summary: 'Get my account',
            description: 'Get the authenticated user\'s bank account details',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Account retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Account'
                            }
                        }
                    }
                },
                '401': {
                    description: 'Not authenticated'
                },
                '404': {
                    description: 'Account not found'
                }
            }
        }
    },
    '/accounts/{id}': {
        get: {
            tags: ['Account'],
            summary: 'Get account by ID',
            description: 'Get bank account details by ID (admin only)',
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
                    description: 'Account ID'
                }
            ],
            responses: {
                '200': {
                    description: 'Account retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Account'
                            }
                        }
                    }
                },
                '401': {
                    description: 'Not authenticated'
                },
                '403': {
                    description: 'Not authorized to view accounts'
                },
                '404': {
                    description: 'Account not found'
                }
            }
        }
    },
    '/accounts/{id}/update-request': {
        post: {
            tags: ['Account'],
            summary: 'Request account update',
            description: 'Submit a request to update bank account details',
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
                    description: 'Account ID'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/UpdateAccountRequest'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Update request submitted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    requestId: {
                                        type: 'string',
                                        format: 'uuid'
                                    },
                                    status: {
                                        type: 'string',
                                        enum: ['PENDING']
                                    }
                                }
                            }
                        }
                    }
                },
                '401': {
                    description: 'Not authenticated'
                },
                '404': {
                    description: 'Account not found'
                }
            }
        }
    },
    '/accounts/verify': {
        post: {
            tags: ['Account'],
            summary: 'Verify account',
            description: 'Verify or reject a bank account (verifier only)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/VerifyAccountRequest'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Account verified successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Account'
                            }
                        }
                    }
                },
                '401': {
                    description: 'Not authenticated'
                },
                '403': {
                    description: 'Not authorized to verify accounts'
                },
                '404': {
                    description: 'Account not found'
                }
            }
        }
    },
    '/accounts/requests/{requestId}/process': {
        post: {
            tags: ['Account'],
            summary: 'Process account update request',
            description: 'Approve or reject an account update request (approver only)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'requestId',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    },
                    description: 'Request ID'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ProcessAccountRequestRequest'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Request processed successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Account'
                            }
                        }
                    }
                },
                '401': {
                    description: 'Not authenticated'
                },
                '403': {
                    description: 'Not authorized to process account requests'
                },
                '404': {
                    description: 'Request not found'
                }
            }
        }
    }
};
