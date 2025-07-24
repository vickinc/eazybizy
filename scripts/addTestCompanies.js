const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const testCompanies = [
  {
    legalName: "TechStart Solutions Inc.",
    tradingName: "TechStart",
    registrationNo: "TS001234",
    registrationDate: new Date("2022-01-15"),
    countryOfRegistration: "United States",
    baseCurrency: "USD",
    businessLicenseNr: "BL-TS-2022-001",
    vatNumber: "VAT-TS-001234",
    industry: "Technology",
    entityType: "Corporation",
    fiscalYearEnd: "December 31",
    address: "123 Silicon Valley Blvd, San Jose, CA 95110",
    phone: "+1-408-555-0101",
    email: "contact@techstart.com",
    website: "https://techstart.com",
    status: "Active"
  },
  {
    legalName: "Green Energy Systems Ltd.",
    tradingName: "GreenPower",
    registrationNo: "GE002345",
    registrationDate: new Date("2021-06-20"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL-GE-2021-002",
    vatNumber: "GB-VAT-002345",
    industry: "Energy",
    entityType: "Limited Company",
    fiscalYearEnd: "March 31",
    address: "45 Renewable Way, London SW1A 1AA",
    phone: "+44-20-7946-0958",
    email: "info@greenpower.co.uk",
    website: "https://greenpower.co.uk",
    status: "Active"
  },
  {
    legalName: "Urban Dining Concepts LLC",
    tradingName: "Urban Eats",
    registrationNo: "UD003456",
    registrationDate: new Date("2023-03-10"),
    countryOfRegistration: "United States",
    baseCurrency: "USD",
    businessLicenseNr: "BL-UD-2023-003",
    vatNumber: "VAT-UD-003456",
    industry: "Food & Beverage",
    entityType: "LLC",
    fiscalYearEnd: "December 31",
    address: "789 Food Street, New York, NY 10001",
    phone: "+1-212-555-0789",
    email: "hello@urbaneats.com",
    website: "https://urbaneats.com",
    status: "Active"
  },
  {
    legalName: "Digital Marketing Pro Pty Ltd",
    tradingName: "DigiPro",
    registrationNo: "DM004567",
    registrationDate: new Date("2020-11-05"),
    countryOfRegistration: "Australia",
    baseCurrency: "AUD",
    businessLicenseNr: "BL-DM-2020-004",
    vatNumber: "AU-ABN-004567",
    industry: "Marketing",
    entityType: "Proprietary Limited",
    fiscalYearEnd: "June 30",
    address: "321 Marketing Lane, Sydney NSW 2000",
    phone: "+61-2-9555-0321",
    email: "contact@digipro.com.au",
    website: "https://digipro.com.au",
    status: "Active"
  },
  {
    legalName: "Fashion Forward Boutique Inc.",
    tradingName: "FashionForward",
    registrationNo: "FF005678",
    registrationDate: new Date("2019-08-12"),
    countryOfRegistration: "Canada",
    baseCurrency: "CAD",
    businessLicenseNr: "BL-FF-2019-005",
    vatNumber: "CA-GST-005678",
    industry: "Fashion",
    entityType: "Corporation",
    fiscalYearEnd: "December 31",
    address: "456 Fashion Ave, Toronto ON M5V 3A8",
    phone: "+1-416-555-0456",
    email: "style@fashionforward.ca",
    website: "https://fashionforward.ca",
    status: "Active"
  },
  {
    legalName: "Healthcare Innovation Labs GmbH",
    tradingName: "HealthLabs",
    registrationNo: "HL006789",
    registrationDate: new Date("2021-02-28"),
    countryOfRegistration: "Germany",
    baseCurrency: "EUR",
    businessLicenseNr: "BL-HL-2021-006",
    vatNumber: "DE-VAT-006789",
    industry: "Healthcare",
    entityType: "GmbH",
    fiscalYearEnd: "December 31",
    address: "78 Innovation Str, Berlin 10115",
    phone: "+49-30-555-0078",
    email: "research@healthlabs.de",
    website: "https://healthlabs.de",
    status: "Active"
  },
  {
    legalName: "Construction Masters Ltd.",
    tradingName: "BuildMasters",
    registrationNo: "CM007890",
    registrationDate: new Date("2018-05-15"),
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL-CM-2018-007",
    vatNumber: "GB-VAT-007890",
    industry: "Construction",
    entityType: "Limited Company",
    fiscalYearEnd: "March 31",
    address: "92 Builder's Road, Manchester M1 1AA",
    phone: "+44-161-555-0092",
    email: "projects@buildmasters.co.uk",
    website: "https://buildmasters.co.uk",
    status: "Active"
  },
  {
    legalName: "Financial Advisory Services Inc.",
    tradingName: "FinAdvise",
    registrationNo: "FA008901",
    registrationDate: new Date("2017-09-22"),
    countryOfRegistration: "United States",
    baseCurrency: "USD",
    businessLicenseNr: "BL-FA-2017-008",
    vatNumber: "VAT-FA-008901",
    industry: "Financial Services",
    entityType: "Corporation",
    fiscalYearEnd: "December 31",
    address: "147 Wall Street, New York, NY 10005",
    phone: "+1-212-555-0147",
    email: "advice@finadvise.com",
    website: "https://finadvise.com",
    status: "Active"
  },
  {
    legalName: "Educational Technology Solutions Pvt Ltd",
    tradingName: "EduTech",
    registrationNo: "ET009012",
    registrationDate: new Date("2022-07-08"),
    countryOfRegistration: "India",
    baseCurrency: "INR",
    businessLicenseNr: "BL-ET-2022-009",
    vatNumber: "IN-GST-009012",
    industry: "Education",
    entityType: "Private Limited",
    fiscalYearEnd: "March 31",
    address: "203 Tech Park, Bangalore 560001",
    phone: "+91-80-555-0203",
    email: "learn@edutech.in",
    website: "https://edutech.in",
    status: "Active"
  },
  {
    legalName: "Creative Media Agency LLC",
    tradingName: "CreativeHub",
    registrationNo: "CMA010123",
    registrationDate: new Date("2020-12-03"),
    countryOfRegistration: "United States",
    baseCurrency: "USD",
    businessLicenseNr: "BL-CMA-2020-010",
    vatNumber: "VAT-CMA-010123",
    industry: "Media",
    entityType: "LLC",
    fiscalYearEnd: "December 31",
    address: "88 Creative Drive, Los Angeles, CA 90210",
    phone: "+1-323-555-0088",
    email: "create@creativehub.com",
    website: "https://creativehub.com",
    status: "Active"
  },
  {
    legalName: "Logistics Express International SA",
    tradingName: "LogiExpress",
    registrationNo: "LE011234",
    registrationDate: new Date("2019-04-18"),
    countryOfRegistration: "France",
    baseCurrency: "EUR",
    businessLicenseNr: "BL-LE-2019-011",
    vatNumber: "FR-TVA-011234",
    industry: "Logistics",
    entityType: "SA",
    fiscalYearEnd: "December 31",
    address: "65 Transport Blvd, Paris 75001",
    phone: "+33-1-555-0065",
    email: "ship@logiexpress.fr",
    website: "https://logiexpress.fr",
    status: "Active"
  },
  {
    legalName: "Real Estate Ventures Corp.",
    tradingName: "RealVentures",
    registrationNo: "RE012345",
    registrationDate: new Date("2016-10-30"),
    countryOfRegistration: "United States",
    baseCurrency: "USD",
    businessLicenseNr: "BL-RE-2016-012",
    vatNumber: "VAT-RE-012345",
    industry: "Real Estate",
    entityType: "Corporation",
    fiscalYearEnd: "December 31",
    address: "555 Property Plaza, Miami FL 33101",
    phone: "+1-305-555-0555",
    email: "invest@realventures.com",
    website: "https://realventures.com",
    status: "Active"
  },
  {
    legalName: "Automotive Solutions Ltd.",
    tradingName: "AutoSolutions",
    registrationNo: "AS013456",
    registrationDate: new Date("2023-01-25"),
    countryOfRegistration: "Japan",
    baseCurrency: "JPY",
    businessLicenseNr: "BL-AS-2023-013",
    vatNumber: "JP-VAT-013456",
    industry: "Automotive",
    entityType: "Kabushiki Kaisha",
    fiscalYearEnd: "March 31",
    address: "12-3 Auto Street, Tokyo 100-0001",
    phone: "+81-3-555-0123",
    email: "service@autosolutions.jp",
    website: "https://autosolutions.jp",
    status: "Active"
  },
  {
    legalName: "Sports & Recreation Hub Pty Ltd",
    tradingName: "SportHub",
    registrationNo: "SR014567",
    registrationDate: new Date("2021-08-14"),
    countryOfRegistration: "Australia",
    baseCurrency: "AUD",
    businessLicenseNr: "BL-SR-2021-014",
    vatNumber: "AU-ABN-014567",
    industry: "Sports",
    entityType: "Proprietary Limited",
    fiscalYearEnd: "June 30",
    address: "99 Sports Complex, Melbourne VIC 3000",
    phone: "+61-3-555-0099",
    email: "play@sporthub.com.au",
    website: "https://sporthub.com.au",
    status: "Active"
  },
  {
    legalName: "Environmental Consulting Group Inc.",
    tradingName: "EcoConsult",
    registrationNo: "EC015678",
    registrationDate: new Date("2018-12-07"),
    countryOfRegistration: "Canada",
    baseCurrency: "CAD",
    businessLicenseNr: "BL-EC-2018-015",
    vatNumber: "CA-GST-015678",
    industry: "Environmental",
    entityType: "Corporation",
    fiscalYearEnd: "December 31",
    address: "777 Green Way, Vancouver BC V6B 1A1",
    phone: "+1-604-555-0777",
    email: "consult@ecoconsult.ca",
    website: "https://ecoconsult.ca",
    status: "Active"
  }
];

async function addTestCompanies() {
  try {
    console.log('🏢 Starting to add 15 test companies...');
    
    // Add companies one by one to get proper IDs
    for (const [index, companyData] of testCompanies.entries()) {
      const company = await prisma.company.create({
        data: companyData
      });
      console.log(`✅ Added company ${index + 1}/15: ${company.tradingName} (ID: ${company.id})`);
    }
    
    console.log('🎉 Successfully added all 15 test companies!');
    
    // Show summary
    const totalCompanies = await prisma.company.count();
    console.log(`📊 Total companies in database: ${totalCompanies}`);
    
  } catch (error) {
    console.error('❌ Error adding test companies:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addTestCompanies()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });