/**
 * Sample Product and Invoice Data for Testing Calculation Fix
 * 
 * This file contains sample data to verify that the invoice calculation fix
 * correctly handles the subtotal calculation (not including tax in subtotal).
 * 
 * Expected behavior with EUR 3,600 product and 18% tax:
 * - Subtotal: EUR 3,600 (product price only)
 * - Tax (18%): EUR 648 (3,600 * 0.18)
 * - Total: EUR 4,248 (3,600 + 648)
 * 
 * Before fix: Subtotal showed EUR 4,068 (incorrectly included tax)
 * After fix: Subtotal shows EUR 3,600 (correct - tax-exclusive)
 */

// Sample Product Data
const sampleProducts = [
  {
    id: "prod_1703123456789_abc123def",
    name: "Premium Legal Consultation",
    description: "Comprehensive legal consultation service for business matters",
    price: 3600,
    currency: "EUR",
    cost: 2000,
    costCurrency: "EUR",
    vendorId: "N/A",
    companyId: 1,
    groupId: null,
    isActive: true,
    createdAt: "2024-01-15T10:30:00.000Z",
    updatedAt: "2024-01-15T10:30:00.000Z"
  },
  {
    id: "prod_1703123456790_def456ghi",
    name: "Business Contract Review",
    description: "Detailed review and analysis of business contracts",
    price: 1500,
    currency: "EUR",
    cost: 800,
    costCurrency: "EUR",
    vendorId: "N/A",
    companyId: 1,
    groupId: null,
    isActive: true,
    createdAt: "2024-01-15T11:00:00.000Z",
    updatedAt: "2024-01-15T11:00:00.000Z"
  },
  {
    id: "prod_1703123456791_ghi789jkl",
    name: "Corporate Compliance Audit",
    description: "Complete audit of corporate compliance procedures",
    price: 2400,
    currency: "EUR",
    cost: 1200,
    costCurrency: "EUR",
    vendorId: "N/A",
    companyId: 1,
    groupId: null,
    isActive: true,
    createdAt: "2024-01-15T12:00:00.000Z",
    updatedAt: "2024-01-15T12:00:00.000Z"
  }
];

// Sample Client Data
const sampleClients = [
  {
    id: "client_1703123456792_test001",
    name: "TechCorp Solutions Ltd",
    email: "billing@techcorp.com",
    address: "123 Business Street",
    city: "Amsterdam",
    zipCode: "1000 AB",
    country: "Netherlands",
    clientType: "Legal Entity",
    companyId: 1,
    isActive: true,
    createdAt: "2024-01-10T09:00:00.000Z",
    updatedAt: "2024-01-10T09:00:00.000Z"
  }
];

// Sample Company Data
const sampleCompanies = [
  {
    id: 1,
    legalName: "Legal Advisory Services B.V.",
    tradingName: "Legal Advisory",
    registrationNo: "12345678",
    industry: "Legal Services",
    address: "456 Law Plaza, Amsterdam, 1001 CD, Netherlands",
    phone: "+31 20 123 4567",
    email: "info@legaladvisory.nl",
    website: "www.legaladvisory.nl",
    status: "Active",
    logo: "LA"
  }
];

// Test Invoice Form Data (this is what gets submitted to create an invoice)
const testInvoiceFormData = {
  invoiceNumber: "INV-2024-0001",
  clientId: "client_1703123456792_test001",
  items: [
    {
      productId: "prod_1703123456789_abc123def", // EUR 3,600 product
      quantity: "1"
    }
  ],
  issueDate: "2024-06-25",
  dueDate: "2024-07-25",
  taxRate: "18", // 18% tax rate
  fromCompanyId: 1,
  paymentMethodIds: [],
  notes: "Test invoice for calculation verification"
};

// Expected calculation results AFTER the fix
const expectedCalculationResults = {
  subtotal: 3600,        // Product price only (no tax included)
  taxAmount: 648,        // 18% of 3600 = 648
  totalAmount: 4248,     // 3600 + 648 = 4248
  currency: "EUR"
};

// What the calculation was showing BEFORE the fix (incorrect)
const incorrectCalculationBefore = {
  subtotal: 4068,        // This was wrong - included tax
  taxAmount: 648,        // This was correct
  totalAmount: 4248,     // This was correct
  currency: "EUR"
};

// Test scenarios for multiple items
const multiItemTestData = {
  invoiceFormData: {
    invoiceNumber: "INV-2024-0002",
    clientId: "client_1703123456792_test001",
    items: [
      {
        productId: "prod_1703123456789_abc123def", // EUR 3,600
        quantity: "1"
      },
      {
        productId: "prod_1703123456790_def456ghi", // EUR 1,500
        quantity: "2"
      }
    ],
    issueDate: "2024-06-25",
    dueDate: "2024-07-25",
    taxRate: "18",
    fromCompanyId: 1,
    paymentMethodIds: [],
    notes: "Multi-item test invoice"
  },
  expectedResults: {
    subtotal: 6600,        // 3600 + (1500 * 2) = 6600
    taxAmount: 1188,       // 18% of 6600 = 1188
    totalAmount: 7788,     // 6600 + 1188 = 7788
    currency: "EUR"
  }
};

// Function to test the calculation
function testInvoiceCalculation() {
  console.log("=== INVOICE CALCULATION TEST ===");
  console.log("");
  
  console.log("Testing single item (EUR 3,600 with 18% tax):");
  console.log("Expected results:");
  console.log("- Subtotal: EUR 3,600");
  console.log("- Tax (18%): EUR 648");
  console.log("- Total: EUR 4,248");
  console.log("");
  
  console.log("Multi-item test (EUR 3,600 + 2x EUR 1,500 with 18% tax):");
  console.log("Expected results:");
  console.log("- Subtotal: EUR 6,600");
  console.log("- Tax (18%): EUR 1,188");
  console.log("- Total: EUR 7,788");
  console.log("");
  
  console.log("Key fix: Subtotal should NOT include tax");
  console.log("The bug was that subtotal was showing tax-inclusive amount");
}

// Export data for use in tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sampleProducts,
    sampleClients,
    sampleCompanies,
    testInvoiceFormData,
    expectedCalculationResults,
    incorrectCalculationBefore,
    multiItemTestData,
    testInvoiceCalculation
  };
}

// Browser console test
if (typeof window !== 'undefined') {
  window.invoiceTestData = {
    sampleProducts,
    sampleClients,
    sampleCompanies,
    testInvoiceFormData,
    expectedCalculationResults,
    incorrectCalculationBefore,
    multiItemTestData,
    testInvoiceCalculation
  };
  
  console.log("Invoice test data loaded! Run invoiceTestData.testInvoiceCalculation() to see expected results.");
}