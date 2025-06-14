import * as XLSX from 'xlsx';
import { IBiodata } from '../interfaces/biodata.interface';
import { PhoneNumberService } from '../../../utils/phoneNumber';

interface IExcelUploadResponse {
  successful: number;
  failed: number;
  errors: string[];
}

export class ExcelProcessor {
  private validRecords: Partial<IBiodata>[] = [];
  
  async processBiodataExcel(file: Express.Multer.File): Promise<IExcelUploadResponse> {
    const response: IExcelUploadResponse = {
      successful: 0,
      failed: 0,
      errors: []
    };

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const records = XLSX.utils.sheet_to_json(worksheet);

      this.validRecords = []; // Reset valid records

      for (const record of records) {
        try {
          const validatedRecord = await this.validateRecord(record);
          this.validRecords.push(validatedRecord);
          response.successful++;
        } catch (error) {
          response.failed++;
          let message = error instanceof Error ? error.message : 'Unknown error';
          response.errors.push(`Row ${records.indexOf(record) + 2}: ${message}`);
        }
      }

      return response;
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process Excel file: ${message}`);
    }
  }

  public async validateRecord(record: any): Promise<Partial<IBiodata>> {
    // Required fields - Update to match the backup format
    const requiredFields = [
      'erpId', 
      'ippisId', 
      'firstName',  // Changed from 'name'
      'lastName',
      'dateOfEmployment', 
      'department', 
      'staffNo',
      'residentialAddress', 
      'emailAddress', 
      'phoneNumber', 
      'nextOfKin',
      'relationshipOfNextOfKin', 
      'nextOfKinPhoneNumber'
    ];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!record[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // No need to split name since we already have firstName, lastName
    const fullName = `${record.firstName} ${record.middleName ? record.middleName + ' ' : ''}${record.lastName}`.trim();

    // Validate phone numbers
    if (!PhoneNumberService.isValidNigerianNumber(record.phoneNumber)) {
      throw new Error('Invalid phone number format');
    }
    if (!PhoneNumberService.isValidNigerianNumber(record.nextOfKinPhoneNumber)) {
      throw new Error('Invalid next of kin phone number format');
    }

    // Format phone numbers
    const formattedPhone = PhoneNumberService.formatToInternational(record.phoneNumber);
    const formattedNextOfKinPhone = PhoneNumberService.formatToInternational(record.nextOfKinPhoneNumber);

    // Validate emails
    if (!this.isValidEmail(record.emailAddress)) {
      throw new Error('Invalid email address format');
    }
    if (record.nextOfKinEmailAddress && !this.isValidEmail(record.nextOfKinEmailAddress)) {
      throw new Error('Invalid next of kin email address format');
    }

    // Validate date
    const dateOfEmployment = new Date(record.dateOfEmployment);
    if (isNaN(dateOfEmployment.getTime())) {
      throw new Error('Invalid dateOfEmployment');
    }

    // Return mapped record
    return {
      erpId: String(record.erpId),
      ippisId: String(record.ippisId),
      firstName: record.firstName,
      middleName: record.middleName || undefined,
      lastName: record.lastName,
      fullName,
      dateOfEmployment,
      staffNo: String(record.staffNo),
      department: String(record.department),
      residentialAddress: String(record.residentialAddress),
      emailAddress: String(record.emailAddress).toLowerCase(),
      phoneNumber: formattedPhone,
      nextOfKin: String(record.nextOfKin),
      relationshipOfNextOfKin: String(record.relationshipOfNextOfKin),
      nextOfKinPhoneNumber: formattedNextOfKinPhone,
      nextOfKinEmailAddress: record.nextOfKinEmailAddress ? 
        String(record.nextOfKinEmailAddress).toLowerCase() : 
        undefined
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getValidRecords(): Partial<IBiodata>[] {
    return this.validRecords;
  }
}