import axios, { AxiosError } from 'axios';
import env from '../../../config/env';
import { BankVerificationRequest, BankVerificationResponse, BankVerificationError } from '../types/bankVerification.types';
import logger from '../../../utils/logger';

class BankAccountVerification {
  private readonly apiUrl: string;
  private readonly bearerToken: string;

  constructor() {
    this.apiUrl = env.BANK_VERIFICATION_API_URL || 'https://nubapi.com/api/verify';
    this.bearerToken = env.BANK_VERIFICATION_TOKEN || '';
  }

  async verifyAccount(data: BankVerificationRequest): Promise<BankVerificationResponse> {
    try {
      if (!this.bearerToken) {
        throw new Error('Bank verification token is missing');
      }

      // Remove any leading zeros from account number
      const sanitizedAccountNumber = data.accountNumber.replace(/^0+/, '');
      
      // Re-add leading zeros if needed to make it 10 digits
      const formattedAccountNumber = sanitizedAccountNumber.padStart(10, '0');

      if (!this.validateAccountNumber(formattedAccountNumber)) {
        throw new Error(`Invalid account number format: ${formattedAccountNumber}. Must be 10 digits.`);
      }

      if (!this.validateBankCode(data.bankCode)) {
        throw new Error(`Invalid bank code format: ${data.bankCode}`);
      }

      logger.info(`Verifying bank account: ${formattedAccountNumber} with bank code: ${data.bankCode}`);

      const response = await axios.get(this.apiUrl, {
        params: {
          account_number: formattedAccountNumber,
          bank_code: data.bankCode
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.bearerToken}`
        }
      });

      logger.info(`Bank verification API response: ${JSON.stringify(response.data)}`);

      // Check if the API response indicates an error
      if (!response.data.account_name || response.data.status === false) {
        throw new Error(response.data.message || 'Account verification failed');
      }

      // Map the API response to our expected format
      return {
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        otherName: response.data.other_name,
        accountName: response.data.account_name,
        accountNumber: response.data.account_number,
        bankName: response.data.Bank_name,
        status: 'success'
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const statusCode = error.response?.status;
        const errorMessage = error.response?.data?.message || error.message;
        logger.error(`Bank verification API error (${statusCode}): ${errorMessage}`);
        logger.error(`Request params: account_number=${data.accountNumber}, bank_code=${data.bankCode}`);
        
        throw {
          status: 'error',
          message: `Bank verification failed (${statusCode}): ${errorMessage}`
        };
      }
      
      logger.error(`Bank verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw {
        status: 'error',
        message: error instanceof Error ? error.message : 'Bank verification failed'
      };
    }
  }

  validateAccountNumber(accountNumber: string): boolean {
    const accountNumberRegex = /^\d{10}$/;
    return accountNumberRegex.test(accountNumber);
  }

  validateBankCode(bankCode: string): boolean {
    // Bank codes can be 6 digits or shorter based on bankCodes.txt
    const bankCodeRegex = /^\d{1,6}$/;
    return bankCodeRegex.test(bankCode);
  }
}

export const bankAccountVerification = new BankAccountVerification();