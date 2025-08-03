const testCompanies = [
  {
    legalName: "Tech Innovations Inc.",
    tradingName: "TechInno",
    registrationNo: "REG001234",
    registrationDate: "2020-01-15",
    countryOfRegistration: "United States",
    baseCurrency: "USD",
    businessLicenseNr: "BL001234",
    vatNumber: "VAT001234",
    industry: "Technology",
    entityType: "Corporation",
    fiscalYearEnd: "12",
    address: "123 Silicon Valley Way, San Francisco, CA 94105",
    phone: "+1-415-555-0101",
    email: "info@techinno.com",
    website: "https://techinno.com",
    status: "Active",
    logo: "",
    facebookUrl: "https://facebook.com/techinno",
    instagramUrl: "https://instagram.com/techinno",
    xUrl: "https://x.com/techinno",
    youtubeUrl: "https://youtube.com/techinno",
    whatsappNumber: "+1-415-555-0101",
    telegramNumber: "@techinno"
  },
  {
    legalName: "Global Trading Solutions Ltd.",
    tradingName: "GTS",
    registrationNo: "REG002345",
    registrationDate: "2019-03-22",
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL002345",
    vatNumber: "VAT002345",
    industry: "Import/Export",
    entityType: "Limited Company",
    fiscalYearEnd: "03",
    address: "456 Commerce Street, London, EC1A 1BB",
    phone: "+44-20-7123-4567",
    email: "contact@gts-global.co.uk",
    website: "https://gts-global.co.uk",
    status: "Active",
    logo: "",
    facebookUrl: "https://facebook.com/gtsglobal",
    instagramUrl: "https://instagram.com/gtsglobal",
    xUrl: "https://x.com/gtsglobal"
  },
  {
    legalName: "Creative Design Studio Pte Ltd",
    tradingName: "Creative Studio",
    registrationNo: "REG003456",
    registrationDate: "2021-06-10",
    countryOfRegistration: "Singapore",
    baseCurrency: "SGD",
    businessLicenseNr: "BL003456",
    vatNumber: "VAT003456",
    industry: "Marketing & Design",
    entityType: "Private Limited",
    fiscalYearEnd: "12",
    address: "789 Design Boulevard, Singapore 123456",
    phone: "+65-6789-0123",
    email: "hello@creativestudio.sg",
    website: "https://creativestudio.sg",
    status: "Active",
    logo: "",
    instagramUrl: "https://instagram.com/creativestudiosg",
    youtubeUrl: "https://youtube.com/creativestudiosg"
  },
  {
    legalName: "Health & Wellness Solutions Inc.",
    tradingName: "HealthWell",
    registrationNo: "REG004567",
    registrationDate: "2018-09-05",
    countryOfRegistration: "Canada",
    baseCurrency: "CAD",
    businessLicenseNr: "BL004567",
    vatNumber: "VAT004567",
    industry: "Healthcare",
    entityType: "Corporation",
    fiscalYearEnd: "06",
    address: "321 Wellness Way, Toronto, ON M5V 3A8",
    phone: "+1-416-555-0202",
    email: "info@healthwell.ca",
    website: "https://healthwell.ca",
    status: "Active",
    logo: "",
    facebookUrl: "https://facebook.com/healthwellca",
    xUrl: "https://x.com/healthwellca"
  },
  {
    legalName: "Eco Energy Solutions GmbH",
    tradingName: "EcoEnergy",
    registrationNo: "REG005678",
    registrationDate: "2020-11-30",
    countryOfRegistration: "Germany",
    baseCurrency: "EUR",
    businessLicenseNr: "BL005678",
    vatNumber: "DE123456789",
    industry: "Renewable Energy",
    entityType: "GmbH",
    fiscalYearEnd: "12",
    address: "567 Green Street, Berlin, 10115",
    phone: "+49-30-1234-5678",
    email: "kontakt@ecoenergy.de",
    website: "https://ecoenergy.de",
    status: "Active",
    logo: "",
    facebookUrl: "https://facebook.com/ecoenergyDE",
    instagramUrl: "https://instagram.com/ecoenergyDE",
    xUrl: "https://x.com/ecoenergyDE",
    youtubeUrl: "https://youtube.com/ecoenergyDE"
  },
  {
    legalName: "Digital Marketing Experts LLC",
    tradingName: "DigiExperts",
    registrationNo: "REG006789",
    registrationDate: "2022-02-14",
    countryOfRegistration: "United States",
    baseCurrency: "USD",
    businessLicenseNr: "BL006789",
    vatNumber: "VAT006789",
    industry: "Digital Marketing",
    entityType: "LLC",
    fiscalYearEnd: "12",
    address: "890 Marketing Ave, New York, NY 10001",
    phone: "+1-212-555-0303",
    email: "team@digiexperts.com",
    website: "https://digiexperts.com",
    status: "Active",
    logo: "",
    instagramUrl: "https://instagram.com/digiexperts",
    xUrl: "https://x.com/digiexperts",
    whatsappNumber: "+1-212-555-0303"
  },
  {
    legalName: "Financial Advisory Services Pty Ltd",
    tradingName: "FinAdvise",
    registrationNo: "REG007890",
    registrationDate: "2017-07-20",
    countryOfRegistration: "Australia",
    baseCurrency: "AUD",
    businessLicenseNr: "BL007890",
    vatNumber: "VAT007890",
    industry: "Financial Services",
    entityType: "Pty Ltd",
    fiscalYearEnd: "06",
    address: "234 Finance Street, Sydney, NSW 2000",
    phone: "+61-2-9876-5432",
    email: "contact@finadvise.com.au",
    website: "https://finadvise.com.au",
    status: "Active",
    logo: "",
    facebookUrl: "https://facebook.com/finadviseAU",
    xUrl: "https://x.com/finadviseAU"
  },
  {
    legalName: "Restaurant Chain Holdings Ltd.",
    tradingName: "FoodChain",
    registrationNo: "REG008901",
    registrationDate: "2019-04-18",
    countryOfRegistration: "United Kingdom",
    baseCurrency: "GBP",
    businessLicenseNr: "BL008901",
    vatNumber: "VAT008901",
    industry: "Food & Beverage",
    entityType: "Limited Company",
    fiscalYearEnd: "12",
    address: "567 Food Court, Manchester, M1 2JQ",
    phone: "+44-161-234-5678",
    email: "info@foodchain.co.uk",
    website: "https://foodchain.co.uk",
    status: "Active",
    logo: "",
    facebookUrl: "https://facebook.com/foodchainUK",
    instagramUrl: "https://instagram.com/foodchainUK",
    youtubeUrl: "https://youtube.com/foodchainUK"
  },
  {
    legalName: "Real Estate Development Corp.",
    tradingName: "RealDev",
    registrationNo: "REG009012",
    registrationDate: "2018-12-01",
    countryOfRegistration: "United States",
    baseCurrency: "USD",
    businessLicenseNr: "BL009012",
    vatNumber: "VAT009012",
    industry: "Real Estate",
    entityType: "Corporation",
    fiscalYearEnd: "12",
    address: "999 Property Lane, Los Angeles, CA 90001",
    phone: "+1-310-555-0404",
    email: "info@realdev.com",
    website: "https://realdev.com",
    status: "Active",
    logo: "",
    facebookUrl: "https://facebook.com/realdev",
    xUrl: "https://x.com/realdev",
    whatsappNumber: "+1-310-555-0404"
  },
  {
    legalName: "Educational Technology Solutions Inc.",
    tradingName: "EduTech",
    registrationNo: "REG010123",
    registrationDate: "2021-08-25",
    countryOfRegistration: "Canada",
    baseCurrency: "CAD",
    businessLicenseNr: "BL010123",
    vatNumber: "VAT010123",
    industry: "Education Technology",
    entityType: "Corporation",
    fiscalYearEnd: "08",
    address: "123 Learning Street, Vancouver, BC V6B 1A1",
    phone: "+1-604-555-0505",
    email: "hello@edutech.ca",
    website: "https://edutech.ca",
    status: "Active",
    logo: "",
    facebookUrl: "https://facebook.com/edutechCA",
    instagramUrl: "https://instagram.com/edutechCA",
    xUrl: "https://x.com/edutechCA",
    youtubeUrl: "https://youtube.com/edutechCA",
    telegramNumber: "@edutechCA"
  }
];

async function addTestCompanies() {
  const baseUrl = 'http://localhost:3000';
  
  console.log(`Starting to add ${testCompanies.length} test companies...`);
  
  for (let i = 0; i < testCompanies.length; i++) {
    const company = testCompanies[i];
    console.log(`\nAdding company ${i + 1}/${testCompanies.length}: ${company.tradingName}`);
    
    try {
      const response = await fetch(`${baseUrl}/api/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(company),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Successfully added: ${company.tradingName} (ID: ${result.id})`);
      } else {
        const error = await response.json();
        console.error(`❌ Failed to add ${company.tradingName}:`, error);
      }
    } catch (error) {
      console.error(`❌ Error adding ${company.tradingName}:`, error.message);
    }
  }
  
  console.log('\n✨ Finished adding test companies!');
}

// Run the script
addTestCompanies().catch(console.error);