import twilio from 'twilio';
import env from '../config/env';
import fetch from 'node-fetch';
import FormData from 'form-data';
import {ApiError} from "./apiError";
import redisClient from "../config/redis";



// OTP Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 600; // 10 minutes (industry standard)

const client = twilio("AC336255bba9e9087577584becb434536", "5fa22c0735717fa6e0464ce188b4762d");
const VERIFICATION_SID = env.TWILIO_VERIFICATION_SERVICE_SID; // Twilio Verification SID


/**
 * Generate a random OTP
 */
export function generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < OTP_LENGTH; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

/**
 * Store OTP in Redis with expiration
 */
export async function storeOTPInRedis(phoneNumber: string, otp: string): Promise<void> {
    const key = `otp:${phoneNumber}`;

    // Store OTP with expiration time
    await redisClient.setex(key, OTP_EXPIRY_SECONDS, otp);
}

/**
 * Verify OTP from Redis
 */
export async function verifyOTPFromRedis(phoneNumber: string, otp: string): Promise<boolean> {
    const key = `otp:${phoneNumber}`;

    // Get stored OTP
    const storedOTP = await redisClient.get(key);

    if (!storedOTP) {
    throw new ApiError('OTP has expired or does not exist', 400);
}

// Compare OTPs
if (storedOTP !== otp) {
    return false;
}

// OTP is valid, delete it from Redis (one-time use)
await redisClient.del(key);

return true;
}

// Send OTP using SMS Gateway
export const sendVerificationCode = async (phoneNumber: string, otp: string) => {
  try {
   console.log("Sending verification code");

      const data = new FormData();
      data.append('token', 'ho7jIDyJmH2t0AwNFzYOi5ZxbgS3nkr6vVC1uXlacpBMsPeQ49TqEdKRLUfGW8');
      data.append('senderID', 'fuosmcsl');
      data.append('recipients', phoneNumber);
      data.append('message', `Dear User, your user verification OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`);


      console.log(`Sending OTP ${otp} to ${phoneNumber}`);
      const response = await fetch('https://my.kudisms.net/api/corporate', {
          method: 'POST',
          body: data
      })
      const responseData = await response.json();
      console.log('SMS Response:', responseData);

    return responseData;
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
