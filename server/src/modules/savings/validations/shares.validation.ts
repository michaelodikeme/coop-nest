import Joi from 'joi';

// Schema for updating shares information
export const sharesUpdateSchema = Joi.object({
  sharesId: Joi.string().uuid().required()
    .messages({
      'string.uuid': 'Share ID must be a valid UUID',
      'any.required': 'Share ID is required'
    }),
  
  unitsHeld: Joi.number().integer().min(1).optional()
    .messages({
      'number.base': 'Units held must be a number',
      'number.integer': 'Units held must be an integer',
      'number.min': 'Units held must be at least 1'
    }),
  
  valuePerUnit: Joi.number().precision(2).min(1).optional()
    .messages({
      'number.base': 'Value per unit must be a number',
      'number.precision': 'Value per unit must have at most 2 decimal places',
      'number.min': 'Value per unit must be at least 1'
    }),
  
  reason: Joi.string().required().min(5).max(200)
    .messages({
      'string.base': 'Reason must be a string',
      'string.empty': 'Reason is required',
      'string.min': 'Reason must be at least 5 characters',
      'string.max': 'Reason must not exceed 200 characters',
      'any.required': 'Reason for the change is required'
    })
}).custom((values, helpers) => {
  // Ensure at least one of unitsHeld or valuePerUnit is provided
  if (!values.unitsHeld && !values.valuePerUnit) {
    return helpers.error('custom.fieldsRequired', {
      message: 'At least one of unitsHeld or valuePerUnit must be provided'
    });
  }
  
  return values;
});

// Schema for querying shares history
export const sharesQuerySchema = Joi.object({
  memberId: Joi.string().uuid().optional()
    .messages({
      'string.uuid': 'Member ID must be a valid UUID'
    }),
  
  erpId: Joi.string().optional(),
  
  year: Joi.number().integer().min(2020).max(new Date().getFullYear() + 1).optional()
    .messages({
      'number.base': 'Year must be a number',
      'number.integer': 'Year must be an integer',
      'number.min': 'Year must be 2020 or later',
      'number.max': 'Year cannot be more than next year'
    }),
  
  month: Joi.number().integer().min(1).max(12).optional()
    .messages({
      'number.base': 'Month must be a number',
      'number.integer': 'Month must be an integer',
      'number.min': 'Month must be between 1 and 12',
      'number.max': 'Month must be between 1 and 12'
    }),
  
  page: Joi.number().integer().min(1).default(1).optional()
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number().integer().min(1).max(100).default(20).optional()
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
});
