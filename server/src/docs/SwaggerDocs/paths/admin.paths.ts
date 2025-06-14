export const adminPaths = {
  '/users/admin/profile': {
    post: {
      tags: ['Admin'],
      summary: 'Create admin profile',
      description: 'Create a new admin profile (Treasurer and above)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateAdminProfile'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Admin profile created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AdminProfile'
              }
            }
          }
        },
        '403': {
          description: 'Insufficient permissions'
        }
      }
    }
  },

  '/users/admin/verify': {
    post: {
      tags: ['Admin'],
      summary: 'Verify admin phone',
      description: 'Start admin profile phone verification process',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/VerifyAdminProfile'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Verification initiated successfully'
        }
      }
    }
  },

  '/users/admin/verify-otp': {
    post: {
      tags: ['Admin'],
      summary: 'Verify OTP',
      description: 'Complete admin profile verification with OTP',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/VerifyAdminOtp'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'OTP verified successfully'
        }
      }
    }
  },

  '/users/admin/user': {
    post: {
      tags: ['Admin'],
      summary: 'Create admin user',
      description: 'Create admin user account with verified profile',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateAdminUser'
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Admin user created successfully'
        }
      }
    }
  },

  '/users/admin/users/{userId}/suspend': {
    post: {
      tags: ['Admin'],
      summary: 'Suspend admin user',
      description: 'Suspend an admin user account (Requires approval level 2+)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
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
              $ref: '#/components/schemas/AdminActionRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Admin user suspended successfully'
        }
      }
    }
  },

  '/users/admin/users/{userId}/reactivate': {
    post: {
      tags: ['Admin'],
      summary: 'Reactivate admin user',
      description: 'Reactivate a suspended admin user (Requires approval level 2+)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
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
              $ref: '#/components/schemas/AdminActionRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Admin user reactivated successfully'
        }
      }
    }
  },

  '/users/admin/users/{userId}': {
    delete: {
      tags: ['Admin'],
      summary: 'Delete admin user',
      description: 'Soft delete an admin user (Requires approval level 2+)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
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
              $ref: '#/components/schemas/AdminActionRequest'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Admin user deleted successfully'
        }
      }
    }
  }
};