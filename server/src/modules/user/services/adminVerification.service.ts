import { PrismaClient } from '@prisma/client';
import { ApiError } from '../../../utils/apiError';
import { PhoneNumberService } from '../../../utils/phoneNumber';
import { IVerifyAdminProfileInput, IVerifyAdminProfileResponse, IOtpVerificationResponse } from '../interfaces/admin.interface';
import {
    sendVerificationCode,
    checkVerificationCode,
    generateOTP,
    storeOTPInRedis,
    verifyOTPFromRedis
} from '../../../utils/SMSUtil';
import { phoneNumberValidator } from '../validations/admin.validations';

const prisma = new PrismaClient();

export class AdminVerificationService {
  async verifyAdminProfile(input: IVerifyAdminProfileInput): Promise<IVerifyAdminProfileResponse> {
    const { phoneNumber } = input;
    
    try {
      // Format phone number
      const formattedNumber = PhoneNumberService.formatToInternational(phoneNumber);
      
      // Find admin profile by phone number
      const adminProfile = await prisma.adminUserProfile.findUnique({
        where: { phoneNumber: formattedNumber }
      });
      
      if (!adminProfile) {
        throw new ApiError('Phone number not found in admin records', 404);
      }
      
      if (!adminProfile.isActive) {
        throw new ApiError('Admin profile must be approved before verification', 400);
      }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in Redis with expiration
    await storeOTPInRedis(formattedNumber, otp);

      // Send verification code
      await sendVerificationCode(formattedNumber, otp);
      
      return {
        status: 'pending',
        message: 'Verification code sent successfully',
        adminProfileId: adminProfile.id
      };
    } catch (error: any) {
      throw new ApiError(error.message || 'Verification failed', error.status || 500);
    }
  }

  async verifyAdminOtp(phoneNumber: string, otp: string): Promise<IOtpVerificationResponse> {
    try {
      const formattedNumber = PhoneNumberService.formatToInternational(phoneNumber);
      
      const adminProfile = await prisma.adminUserProfile.findFirst({
        where: { phoneNumber: formattedNumber }
      });
      
      if (!adminProfile) {
        throw new ApiError('Phone number not found in admin records', 404);
      }
    // Verify OTP from Redis
    const isValid = await verifyOTPFromRedis(formattedNumber, otp);

    if (!isValid) {
        throw new ApiError('Invalid verification code', 400);
    }
      // Update admin profile verification status
      const verifiedProfile = await prisma.adminUserProfile.update({
        where: { id: adminProfile.id },
        data: {
          isVerified: true
        }
      });
      
      return {
        status: 'success',
        message: 'Phone number verified successfully',
        adminProfileId: verifiedProfile.id,
        isVerified: verifiedProfile.isVerified,
        isActive: verifiedProfile.isActive
      };
    } catch (error: any) {
      throw new ApiError(error.message || 'Verification failed', error.status || 500);
    }
  }
}