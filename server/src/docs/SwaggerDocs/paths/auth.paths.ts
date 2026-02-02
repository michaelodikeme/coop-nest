export const authPaths = {
    '/auth/login': {
        post: {
            tags: ['Authentication'],
            summary: 'Login to the system',
            description: 'Authenticate user and get access token',
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
    '/auth/user': {
        post: {
            tags: ['Authentication'],
            summary: 'Create new user',
            description: 'Create a new user account',
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['username', 'password'],
                            properties: {
                                username: {
                                    type: 'string',
                                    description: 'Unique username'
                                },
                                password: {
                                    type: 'string',
                                    format: 'password',
                                    description: 'User password'
                                },
                                biodataId: {
                                    type: 'string',
                                    format: 'uuid',
                                    description: 'Associated biodata ID'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                '201': {
                    description: 'User created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/User'
                            }
                        }
                    }
                },
                '400': {
                    description: 'Invalid input data'
                },
                '409': {
                    description: 'Username already exists'
                }
            }
        }
    },
    '/auth/logout': {
        post: {
            tags: ['Authentication'],
            summary: 'Logout user',
            description: 'Invalidate current session',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Logout successful'
                },
                '401': {
                    description: 'Not authenticated'
                }
            }
        }
    },
    '/auth/me/sessions': {
        get: {
            tags: ['Authentication'],
            summary: 'Get user sessions',
            description: 'Get all active sessions for current user',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Sessions retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        id: {
                                            type: 'string',
                                            format: 'uuid'
                                        },
                                        deviceInfo: {
                                            type: 'string'
                                        },
                                        lastActive: {
                                            type: 'string',
                                            format: 'date-time'
                                        },
                                        isCurrentSession: {
                                            type: 'boolean'
                                        }
                                    }
                                }
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
    '/auth/me/sessions/invalidate-all': {
        post: {
            tags: ['Authentication'],
            summary: 'Invalidate all sessions',
            description: 'Invalidate all active sessions for current user',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'All sessions invalidated successfully'
                },
                '401': {
                    description: 'Not authenticated'
                }
            }
        }
    }
};
