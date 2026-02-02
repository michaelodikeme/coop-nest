export const userSchemas = {
    User: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid',
                description: 'User unique identifier'
            },
            biodataId: {
                type: 'string',
                format: 'uuid',
                description: 'Associated biodata identifier'
            },
            username: {
                type: 'string',
                description: 'User\'s unique username'
            },
            isActive: {
                type: 'boolean',
                description: 'User account status'
            },
            isMember: {
                type: 'boolean',
                description: 'Membership status'
            },
            roles: {
                type: 'array',
                items: {
                    $ref: '#/components/schemas/Role'
                },
                description: 'User assigned roles'
            }
        }
    },
    Role: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                format: 'uuid'
            },
            name: {
                type: 'string',
                description: 'Role name'
            },
            permissions: {
                type: 'array',
                items: {
                    type: 'string'
                },
                description: 'Role permissions'
            },
            approvalLevel: {
                type: 'integer',
                description: 'Role approval level in hierarchy'
            },
            moduleAccess: {
                type: 'array',
                items: {
                    type: 'string'
                },
                description: 'Accessible modules for this role'
            }
        }
    },
    LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
            username: {
                type: 'string',
                description: 'User\'s username'
            },
            password: {
                type: 'string',
                format: 'password',
                description: 'User\'s password'
            }
        }
    },
    LoginResponse: {
        type: 'object',
        properties: {
            token: {
                type: 'string',
                description: 'JWT authentication token'
            },
            user: {
                $ref: '#/components/schemas/User'
            }
        }
    },
    ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword', '"confirmPassword"'],
        properties: {
            currentPassword: {
                type: 'string',
                format: 'password'
            },
            newPassword: {
                type: 'string',
                format: 'password'
            },
            confirmPassword: {
                type: 'string',
                format: 'password'
            }
        }
    },
    UserPermissions: {
        type: 'object',
        properties: {
            roles: {
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            permissions: {
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            moduleAccess: {
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            approvalLevel: {
                type: 'integer'
            },
            canApprove: {
                type: 'boolean'
            }
        }
    },
    AssignRoleRequest: {
        type: 'object',
        required: ['userId', 'roleId'],
        properties: {
            userId: {
                type: 'string',
                format: 'uuid'
            },
            roleId: {
                type: 'string',
                format: 'uuid'
            },
            expiresAt: {
                type: 'string',
                format: 'date-time'
            }
        }
    },
    UpdateRoleRequest: {
        type: 'object',
        properties: {
            isActive: {
                type: 'boolean'
            },
            expiresAt: {
                type: 'string',
                format: 'date-time'
            }
        }
    }
};
