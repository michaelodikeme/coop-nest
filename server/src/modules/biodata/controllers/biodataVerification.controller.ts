import { BiodataVerificationService } from "../services/biodataVerification.service";
import { ApiResponse } from "../../../utils/apiResponse";
import { ApiError } from "../../../utils/apiError";
import { ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { verifyBiodataSchema, verifyOtpSchema } from "../validations/biodata.validation";
import { IVerifyBiodataInput } from "../interfaces/biodata.interface";
  
export class BiodataVerificationController {
  private biodataVerificationService: BiodataVerificationService;

  constructor() {
    this.biodataVerificationService = new BiodataVerificationService();
  }

  async verifyBiodata(req: Request, res: Response, next: NextFunction) {
    console.log('verifyBiodata', verifyBiodataSchema.parse(req.body));
    // Ensure the request is authenticated
    try {
      const validatedData = verifyBiodataSchema.parse(req.body) as IVerifyBiodataInput;
      const result = await this.biodataVerificationService.verifyBiodata(validatedData);


      console.log('result from verifyData', result);
      if (result.status === 'pending') {
        res.clearCookie('biodataId');
        res.cookie('verificationPhone', validatedData.phoneNumber, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 10 * 60 * 1000 // 10 minutes
        });

        console.log('response', res)
      }

      return ApiResponse.success(res, result.message, { biodataId: result.biodataId });
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponse.badRequest(res, 'Invalid input format');
      }
      if (error instanceof ApiError) {
        return ApiResponse.badRequest(res, error.message);
      }
      next(error);
    }
  }

  async verifyPhoneOtp(req: Request, res: Response, next: NextFunction) {
    try {
      console.log("request cookies",  req.cookies);
      const phoneNumber = req.cookies.verificationPhone;
      if (!phoneNumber) {
        return ApiResponse.badRequest(res, 'Phone verification session expired');
      }

      const validatedData = verifyOtpSchema.parse({
        ...req.body,
        phoneNumber
      });

      const result = await this.biodataVerificationService.verifyPhoneOtp(
        validatedData.phoneNumber,
        validatedData.otp
      );
      
      if (result.status === 'success') {
        res.clearCookie('verificationPhone');
        res.cookie('biodataId', result.biodataId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          sameSite: "none",

        });
        return ApiResponse.success(res, result.message, { 
          biodataId: result.biodataId,
          verified: true
        });
      }

      return ApiResponse.success(res, result.message, { biodataId: result.biodataId });
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponse.badRequest(res, 'Invalid input format');
      }
      if (error instanceof ApiError) {
        return ApiResponse.badRequest(res, error.message);
      }
      // Handle any other errors
      next(error);
    }
  }

}