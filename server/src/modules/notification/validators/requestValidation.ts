import Joi from 'joi';
import { RequestStatus, RequestType } from '@prisma/client';

const requestTypes = Object.values(RequestType);
const requestStatuses = Object.values(RequestStatus);

// Base schema for request details
const requestDetailsSchema = {
  BIODATA_APPROVAL: Joi.object({
    message: Joi.string().required(),
    department: Joi.string().required(),
    staffNo: Joi.string().required(),
    name: Joi.string().required()
  }),
  
  LOAN_APPLICATION: Joi.object({
    loanTypeId: Joi.string().uuid().required(),
    loanAmount: Joi.number().positive().required(),
    loanTenure: Joi.number().integer().min(1).required(),
    purpose: Joi.string().min(10).required(),
    guarantor1: Joi.string().uuid().required(),
    guarantor2: Joi.string().uuid().required()
  }),
  
  SAVINGS_WITHDRAWAL: Joi.object({
    amount: Joi.number().positive().required(),
    reason: Joi.string().min(10).required()
  }),
  
  SHARE_WITHDRAWAL: Joi.object({
    sharesId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    recipientBiodataId: Joi.string().uuid().required(),
    reason: Joi.string().min(10).required()
  })
};

// Create request validation
export const createRequestSchema = Joi.object({
  type: Joi.string()
    .valid(...requestTypes)
    .required()
    .messages({
      'any.required': 'Request type is required',
      'any.only': 'Invalid request type'
    }),

  details: Joi.alternatives()
    .conditional('type', {
      switch: [
        { is: 'BIODATA_APPROVAL', then: requestDetailsSchema.BIODATA_APPROVAL },
        { is: 'LOAN_APPLICATION', then: requestDetailsSchema.LOAN_APPLICATION },
        { is: 'SAVINGS_WITHDRAWAL', then: requestDetailsSchema.SAVINGS_WITHDRAWAL },
        { is: 'SHARE_WITHDRAWAL', then: requestDetailsSchema.SHARE_WITHDRAWAL }
      ]
    })
    .required()
    .messages({
      'any.required': 'Request details are required'
    })
});

// Update request validation (for admins)
export const updateRequestSchema = Joi.object({
  status: Joi.string()
    .valid(...requestStatuses)
    .required()
    .messages({
      'any.required': 'Status is required',
      'any.only': 'Invalid status'
    }),

  adminNotes: Joi.string()
    .min(10)
    .max(500)
    .optional()
    .messages({
      'string.min': 'Admin notes must be at least 10 characters long',
      'string.max': 'Admin notes cannot exceed 500 characters'
    }),

  reviewerId: Joi.string()
    .uuid()
    .optional()
});

// Request filter validation
export const filterSchema = Joi.object({
  type: Joi.string()
    .valid(...requestTypes)
    .optional(),

  status: Joi.string()
    .valid(...requestStatuses)
    .optional(),

  userId: Joi.string()
    .uuid()
    .optional(),

  biodataId: Joi.string()
    .uuid()
    .optional(),

  startDate: Joi.date()
    .iso()
    .optional(),

  endDate: Joi.date()
    .iso()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.min': 'End date must be after start date'
    })
});

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be greater than 0'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be greater than 0',
      'number.max': 'Limit cannot exceed 100'
    }),

  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'type', 'status')
    .default('createdAt')
    .messages({
      'any.only': 'Invalid sort field'
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    })
});