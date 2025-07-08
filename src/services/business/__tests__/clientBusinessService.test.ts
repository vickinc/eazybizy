import { ClientBusinessService, NewClientInput } from '../clientBusinessService';
import { Client } from '@/types';

describe('ClientBusinessService', () => {
  describe('generateClientId', () => {
    it('should generate a client ID with the correct prefix', () => {
      const clientId = ClientBusinessService.generateClientId();
      expect(clientId).toMatch(/^client_\d+_[a-z0-9]+$/);
    });

    it('should generate unique client IDs on subsequent calls', () => {
      const clientId1 = ClientBusinessService.generateClientId();
      const clientId2 = ClientBusinessService.generateClientId();
      expect(clientId1).not.toBe(clientId2);
    });
  });

  describe('createClientObject', () => {
    const validInput: NewClientInput = {
      clientType: 'Individual',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      address: '123 Main St',
      city: 'Anytown',
      zipCode: '12345',
      country: 'USA',
      industry: 'Tech',
      status: 'active',
      notes: 'Test note',
    };

    it('should create a client object with valid input', () => {
      const client = ClientBusinessService.createClientObject(validInput);
      expect(client).toHaveProperty('id');
      expect(client.name).toBe(validInput.name);
      expect(client.email).toBe(validInput.email);
      expect(client.clientType).toBe(validInput.clientType);
      expect(client.createdAt).toBeDefined();
      expect(client.totalInvoiced).toBe(0);
      expect(client.totalPaid).toBe(0);
    });

    it('should throw an error if name is missing', () => {
      const invalidInput = { ...validInput, name: '' };
      expect(() => ClientBusinessService.createClientObject(invalidInput)).toThrow('Client name and email are required.');
    });

    it('should throw an error if email is missing', () => {
      const invalidInput = { ...validInput, email: '' };
      expect(() => ClientBusinessService.createClientObject(invalidInput)).toThrow('Client name and email are required.');
    });

    it('should throw an error if registrationNumber is missing for Legal Entity', () => {
      const invalidInput: NewClientInput = {
        ...validInput,
        clientType: 'Legal Entity',
        registrationNumber: '',
      };
      expect(() => ClientBusinessService.createClientObject(invalidInput)).toThrow('Registration number is required for Legal Entity clients.');
    });

    it('should not throw for missing registrationNumber for Individual', () => {
      const individualInput: NewClientInput = {
        ...validInput,
        clientType: 'Individual',
        registrationNumber: '', // Should be ignored
      };
      expect(() => ClientBusinessService.createClientObject(individualInput)).not.toThrow();
    });
  });

  describe('validateClientData', () => {
    it('should return isValid true for valid data', () => {
      const validData: Partial<Client> = { name: 'Test', email: 'test@example.com', clientType: 'Individual' };
      const result = ClientBusinessService.validateClientData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing name', () => {
      const invalidData: Partial<Client> = { email: 'test@example.com' };
      const result = ClientBusinessService.validateClientData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Client name is required.');
    });

    it('should return errors for missing email', () => {
      const invalidData: Partial<Client> = { name: 'Test' };
      const result = ClientBusinessService.validateClientData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Client email is required.');
    });

    it('should return errors for invalid email format', () => {
      const invalidData: Partial<Client> = { name: 'Test', email: 'test' };
      const result = ClientBusinessService.validateClientData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format.');
    });

    it('should return errors for missing registration number for Legal Entity', () => {
      const invalidData: Partial<Client> = { name: 'Test Corp', email: 'corp@example.com', clientType: 'Legal Entity' };
      const result = ClientBusinessService.validateClientData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Registration number is required for Legal Entity clients.');
    });

    it('should not require registration number for Individual', () => {
      const validData: Partial<Client> = { name: 'Test Ind', email: 'ind@example.com', clientType: 'Individual' };
      const result = ClientBusinessService.validateClientData(validData);
      expect(result.isValid).toBe(true);
    });
  });
});
