import { config } from 'dotenv';

import path from 'path';

config({ path: path.resolve(__dirname, '../../.env') }); // Load environment variables from .env file
const env = {
  // Environment Variables
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.SERVER_PORT || 5001,
  APPLICATION_URL: process.env.APPLICATION_URL,
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT Settings
  JWT_SECRET: process.env.JWT_SECRET || 'your-secure-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-secure-refresh-secret',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '1h',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Redis Settings
  REDIS_URL: process.env.REDIS_URL,

  // Bank Verification Settings
  BANK_VERIFICATION_API_URL: process.env.BANK_VERIFICATION_API_URL,
  BANK_VERIFICATION_TOKEN: process.env.BANK_VERIFICATION_TOKEN,

  // # TWILIO ENVIRONMENT VARIABLES
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_VERIFICATION_SERVICE_SID: process.env.TWILIO_VERIFICATION_SERVICE_SID || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  OTP_EXPIRY_TIME: parseInt(process.env.OTP_EXPIRY_TIME || '300000', 10), // Default to 5 minutes if not set
  // VERIFICATION_SID: process.env.VERIFICATION_SID  || '',
  // NODE_ENV: process.env.NODE_ENV || 'development',

  // Add other environment variables as needed
};

// console.log('PORT:', env.PORT); // Should log the value from the .env file
// console.log('DATABASE_URL:', env.DATABASE_URL); // Should log the value from the .env file
// console.log('JWT_SECRET:', env.JWT_SECRET); // Should log the value from the .env file
// console.log('TOKEN_EXPIRY_TIME:', env.TOKEN_EXPIRY_TIME); // Should log the value from the .env file
// console.log('Environment variables loaded successfully.');

export default env;