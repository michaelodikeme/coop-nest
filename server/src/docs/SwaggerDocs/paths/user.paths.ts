export const userPaths = {
    '/auth/login': {
        post: {
            tags: ['Authentication'],
            summary: 'Login to the system',
            description: 'Authenticate user and get access token',
            operationId: 'login',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/LoginRequest'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Login successful',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/LoginResponse'
                            }
                        }
                    }
                },
                '401': {
                    description: 'Invalid credentials'
                }
            }
        }
    },
    '/users/me': {
        get: {
            tags: ['User'],
            summary: 'Get current user profile',
            description: 'Retrieve the profile of the currently authenticated user',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'User profile retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/User'
                            }
                        }
                    }
                },
                '401': {
                    description: 'Not authenticated'
                }
            }
        }
    },
    '/users/me/change-password': {
        post: {
            tags: ['User'],
            summary: 'Change user password',
            description: 'Change the password of the currently authenticated user',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/ChangePasswordRequest'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Password changed successfully'
                },
                '401': {
                    description: 'Invalid current password'
                }
            }
        }
    },
    '/users/me/update-username': {
        post: {
            tags: ['User'],
            summary: 'Request username update',
            description: 'Submit a request to update username (requires approval)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                username: {
                                    type: 'string',
                                    minLength: 3
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Username update request submitted successfully'
                },
                '400': {
                    description: 'Invalid request or pending request exists'
                },
                '403': {
                    description: 'Unauthorized'
                }
            }
        }
    },
    '/users/me/permissions': {
        get: {
            tags: ['User'],
            summary: 'Get user permissions',
            description: 'Get permissions for the currently authenticated user',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Permissions retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/UserPermissions'
                            }
                        }
                    }
                }
            }
        }
    },
    '/users/me/module-access': {
        get: {
            tags: ['User'],
            summary: 'Get user module access',
            description: 'Get module access rights for the currently authenticated user',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Module access retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    type: 'string',
                                    enum: ['ADMIN', 'MEMBER', 'LOAN', 'SAVINGS']
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/users/me/requests/assigned': {
        get: {
            tags: ['User Requests'],
            summary: 'Get assigned requests',
            description: 'Get requests assigned to the current user for approval',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Assigned requests retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/Request'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/users/me/requests/initiated': {
        get: {
            tags: ['User Requests'],
            summary: 'Get initiated requests',
            description: 'Get requests initiated by the current user',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Initiated requests retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/Request'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/users/me/requests/approved': {
        get: {
            tags: ['User Requests'],
            summary: 'Get approved requests',
            description: 'Get requests approved by the current user',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Approved requests retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/Request'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/users/assign-role': {
        post: {
            tags: ['User Management'],
            summary: 'Assign role to user',
            description: 'Assign a role to a user (Requires MANAGE_ROLES permission)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/AssignRoleRequest'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Role assigned successfully'
                },
                '403': {
                    description: 'Insufficient permissions'
                }
            }
        }
    },
    '/users/roles/{userRoleId}': {
        put: {
            tags: ['User Management'],
            summary: 'Update user role',
            description: 'Update user role assignment (Requires MANAGE_ROLES permission)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'userRoleId',
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
                            $ref: '#/components/schemas/UpdateRoleRequest'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Role updated successfully'
                }
            }
        }
    },
    '/users/by-role/{roleId}': {
        get: {
            tags: ['User Management'],
            summary: 'Get users by role',
            description: 'Get all users with a specific role',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'roleId',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Users retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/User'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/users/approvers/{level}': {
        get: {
            tags: ['User Management'],
            summary: 'Get approvers by level',
            description: 'Get users who can approve at a specific level',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'level',
                    required: true,
                    schema: {
                        type: 'integer',
                        minimum: 1
                    }
                }
            ],
            responses: {
                '200': {
                    description: 'Approvers retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/User'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/users/requests/{requestId}/approve-username': {
        post: {
            tags: ['User Management'],
            summary: 'Approve username update',
            description: 'Approve or reject a username update request',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'requestId',
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
                                    enum: ['APPROVED', 'REJECTED']
                                },
                                comment: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Username update request processed successfully'
                }
            }
        }
    },
    '/users/{id}/deactivate': {
        post: {
            tags: ['User Management'],
            summary: 'Deactivate user',
            description: 'Deactivate a user account (Requires MANAGE_USERS permission)',
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
                    description: 'User deactivated successfully'
                }
            }
        }
    }
};