import { Company } from './index';

export interface BusinessCard {
  id: string;
  companyId: number;
  company: Company;
  personName?: string;
  position?: string;
  personEmail?: string;
  personPhone?: string;
  qrType: "website" | "email";
  qrValue: string;
  template: "modern" | "classic" | "minimal" | "eazy" | "bizy";
  createdAt: Date;
  isArchived?: boolean;
}

export interface PersonOption {
  id: string;
  type: 'representative' | 'shareholder';
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string; // For representatives: actual role, for shareholders: "X% Owner"
}

export interface BusinessCardFormData {
  personId: string;
  personType: 'representative' | 'shareholder';
  qrType: "website" | "email";
  template: "modern" | "classic" | "minimal" | "eazy" | "bizy";
}

export interface FormattedBusinessCard extends BusinessCard {
  formattedCreatedAt: string;
  qrCodeUrl: string;
}

export interface PassKitData {
  formatVersion: number;
  passTypeIdentifier: string;
  serialNumber: string;
  teamIdentifier: string;
  organizationName: string;
  description: string;
  logoText: string;
  foregroundColor: string;
  backgroundColor: string;
  labelColor: string;
  webServiceURL: string;
  authenticationToken: string;
  relevantDate: string;
  generic: {
    primaryFields: Array<{ key: string; label: string; value: string }>;
    secondaryFields: Array<{ key: string; label: string; value: string }>;
    auxiliaryFields: Array<{ key: string; label: string; value: string }>;
    backFields: Array<{ key: string; label: string; value: string }>;
  };
  barcode: {
    message: string;
    format: string;
    messageEncoding: string;
  };
}