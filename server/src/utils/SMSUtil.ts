import twilio from 'twilio';
import env from '../config/env';

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
const VERIFICATION_SID = env.TWILIO_VERIFICATION_SERVICE_SID; // Twilio Verification SID

// Send OTP using Twilio's Verification Service
export const sendVerificationCode = async (phoneNumber: string) => {
  try {
    const verification = await client.verify.v2
      .services(VERIFICATION_SID)
      .verifications.create({
        to: phoneNumber,
        channel: 'sms', // You can also use 'call' or 'email' if needed
      });

    console.log(`Verification code sent to ${phoneNumber}:`, verification.status);
    return verification;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw new Error('Failed to send verification code. Please try again.');
  }
};

// Check OTP using Twilio's Verification Service
export const checkVerificationCode = async (phoneNumber: string, otp: string) => {
  try {
    const verificationCheck = await client.verify.v2
      .services(VERIFICATION_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });

    console.log(`Verification check for ${phoneNumber}:`, verificationCheck.status);
    return verificationCheck;
  } catch (error) {
    console.error('Error checking verification code:', error);
    throw new Error('Failed to check verification code. Please try again.');
  }
};
