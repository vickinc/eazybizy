/**
 * Debug script to inspect company data in localStorage
 * Run this in the browser console to see current company status values
 */

// Function to inspect company data from localStorage
function inspectCompanyData() {
  try {
    // Get companies from localStorage
    const companiesData = localStorage.getItem('app-companies');
    
    if (!companiesData) {
      console.log('❌ No company data found in localStorage');
      return;
    }
    
    const companies = JSON.parse(companiesData);
    console.log('📊 Found', companies.length, 'companies in localStorage:');
    console.log('');
    
    // Display each company with their status
    companies.forEach((company, index) => {
      console.log(`🏢 Company ${index + 1}:`);
      console.log(`   Legal Name: ${company.legalName}`);
      console.log(`   Trading Name: ${company.tradingName}`);
      console.log(`   Status: "${company.status}" (${typeof company.status})`);
      console.log(`   ID: ${company.id}`);
      console.log('');
    });
    
    // Show status value distribution
    const statusCounts = {};
    companies.forEach(company => {
      const status = company.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('📈 Status value distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   "${status}": ${count} companies`);
    });
    
    // Check for "LegalBison" company specifically
    const legalBison = companies.find(c => 
      c.legalName.toLowerCase().includes('legalbison') || 
      c.tradingName.toLowerCase().includes('legalbison')
    );
    
    if (legalBison) {
      console.log('');
      console.log('🎯 LegalBison company found:');
      console.log('   Status:', `"${legalBison.status}"`);
      console.log('   Full data:', legalBison);
    } else {
      console.log('');
      console.log('⚠️  No "LegalBison" company found in data');
    }
    
    return companies;
  } catch (error) {
    console.error('❌ Error inspecting company data:', error);
  }
}

// Function to show the validation issue
function showValidationIssue() {
  console.log('🔍 VALIDATION ISSUE ANALYSIS:');
  console.log('');
  console.log('The invoice validation expects company.status !== "active" (lowercase)');
  console.log('But the company management system uses "Active" and "Passive" (capitalized)');
  console.log('');
  console.log('File locations:');
  console.log('- Invoice validation: src/services/validation/invoiceValidationService.ts:220');
  console.log('- Company validation: src/services/business/companyValidationService.ts:92');
  console.log('- Company business service: src/services/business/companyBusinessService.ts:263');
  console.log('');
}

// Function to add a LegalBison test company
function addLegalBisonTestCompany() {
  try {
    const companiesData = localStorage.getItem('app-companies');
    const companies = companiesData ? JSON.parse(companiesData) : [];
    
    // Check if LegalBison already exists
    const existing = companies.find(c => 
      c.legalName.toLowerCase().includes('legalbison') || 
      c.tradingName.toLowerCase().includes('legalbison')
    );
    
    if (existing) {
      console.log('⚠️  LegalBison company already exists');
      return existing;
    }
    
    // Generate new ID
    const maxId = companies.length > 0 ? Math.max(...companies.map(c => c.id)) : 0;
    
    // Create LegalBison test company
    const legalBison = {
      id: maxId + 1,
      legalName: "LegalBison Legal Services LLC",
      tradingName: "LegalBison",
      registrationNo: "LB004-2023",
      industry: "Legal Services",
      address: "101 Legal Plaza, Boston, MA 02101",
      phone: "+1 (555) 123-LEGAL",
      email: "contact@legalbison.com",
      website: "www.legalbison.com",
      status: "Active",  // This is the issue - should be lowercase "active" for invoice validation
      logo: "LB"
    };
    
    companies.push(legalBison);
    localStorage.setItem('app-companies', JSON.stringify(companies));
    
    console.log('✅ Added LegalBison test company with status "Active"');
    console.log('   This will cause the invoice validation error because it expects lowercase "active"');
    
    return legalBison;
  } catch (error) {
    console.error('❌ Error adding LegalBison company:', error);
  }
}

// Main inspection function
console.log('🚀 Company Data Inspector loaded!');
console.log('');
console.log('Available functions:');
console.log('- inspectCompanyData() - Show all company data and status values');
console.log('- showValidationIssue() - Explain the validation mismatch');
console.log('- addLegalBisonTestCompany() - Add a test LegalBison company');
console.log('');
console.log('Run inspectCompanyData() to start:');

// Auto-run inspection
inspectCompanyData();
showValidationIssue();
