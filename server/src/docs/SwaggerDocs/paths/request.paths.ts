export const requestPaths = {
    '/requests/user': {
        get: {
            tags: ['Request'],
            summary: 'Get user requests',
            description: 'Get all requests created by the authenticated user',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    $ref: '#/components/schemas/RequestQuery'
                }
            ],
            responses: {
                '200': {
                    description: 'User requests retrieved successfully',
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
    '/requests': {
        get: {
            tags: ['Request'],
            summary: 'Get all requests',
            description: 'Get all requests in the system (admin only)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    $ref: '#/components/schemas/RequestQuery'
                }
            ],
            responses: {
                '200': {
                    description: 'Requests retrieved successfully',
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
    '/requests/pending-count': {
        get: {
            tags: ['Request'],
            summary: 'Get pending request count',
            description: 'Get count of pending requests',
            security: [{ bearerAuth: [] }],
            responses: {
                '200': {
                    description: 'Pending request count retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    count: {
                                        type: 'integer'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/requests/{id}': {
        get: {
            tags: ['Request'],
            summary: 'Get request details',
            description: 'Get detailed information about a specific request',
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
                    description: 'Request details retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Request'
                            }
                        }
                    }
                }
            }
        },
        put: {
            tags: ['Request'],
            summary: 'Update request',
            description: 'Update a request\'s status',
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
                            $ref: '#/components/schemas/UpdateRequest'
                        }
                    }
                }
            },
            responses: {
                '200': {
                    description: 'Request updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Request'
                            }
                        }
                    }
                }
            }
        },
        delete: {
            tags: ['Request'],
            summary: 'Delete request',
            description: 'Delete a request',
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
                    description: 'Request deleted successfully'
                }
            }
        }
    }
}
