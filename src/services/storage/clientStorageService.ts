import { Client } from '@/types/client.types';

const CLIENTS_STORAGE_KEY = 'app-clients';

// Mock data for initial setup
const mockClients: Client[] = [
  {
    id: '1',
    clientType: 'Legal Entity',
    name: 'Acme Corporation',
    contactPersonName: 'John Smith',
    contactPersonPosition: 'CEO',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    website: 'https://www.acme.com',
    address: '123 Business Ave',
    city: 'New York',
    zipCode: '10001',
    country: 'United States',
    industry: 'Technology',
    status: 'active',
    notes: 'Long-term client, pays on time',
    createdAt: '2024-01-15T00:00:00Z',
    lastInvoiceDate: '2024-02-15T00:00:00Z',
    totalInvoiced: 45000,
    totalPaid: 30000,
    registrationNumber: 'ACM123456789'
  },
  {
    id: '2',
    clientType: 'Legal Entity',
    name: 'Global Solutions Ltd',
    contactPersonName: 'Sarah Johnson',
    contactPersonPosition: 'CFO',
    email: 'info@globalsolutions.com',
    phone: '+44 20 7946 0958',
    website: 'https://www.globalsolutions.com',
    address: '456 International St',
    city: 'London',
    zipCode: 'SW1A 1AA',
    country: 'United Kingdom',
    industry: 'Consulting',
    status: 'active',
    notes: 'Requires detailed invoices',
    createdAt: '2024-01-20T00:00:00Z',
    lastInvoiceDate: '2024-02-10T00:00:00Z',
    totalInvoiced: 28500,
    totalPaid: 15000,
    registrationNumber: 'GB987654321'
  }
];

export class ClientStorageService {
  static getClients(): Client[] {
    try {
      const savedClients = localStorage.getItem(CLIENTS_STORAGE_KEY);
      if (savedClients) {
        const parsedClients = JSON.parse(savedClients) as Client[];
        console.log('Loaded clients from localStorage:', parsedClients.length, 'clients');
        return parsedClients;
      } else {
        // Initialize with mock data if no clients exist
        this.saveClients(mockClients);
        console.log('Initialized with mock clients');
        return mockClients;
      }
    } catch (error) {
      console.error('Error loading clients from localStorage:', error);
      return mockClients;
    }
  }

  static saveClients(clients: Client[]): boolean {
    try {
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
      console.log('Saved clients to localStorage:', clients.length, 'clients');
      return true;
    } catch (error) {
      console.error('Error saving clients to localStorage:', error);
      return false;
    }
  }

  static addClient(client: Client): Client[] {
    const clients = this.getClients();
    const updatedClients = [client, ...clients];
    this.saveClients(updatedClients);
    return updatedClients;
  }

  static updateClient(updatedClient: Client): Client[] {
    const clients = this.getClients();
    const updatedClients = clients.map(client => 
      client.id === updatedClient.id ? updatedClient : client
    );
    this.saveClients(updatedClients);
    return updatedClients;
  }

  static deleteClient(id: string): Client[] {
    const clients = this.getClients();
    const updatedClients = clients.filter(client => client.id !== id);
    this.saveClients(updatedClients);
    return updatedClients;
  }

  static archiveClient(id: string): Client[] {
    const clients = this.getClients();
    const updatedClients = clients.map(client => 
      client.id === id ? { ...client, status: 'archived' as const } : client
    );
    this.saveClients(updatedClients);
    return updatedClients;
  }

  static restoreClient(id: string): Client[] {
    const clients = this.getClients();
    const updatedClients = clients.map(client => 
      client.id === id ? { ...client, status: 'lead' as const } : client
    );
    this.saveClients(updatedClients);
    return updatedClients;
  }

  static getClientById(id: string): Client | null {
    const clients = this.getClients();
    return clients.find(client => client.id === id) || null;
  }

  static getClientsByCompany(companyId: number): Client[] {
    const clients = this.getClients();
    return clients.filter(client => client.companyId === companyId);
  }

  static getClientsByStatus(status: Client['status']): Client[] {
    const clients = this.getClients();
    return clients.filter(client => client.status === status);
  }

  static searchClients(searchTerm: string): Client[] {
    const clients = this.getClients();
    const searchLower = searchTerm.toLowerCase();
    
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      client.industry.toLowerCase().includes(searchLower) ||
      (client.contactPersonName?.toLowerCase().includes(searchLower)) ||
      (client.notes?.toLowerCase().includes(searchLower))
    );
  }

  static clientExists(email: string, excludeId?: string): boolean {
    const clients = this.getClients();
    return clients.some(client => 
      client.email.toLowerCase() === email.toLowerCase() && 
      (!excludeId || client.id !== excludeId)
    );
  }

  static updateClientTotals(clients: Client[]): boolean {
    return this.saveClients(clients);
  }

  static migrateData(): boolean {
    try {
      const clients = this.getClients();
      // Add any necessary data migration logic here
      // For now, just ensure all clients have the required fields
      const migratedClients = clients.map(client => ({
        ...client,
        website: client.website || '',
        contactPersonName: client.contactPersonName || '',
        contactPersonPosition: client.contactPersonPosition || ''
      }));
      
      return this.saveClients(migratedClients);
    } catch (error) {
      console.error('Error migrating client data:', error);
      return false;
    }
  }

  static clearAllClients(): boolean {
    try {
      localStorage.removeItem(CLIENTS_STORAGE_KEY);
      console.log('Cleared all clients from localStorage');
      return true;
    } catch (error) {
      console.error('Error clearing clients from localStorage:', error);
      return false;
    }
  }

  static exportClients(): string {
    const clients = this.getClients();
    return JSON.stringify(clients, null, 2);
  }

  static importClients(clientsJson: string): boolean {
    try {
      const clients = JSON.parse(clientsJson) as Client[];
      // Basic validation
      if (!Array.isArray(clients)) {
        throw new Error('Invalid client data format');
      }
      
      return this.saveClients(clients);
    } catch (error) {
      console.error('Error importing clients:', error);
      return false;
    }
  }
}