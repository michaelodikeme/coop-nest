import { ApiError } from '../../../utils/apiError';
import { sendVerificationCode, checkVerificationCode, verifyOTPFromRedis, storeOTPInRedis, generateOTP } from '../../../utils/SMSUtil';
import { PhoneNumberService } from '../../../utils/phoneNumber';
import { IVerifyBiodataInput, IVerifyBiodataResponse, IOtpVerificationResponse } from '../interfaces/biodata.interface';
import { NotificationType, PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

// Update TransactionClient type to match Prisma's transaction type
type TransactionClient = Omit<
PrismaClient,
'$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class BiodataVerificationService {


  async verifyBiodata(input: IVerifyBiodataInput): Promise<IVerifyBiodataResponse> {
    const { phoneNumber } = input;
    
    try {
      // Format phone number
      const formattedNumber = PhoneNumberService.formatToInternational(phoneNumber);

      console.log('formattedNumber', formattedNumber);
      // Find biodata by phone number
      const biodata = await prisma.biodata.findUnique({
        where: { phoneNumber: formattedNumber }
      });
      
      if (!biodata) {
        throw new ApiError('Phone number not found in our records', 404);
      }
      
      if (!biodata.isApproved) {
        throw new ApiError('Biodata must be approved before verification', 400);
      }
      
      // Check if the biodata is already verified
      if (biodata.isVerified) {
        // Check if the biodata is linked to a created user
        const user = await prisma.user.findFirst({
          where: { biodataId: biodata.id, isActive: true },
        });
        
        if (user) {
          // If the biodata is linked to a user, it cannot be re-verified
          throw new ApiError('The biodata entry is already associated with a verified user.', 400);
        }
        
        // If the biodata is verified but not linked to a user, reset the isVerified field
        await prisma.biodata.update({
          where: { id: biodata.id },
          data: { isVerified: false },
        });
      }
      
      // Generate OTP
      const otp = generateOTP();

      // Store OTP in Redis with expiration
      await storeOTPInRedis(formattedNumber, otp);

      // Send verification code via SMS
      console.log("Generated OTP for", formattedNumber, ":", otp);
      await sendVerificationCode(formattedNumber, otp);

      return {
        status: 'pending',
        message: 'Verification code sent successfully',
        biodataId: biodata.id
      } as IVerifyBiodataResponse;
    } catch (error: any) {
      throw new ApiError(error.message || 'Verification failed', error.status || 500);
    }
  }
  
  async verifyPhoneOtp(phoneNumber: string, otp: string): Promise<IOtpVerificationResponse> {
    try {
      console.log('request coming verifyPhoneOtp', phoneNumber);
      const formattedNumber = PhoneNumberService.formatToInternational(phoneNumber);
      
      // Find biodata by phone number
      const biodata = await prisma.biodata.findFirst({
        where: { phoneNumber: formattedNumber },
        include: {
          users: true
        }
      });
      
      if (!biodata) {
        throw new ApiError('Phone number not found in our records', 404);
      }
      
      // Verify OTP from Redis
      const isValid = await verifyOTPFromRedis(formattedNumber, otp);

      if (!isValid) {
        throw new ApiError('Invalid verification code', 400);
      }
      
      // Update biodata verification status
      const verifiedBiodata = await prisma.$transaction(async (tx: TransactionClient) => {
        const updated = await tx.biodata.update({
          where: { id: biodata.id },
          data: {
            isVerified: true,
          },
        });
        
        // Create notification for member if they have a user account
        if (biodata.users.length > 0) {
          await tx.notification.create({
            data: {
              userId: biodata.users[0].id,
              type: NotificationType.SYSTEM_ALERT,
              title: 'Phone Number Verified',
              message: 'Your phone number has been verified successfully. You can now proceed with your account setup.',
              priority: 'HIGH',
            },
          });
        }
        
        return updated;
      });
      
      return {
        status: 'success',
        message: 'Phone number verified successfully',
        biodataId: verifiedBiodata.id
      };
    } catch (error: any) {
      throw new ApiError(error.message || 'Verification failed', error.status || 500);
    }
  }
}