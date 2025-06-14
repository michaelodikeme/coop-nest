export interface BiodataUploadRow {
  erpId: string;
  ippisId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfEmployment: Date;
  department: string;
  staffNo: string;
  residentialAddress: string;
  emailAddress: string;
  phoneNumber: string;
  nextOfKin: string;
  relationshipOfNextOfKin: string;
  nextOfKinPhoneNumber: string;
  nextOfKinEmailAddress: string;
}

export interface UploadResult {
  successful: number;
  failed: number;
  errors: string[];
}