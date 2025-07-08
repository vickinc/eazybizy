import { Company } from './index';

export interface BusinessCard {
  id: string;
  companyId: number;
  company: Company;
  personName?: string;
  position?: string;
  qrType: "website" | "email";
  qrValue: string;
  template: "modern" | "classic" | "minimal" | "eazy";
  createdAt: Date;
  isArchived?: boolean;
}

export interface BusinessCardFormData {
  companyId: number;
  personName: string;
  position: string;
  qrType: "website" | "email";
  template: "modern" | "classic" | "minimal" | "eazy";
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