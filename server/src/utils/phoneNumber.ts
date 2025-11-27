import { parsePhoneNumberWithError, CountryCode } from 'libphonenumber-js';

export class PhoneNumberService {
  /**
   * Formats a phone number to international format
   */
  static formatToInternational(phoneNumber: string): string {
    try {
      // Clean the number first
      const cleaned = phoneNumber.replace(/\s+/g, '');

      // If already in international format with +234, return as is
      if (cleaned.startsWith('+234')) {
        return cleaned;
      }

      // If starts with 234 without +, add it
      if (cleaned.startsWith('234')) {
        return '+' + cleaned;
      }

      // If starts with 0, replace with +234
      if (cleaned.startsWith('0')) {
        return '+234' + cleaned.substring(1);
      }

      throw new Error('Invalid phone number format');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error('Phone number formatting failed: ' + errorMessage);
    }
  }

  /**
   * Formats a phone number to national format (07...)
   */
  static formatToNational(phoneNumber: string): string {
    try {
      const cleaned = phoneNumber.replace(/\s+/g, '');
      
      // If starts with +234 or 234, replace with 0
      if (cleaned.startsWith('+234')) {
        return '0' + cleaned.substring(4);
      }
      if (cleaned.startsWith('234')) {
        return '0' + cleaned.substring(3);
      }
      
      // If already starts with 0, return as is
      if (cleaned.startsWith('0')) {
        return cleaned;
      }

      throw new Error('Invalid phone number format');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error('Phone number formatting failed: ' + errorMessage);
    }
  }

  /**
   * Validates a phone number for a specific country
   * @param phoneNumber - The phone number to validate
   * @param countryCode - The country code to validate against
   * @returns Boolean indicating if number is valid
   */
  static isValidPhoneNumber(phoneNumber: string, countryCode: CountryCode = 'NG'): boolean {
    try {
      const parsed = parsePhoneNumberWithError(phoneNumber, countryCode);
      return parsed.isValid();
    } catch {
      return false;
    }
  }

  /**
   * Validates if a phone number is in correct Nigerian format
   */
  // static isValidNigerianNumber(phoneNumber: string): boolean {
  //   try {
  //     // Clean the number first
  //     const cleaned = phoneNumber.replace(/\s+/g, '');
  //
  //     // Match both formats: 0703... or +234703... or 234703...
  //     const nigerianPattern = /^(?:(?:\+?234)|0)([789][01])\d{8}$/;
  //     return nigerianPattern.test(cleaned);
  //   } catch {
  //     return false;
  //   }
  // }

    static isValidNigerianNumber(phoneNumber: string): boolean {
        try {
            const cleaned = phoneNumber.replace(/\s+/g, '');

            // Format: 07012345678 or +2347012345678 or 2347012345678
            const nigerianPattern = /^(?:\+?234|0)[7-9]\d{9}$/;

            return nigerianPattern.test(cleaned);
        } catch {
            return false;
        }
    }
}