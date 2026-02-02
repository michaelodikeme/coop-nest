export const adminSchemas = {
  AdminProfile: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid'
      },
      firstName: {
        type: 'string',
        description: 'Admin user first name'
      },
      lastName: {
        type: 'string',
        description: 'Admin user last name'
      },
      emailAddress: {
        type: 'string',
        format: 'email',
        description: 'Admin user email address'
      },
      phoneNumber: {
        type: 'string',
        description: 'Admin user phone number'
      },
      department: {
        type: 'string',
        description: 'Department or unit'
      },
      staffId: {
        type: 'string',
        description: 'Staff identification number'
      },
      position: {
        type: 'string',
        description: 'Job position/title'
      },
      isActive: {
        type: 'boolean',
        description: 'Profile activation status'
      },
      isVerified: {
        type: 'boolean',
        description: 'Phone verification status'
      }
    }
  },

  CreateAdminProfile: {
    type: 'object',
    required: ['firstName', 'lastName', 'emailAddress', 'phoneNumber', 'department', 'staffId', 'position'],
    properties: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      emailAddress: { type: 'string', format: 'email' },
      phoneNumber: { type: 'string' },
      department: { type: 'string' },
      staffId: { type: 'string' },
      position: { type: 'string' }
    }
  },

  VerifyAdminProfile: {
    type: 'object',
    required: ['phoneNumber'],
    properties: {
      phoneNumber: {
        type: 'string',
        description: 'Phone number to verify'
      }
    }
  },

  VerifyAdminOtp: {
    type: 'object',
    required: ['otp'],
    properties: {
      otp: {
        type: 'string',
        description: 'OTP code received'
      }
    }
  },

  CreateAdminUser: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: {
        type: 'string',
        minLength: 3
      },
      password: {
        type: 'string',
        minLength: 8,
        format: 'password'
      }
    }
  },

  AdminActionRequest: {
    type: 'object',
    required: ['reason'],
    properties: {
      reason: {
        type: 'string',
        description: 'Reason for the action'
      },
      comment: {
        type: 'string',
        description: 'Additional comments'
      }
    }
  }
};