import { ChartOfAccount, AccountType, VATType, AccountCategory, AccountSubcategory } from '@/types/chartOfAccounts.types';

export interface ParsedCSVRow {
  Code: string;
  Name: string;
  Type: string;
  VAT: string;
  'Related Vendor': string;
  'Account Type': string;
  'Subcategory'?: string;
  'IFRS Reference'?: string;
}

export class ChartOfAccountsParserService {
  static generateAccountId(): string {
    return `account_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  static parseCSVData(csvData: string): ChartOfAccount[] {
    const lines = csvData.trim().split('\n');
    const headers = this.parseCSVLine(lines[0]);
    const accounts: ChartOfAccount[] = [];

    for (const i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      
      if (values.length >= 6) {
        const account = this.createAccountFromCSVRow(headers, values);
        if (account) {
          accounts.push(account);
        }
      }
    }

    return accounts;
  }

  static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    const current = '';
    const inQuotes = false;
    
    for (const i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip the next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  }

  static createAccountFromCSVRow(headers: string[], values: string[]): ChartOfAccount | null {
    try {
      const rowData: Partial<ParsedCSVRow> = {};
      
      headers.forEach((header, index) => {
        if (values[index] !== undefined) {
          rowData[header as keyof ParsedCSVRow] = values[index];
        }
      });

      const code = rowData.Code || '';
      const name = rowData.Name || '';
      const type = this.mapAccountType(rowData.Type || '');
      const vat = this.mapVATType(rowData.VAT || '');
      const relatedVendor = rowData['Related Vendor'] || '';
      const accountType = (rowData['Account Type'] || 'Detail') as 'Detail' | 'Header';

      if (!code || !name || !type || !vat) {
        console.warn('Invalid CSV row data:', rowData);
        return null;
      }

      const account: ChartOfAccount = {
        id: this.generateAccountId(),
        code,
        name,
        type,
        category: this.getAccountCategory(code, type),
        subcategory: this.getAccountSubcategory(code, type),
        vat,
        relatedVendor: relatedVendor || undefined,
        accountType,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ifrsReference: this.getIFRSReference(code, type)
      };

      return account;
    } catch (error) {
      console.error('Error parsing CSV row:', error, { headers, values });
      return null;
    }
  }

  static mapAccountType(csvType: string): AccountType | null {
    const typeMap: { [key: string]: AccountType } = {
      'Assets': 'Assets',
      'Liability': 'Liability', 
      'Revenue': 'Revenue',
      'Expense': 'Expense'
    };

    return typeMap[csvType] || null;
  }

  static mapVATType(csvVAT: string): VATType | null {
    // Direct mapping for most cases
    const directMappings: { [key: string]: VATType } = {
      'Not included in Turnover': 'Not included in Turnover',
      'Value Added Tax 22%': 'Value Added Tax 22%',
      'Value Added Tax 9%': 'Value Added Tax 9%',
      'Value Added Tax 0%': 'Value Added Tax 0%',
      'Turnover exempt from VAT': 'Turnover exempt from VAT',
      'VAT on acquisition of non-current assets': 'VAT on acquisition of non-current assets',
      'Taxation on the profit margin KMS§41 42': 'Taxation on the profit margin',
      'Immovable property and scrap met KMS§41': 'Immovable property and scrap metal'
    };

    // Check direct mappings first
    const directMapping = directMappings[csvVAT];
    if (directMapping) {
      return directMapping;
    }

    // For unmapped values, check if it's a valid VAT treatment name
    // This allows for dynamic VAT types that aren't in the static mapping
    try {
      // Import the service here to avoid circular dependencies
      const { VATTypesIntegrationService } = require('./vatTypesIntegrationService');
      const allVATTypes = VATTypesIntegrationService.getAllVATTypes();
      
      // Check if the CSV VAT type exists in our dynamic list
      const foundType = allVATTypes.find((type: string) => type === csvVAT);
      if (foundType) {
        return foundType;
      }
    } catch (error) {
      console.warn('Could not check dynamic VAT types:', error);
    }

    return null;
  }

  static getDefaultChartOfAccounts(): ChartOfAccount[] {
    // Complete Chart of Accounts data from Chart of Accounts.md (217 accounts)
    const rawData = [
      { code: '1000', name: 'Cash', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1060', name: 'Term deposits', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1070', name: 'Investments in highly liquid funds', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1080', name: 'Deposits in transit / intermediary bank account', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1100', name: 'Short-term investments', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1200', name: 'Trade receivables', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1208', name: 'Less provision for doubtful debts', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1210', name: 'Tax prepayments', type: 'Assets', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '1220', name: 'Card sales', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1221', name: 'Receivables from Social Insurance Board', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1230', name: 'Receivables from related parties', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1240', name: 'Loan receivables', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1242', name: 'Interest receivables', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1246', name: 'Netting', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1250', name: 'Prepaid insurance', type: 'Assets', vat: 'Turnover exempt from VAT' },
      { code: '1252', name: 'Down payment for prepaid operating lease', type: 'Assets', vat: 'Value Added Tax 22%' },
      { code: '1254', name: 'Other prepaid expenses', type: 'Assets', vat: 'Value Added Tax 22%' },
      { code: '1280', name: 'Claims to owner(s)', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1310', name: 'Raw materials', type: 'Assets', vat: 'Value Added Tax 22%' },
      { code: '1320', name: 'Work in progress', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1330', name: 'Finished goods', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1340', name: 'Merchandise', type: 'Assets', vat: 'Value Added Tax 22%' },
      { code: '1350', name: 'Advances to suppliers', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1400', name: 'Biological assets', type: 'Assets', vat: 'Value Added Tax 22%' },
      { code: '1600', name: 'Shares of subsidiaries', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1610', name: 'Shares of associates', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1630', name: 'Other shares and securities', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1640', name: 'Other long-term receivables and prepayments', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1700', name: 'Investment property', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1710', name: 'Investment property - accumulated depreciation', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1800', name: 'Land', type: 'Assets', vat: 'Turnover exempt from VAT' },
      { code: '1820', name: 'Buildings and structures', type: 'Assets', vat: 'Turnover exempt from VAT' },
      { code: '1821', name: 'Buildings and structures - accumulated depreciation', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1830', name: 'Transportation facilities', type: 'Assets', vat: 'VAT on acquisition of non-current assets' },
      { code: '1831', name: 'Transportation facilities - accumulated depreciation', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1832', name: 'Computers and computer systems', type: 'Assets', vat: 'VAT on acquisition of non-current assets' },
      { code: '1833', name: 'Computers and computer systems - accumulated depreciation', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1834', name: 'Other machinery and equipment', type: 'Assets', vat: 'VAT on acquisition of non-current assets' },
      { code: '1835', name: 'Other machinery and equipment - accumulated depreciation', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1840', name: 'Other property, plant and equipment', type: 'Assets', vat: 'VAT on acquisition of non-current assets' },
      { code: '1841', name: 'Other property, plant and equipment - accumulated depreciation', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1870', name: 'Unfinished buildings, projects', type: 'Assets', vat: 'VAT on acquisition of non-current assets' },
      { code: '1880', name: 'Prepayments for non-current assets', type: 'Assets', vat: 'VAT on acquisition of non-current assets' },
      { code: '1890', name: 'Bearer biological assets', type: 'Assets', vat: 'VAT on acquisition of non-current assets' },
      { code: '1900', name: 'Goodwill', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1901', name: 'Goodwill - accumulated amortisation', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1910', name: 'Development expenditures', type: 'Assets', vat: 'Value Added Tax 22%' },
      { code: '1911', name: 'Development expenditures - accumulated depreciation', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1920', name: 'Computer software', type: 'Assets', vat: 'Value Added Tax 22%' },
      { code: '1921', name: 'Computer software - accumulated depreciation', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1940', name: 'Concessions, patents, licences, trademarks', type: 'Assets', vat: 'Value Added Tax 22%' },
      { code: '1941', name: 'Concessions, patents ... accumulated amortisation', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1960', name: 'Other intangible assets', type: 'Assets', vat: 'Value Added Tax 22%' },
      { code: '1961', name: 'Other intangible assets - accumulated amortisation', type: 'Assets', vat: 'Not included in Turnover' },
      { code: '1980', name: 'Unfinished intangible assets projects and prepayments', type: 'Assets', vat: 'Value Added Tax 22%' },
      { code: '2010', name: 'Short-term bank loans', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2020', name: 'Current bank overdrafts', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2030', name: 'Short-term loan from the owner', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2070', name: 'Current portion of long-term debt', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2080', name: 'Current portion of long-term financial lease liabilities', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2110', name: 'Trade payables', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2210', name: 'Salaries and wages payable', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2211', name: 'Maintenance support withholdings from salary', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2212', name: 'Fine withholdings from salary (incl. enforcement authorities)', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2219', name: 'Other withholdings from salaries', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2280', name: 'Vacation pay liability', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2305', name: 'Value added tax on sales in a permanent business location outside Country', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2306', name: 'Input value added tax in a permanent business location outside Country', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2307', name: 'Value added tax payable in a permanent business location', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2308', name: 'Value added tax on sales of OSS in the EU (special arrangement)', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2309', name: 'Value added tax payable on sales of OSS (special arrangement)', type: 'Liability', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '2310', name: 'VAT on sales', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2311', name: 'Input value added tax', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2312', name: 'VAT on the acquisition of fixed assets', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2313', name: 'Value added tax paid on an import at customs', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2314', name: 'Reverse charge on VAT', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2315', name: 'Recalculation of input VAT, corrections', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2316', name: 'Value added tax payable on imports, VAT', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2317', name: 'Value added tax payable', type: 'Liability', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '2319', name: 'Proportionally calculated input VAT', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2320', name: 'Social tax payable', type: 'Liability', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '2330', name: 'Personal income tax payable', type: 'Liability', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '2340', name: 'Unemployment insurance premium payable', type: 'Liability', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '2350', name: 'Funded pension payment liabilities', type: 'Liability', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '2360', name: 'Income tax payable', type: 'Liability', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '2370', name: 'Fringe benefit income tax payable', type: 'Liability', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '2380', name: 'Land tax payable', type: 'Liability', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '2382', name: 'Excise tax payable', type: 'Liability', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '2386', name: 'Other taxes (incl. customs duties, heavy vehicle use tax, etc.) payable', type: 'Liability', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '2390', name: 'Interests on taxes payable', type: 'Liability', vat: 'Not included in Turnover', relatedVendor: 'Tax Authority' },
      { code: '2400', name: 'Dividends payable', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2401', name: 'Accrued income tax on dividends payable', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2405', name: 'Interest payable', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2410', name: 'Payables to related parties', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2430', name: 'Purchase invoices paid by debit card', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2440', name: 'Purchase invoices paid by credit card', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2450', name: 'Other payables', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2460', name: 'Accrued social tax', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2462', name: 'Accrued personal income tax', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2464', name: 'Accrued unemployment insurance premiums', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2466', name: 'Accrued funded pension liabilities', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2500', name: 'Prepayments from customers', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2510', name: 'Invoices for prepayments to customers', type: 'Liability', vat: 'Value Added Tax 22%' },
      { code: '2600', name: 'Government grants for operating costs', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2700', name: 'Short-term provisions', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2810', name: 'Long-term bank loan', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2820', name: 'Long-term loan from the owner', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2830', name: 'Long-term portion of finance lease', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2860', name: 'Other long-term payables', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2870', name: 'Long-term provisions', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2880', name: 'Government grants for the acquisition of fixed assets', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2910', name: 'Issued capital', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2912', name: 'Issued share capital', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2920', name: 'Unregistered equity', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2922', name: 'Unregistered shareholders\' equity', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2930', name: 'Share premium', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2940', name: 'Treasury shares', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2942', name: 'Treasury shares', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2950', name: 'Statutory reserve capital', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2960', name: 'Other reserves', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2962', name: 'Uncalled capital', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2970', name: 'Retained earnings', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '2980', name: 'Profit for the year', type: 'Liability', vat: 'Not included in Turnover' },
      { code: '3000', name: 'Sales of goods, services in Country 22%', type: 'Revenue', vat: 'Value Added Tax 22%' },
      { code: '3010', name: 'Sales of goods to the EU 0%', type: 'Revenue', vat: 'Value Added Tax 0%' },
      { code: '3015', name: 'Sales of services to the EU 0%', type: 'Revenue', vat: 'Value Added Tax 0%' },
      { code: '3020', name: 'Export of goods', type: 'Revenue', vat: 'Value Added Tax 0%' },
      { code: '3025', name: 'Service exports', type: 'Revenue', vat: 'Value Added Tax 0%' },
      { code: '3040', name: 'Net sales 9%', type: 'Revenue', vat: 'Value Added Tax 9%' },
      { code: '3060', name: 'Turnover exempt from VAT', type: 'Revenue', vat: 'Turnover exempt from VAT' },
      { code: '3070', name: 'Sales of second-hand goods at cost', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '3075', name: 'Sales of second-hand goods taxed at 22%', type: 'Revenue', vat: 'Taxation on the profit margin KMS§41 42' },
      { code: '3076', name: 'Sales of second-hand goods taxed at 9%', type: 'Revenue', vat: 'Taxation on the profit margin KMS§41 42' },
      { code: '3080', name: 'Sales of scrap metal, immovable property, precious metals', type: 'Revenue', vat: 'Immovable property and scrap met KMS§41' },
      { code: '3099', name: 'Roundings', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '3510', name: 'Sales of fixed assets (taxed at 22%)', type: 'Revenue', vat: 'Value Added Tax 22%' },
      { code: '3511', name: 'Sales of fixed assets (exempt from tax)', type: 'Revenue', vat: 'Turnover exempt from VAT' },
      { code: '3512', name: 'Net book value of the sold fixed assets', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '3514', name: 'Loss on sale of fixed assets under operating activities', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '3520', name: 'Realised gain on currency exchange rates', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '3530', name: 'Subsidies and grants', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '3540', name: 'Income from government grants', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '3560', name: 'Other income', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '3590', name: 'Write-off of immaterial balances', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '3900', name: 'Gain (loss) on revaluation of biological assets', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '3910', name: 'Increase/decrease in inventories of finished goods and work in progress', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '3920', name: 'Capitalised expenditures for the entity\'s own use', type: 'Revenue', vat: 'Value Added Tax 22%' },
      { code: '4000', name: 'Goods sold at cost price', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4002', name: 'Materials expensed', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4003', name: 'Raw materials expensed', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4004', name: 'Low value assets', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4006', name: 'Transportation expenses', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4008', name: 'Services purchased for resale', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4009', name: 'Subcontracted work', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4010', name: 'Spare parts, repair and maintenance of machinery', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4015', name: 'Rental of buildings and equipment', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4020', name: 'Fuel', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4030', name: 'Electricity', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4040', name: 'Other services (related to operating activities)', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4050', name: 'Other materials (related to operating activities)', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4200', name: 'Set-up costs', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4210', name: 'Room rental', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4230', name: 'Utilities for rooms', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4240', name: 'Room repair and maintenance', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4250', name: 'Security expenses for rooms', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4300', name: 'Advertising expenses', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4310', name: 'Telephone, Internet', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4320', name: 'IT services, computer accessories', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4330', name: 'Office supplies, postal expenses', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4335', name: 'Newspapers, magazines, books', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4340', name: 'Banking services', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4350', name: 'Irrecoverable receivables', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4360', name: 'State fees', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4365', name: 'Land tax', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4370', name: 'Consultations, trainings', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4380', name: 'Auditor\'s fees', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4385', name: 'Accounting services', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4390', name: 'Property insurance', type: 'Expense', vat: 'Turnover exempt from VAT' },
      { code: '4395', name: 'Other operating expenses', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4396', name: 'Interest to suppliers, penalties for delays', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4398', name: 'Write-off of immaterial balances', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4399', name: 'Roundings', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4410', name: 'Operating lease of cars', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4420', name: 'Car insurance', type: 'Expense', vat: 'Turnover exempt from VAT' },
      { code: '4430', name: 'Car fuel', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4440', name: 'Repair and maintenance of cars', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4460', name: 'Allowance for the use of a personal car', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4470', name: 'Other expenses related to cars', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4510', name: 'Travel expenses', type: 'Expense', vat: 'Value Added Tax 22%' },
      { code: '4610', name: 'Fringe benefits to employees', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4646', name: '24% VAT on fringe benefits (own use)', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4648', name: '22% VAT on fringe benefits (own use)', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4650', name: '20% VAT on fringe benefits (own use)', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4660', name: '9% VAT on fringe benefits (own use)', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4668', name: '5% VAT on fringe benefits (own use)', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4670', name: 'Income tax on fringe benefits', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4680', name: 'Social tax on fringe benefits', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4710', name: 'Wages and salaries', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4720', name: 'Social security costs', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4790', name: 'Vacation liability cost (reserve)', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4791', name: 'Social tax cost on vacation liability', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4810', name: 'Depreciation of non-current assets', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4820', name: 'Depreciation of investment property', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4830', name: 'Amortisation of intangible assets', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4900', name: 'Loss on disposal of fixed assets', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4910', name: 'Loss on sale of fixed assets', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4940', name: 'Interest due the Tax Board', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4950', name: 'Realised loss on currency exchange rates', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4970', name: 'Expenses not related to business', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4980', name: 'Costs of entertaining guests', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '4990', name: 'Other operating charges', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '6000', name: 'Profit (loss) from subsidiaries and associates', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '6010', name: 'Gain (loss) on financial investments', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '6040', name: 'Gain (loss) on foreign currency translations', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '6050', name: 'Interest income', type: 'Revenue', vat: 'Not included in Turnover' },
      { code: '6060', name: 'Interest expense on loans', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '6065', name: 'Interest expense on finance lease', type: 'Expense', vat: 'Not included in Turnover' },
      { code: '7000', name: 'Income tax', type: 'Expense', vat: 'Not included in Turnover' }
    ];

    // Transform raw data into full ChartOfAccount objects with auto-generated categories and IFRS fields
    return rawData.map(data => ({
      id: this.generateAccountId(),
      code: data.code,
      name: data.name,
      type: data.type as AccountType,
      category: this.getAccountCategory(data.code, data.type as AccountType),
      subcategory: this.getAccountSubcategory(data.code, data.type as AccountType),
      vat: data.vat as VATType,
      relatedVendor: (data as any).relatedVendor || undefined,
      accountType: 'Detail' as const,
      isActive: true,
      balance: (data as any).balance || 0,
      hasTransactions: (data as any).hasTransactions || false,
      transactionCount: (data as any).transactionCount || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ifrsReference: this.getIFRSReference(data.code, data.type as AccountType)
    }));
  }

  static validateAccountCode(code: string): boolean {
    // Account codes should be numeric and unique
    return /^\d{4}$/.test(code);
  }

  static validateAccountName(name: string): boolean {
    // Names should be non-empty and reasonable length
    return name.trim().length > 0 && name.trim().length <= 200;
  }

  static getAccountCategory(code: string, type: AccountType): AccountCategory {
    // Auto-assign category based on account code and type from Chart of Accounts.md
    const codeNumber = parseInt(code);
    
    switch (type) {
      case 'Assets':
        // Cash and cash equivalents (1000-1080)
        if (codeNumber >= 1000 && codeNumber <= 1080) return 'Cash and cash equivalents';
        // Financial investments (1100, 1630)
        if (codeNumber === 1100 || codeNumber === 1630) return 'Financial investments';
        // Trade receivables (1200-1208)
        if (codeNumber >= 1200 && codeNumber <= 1208) return 'Trade receivables';
        // Tax prepayments and receivables (1210)
        if (codeNumber === 1210) return 'Tax prepayments and receivables';
        // Other receivables (1220-1246)
        if (codeNumber >= 1220 && codeNumber <= 1246) return 'Other receivables';
        // Loan Receivables (1240)
        if (codeNumber === 1240) return 'Loan Receivables';
        // Prepayments for services (1250-1254)
        if (codeNumber >= 1250 && codeNumber <= 1254) return 'Prepayments for services';
        // Receivables from connected parties (1280)
        if (codeNumber === 1280) return 'Receivables from connected parties';
        // Raw materials (1310)
        if (codeNumber === 1310) return 'Raw materials';
        // Work in progress (1320)
        if (codeNumber === 1320) return 'Work in progress';
        // Finished goods (1330)
        if (codeNumber === 1330) return 'Finished goods';
        // Purchases (1340)
        if (codeNumber === 1340) return 'Purchases';
        // Prepayments for inventories (1350)
        if (codeNumber === 1350) return 'Prepayments for inventories';
        // Biological assets (1400, 1890)
        if (codeNumber === 1400 || codeNumber === 1890) return 'Biological assets';
        // Shares of subsidiaries (1600-1610)
        if (codeNumber >= 1600 && codeNumber <= 1610) return 'Shares of subsidiaries';
        // Receivables and prepayments (1640)
        if (codeNumber === 1640) return 'Receivables and prepayments';
        // Investment property (1700-1710)
        if (codeNumber >= 1700 && codeNumber <= 1710) return 'Investment property';
        // Land (1800)
        if (codeNumber === 1800) return 'Land';
        // Buildings (1820-1821)
        if (codeNumber >= 1820 && codeNumber <= 1821) return 'Buildings';
        // Machinery and equipment (1830-1835)
        if (codeNumber >= 1830 && codeNumber <= 1835) return 'Machinery and equipment';
        // Other tangible assets (1840-1841)
        if (codeNumber >= 1840 && codeNumber <= 1841) return 'Other tangible assets';
        // Unfinished construction projects and prepayments (1870-1880)
        if (codeNumber >= 1870 && codeNumber <= 1880) return 'Unfinished construction projects and prepayments';
        // Goodwill (1900-1901)
        if (codeNumber >= 1900 && codeNumber <= 1901) return 'Goodwill';
        // Development expenditures (1910-1911)
        if (codeNumber >= 1910 && codeNumber <= 1911) return 'Development expenditures';
        // Computer software (1920-1921)
        if (codeNumber >= 1920 && codeNumber <= 1921) return 'Computer software';
        // Concessions, patents, licences, trademarks (1940-1941)
        if (codeNumber >= 1940 && codeNumber <= 1941) return 'Concessions, patents, licences, trademarks';
        // Other intangible assets (1960-1961)
        if (codeNumber >= 1960 && codeNumber <= 1961) return 'Other intangible assets';
        // Unfinished projects for intangible assets (1980)
        if (codeNumber === 1980) return 'Unfinished projects for intangible assets';
        return 'Other receivables';
      case 'Liability':
        // Current loans and notes payable (2010-2030)
        if (codeNumber >= 2010 && codeNumber <= 2030) return 'Current loans and notes payable';
        // Current portion of long-term debts (2070-2080)
        if (codeNumber >= 2070 && codeNumber <= 2080) return 'Current portion of long-term debts';
        // Trade payables (2110)
        if (codeNumber === 2110) return 'Trade payables';
        // Payables to employees (2210-2280)
        if (codeNumber >= 2210 && codeNumber <= 2280) return 'Payables to employees';
        // Tax payables (2305-2390)
        if (codeNumber >= 2305 && codeNumber <= 2390) return 'Tax payables';
        // Other payables (2400-2477)
        if (codeNumber >= 2400 && codeNumber <= 2477) return 'Other payables';
        // Other received prepayments (2500-2510)
        if (codeNumber >= 2500 && codeNumber <= 2510) return 'Other received prepayments';
        // Targeted financing (2600)
        if (codeNumber === 2600) return 'Targeted financing';
        // Other provisions (2700, 2870)
        if (codeNumber === 2700 || codeNumber === 2870) return 'Other provisions';
        // Loan liabilities (2810-2830)
        if (codeNumber >= 2810 && codeNumber <= 2830) return 'Loan liabilities';
        // Payables and prepayments (2860)
        if (codeNumber === 2860) return 'Payables and prepayments';
        // Government grants (2880)
        if (codeNumber === 2880) return 'Government grants';
        // Issued capital (2910)
        if (codeNumber === 2910) return 'Issued capital';
        // Share capital (2912)
        if (codeNumber === 2912) return 'Share capital';
        // Unregistered equity (2920-2922)
        if (codeNumber >= 2920 && codeNumber <= 2922) return 'Unregistered equity';
        // Share premium (2930)
        if (codeNumber === 2930) return 'Share premium';
        // Reacquired shares (2940-2942)
        if (codeNumber >= 2940 && codeNumber <= 2942) return 'Reacquired shares';
        // Statutory reserve capital (2950)
        if (codeNumber === 2950) return 'Statutory reserve capital';
        // Other reserves (2960-2962)
        if (codeNumber >= 2960 && codeNumber <= 2962) return 'Other reserves';
        // Retained earnings (deficit) (2970)
        if (codeNumber === 2970) return 'Retained earnings (deficit)';
        // Profit (loss) for the year (2980)
        if (codeNumber === 2980) return 'Profit (loss) for the year';
        return 'Other payables';
      case 'Revenue':
        // Revenue (3000-3099)
        if (codeNumber >= 3000 && codeNumber <= 3099) return 'Revenue';
        // Other income (3510-3590)
        if (codeNumber >= 3510 && codeNumber <= 3590) return 'Other income';
        // Gain (loss) on biological assets (3900)
        if (codeNumber === 3900) return 'Gain (loss) on biological assets';
        // Increase/decrease in inventories (3910)
        if (codeNumber === 3910) return 'Increase/decrease in inventories of finished goods and work in progress';
        // Capital expenditure (3920)
        if (codeNumber === 3920) return 'Capital expenditure on items of property, plant and equipment for the entity\'s own use';
        // Profit (loss) from subsidiaries (6000)
        if (codeNumber === 6000) return 'Profit (loss) from subsidiaries';
        // Profit (loss) from financial investments (6010)
        if (codeNumber === 6010) return 'Profit (loss) from financial investments';
        // Other financial income and expense (6040-6050)
        if (codeNumber >= 6040 && codeNumber <= 6050) return 'Other financial income and expense';
        return 'Revenue';
      case 'Expense':
        // Raw materials and consumables used (4000-4050)
        if (codeNumber >= 4000 && codeNumber <= 4050) return 'Raw materials and consumables used';
        // Other operating expenses (4200-4680)
        if (codeNumber >= 4200 && codeNumber <= 4680) return 'Other operating expenses';
        // Wage and salary expense (4710-4790)
        if (codeNumber >= 4710 && codeNumber <= 4790) return 'Wage and salary expense';
        // Social security taxes (4720-4791)
        if ((codeNumber >= 4720 && codeNumber <= 4729) || codeNumber === 4791) return 'Social security taxes';
        // Depreciation and impairment loss (4810-4830)
        if (codeNumber >= 4810 && codeNumber <= 4830) return 'Depreciation and impairment loss (reversal)';
        // Other expense (4900-4990)
        if (codeNumber >= 4900 && codeNumber <= 4990) return 'Other expense';
        // Interest expenses (6060-6065)
        if (codeNumber >= 6060 && codeNumber <= 6065) return 'Interest expenses';
        // Income tax expense (7000)
        if (codeNumber === 7000) return 'Income tax expense';
        return 'Other operating expenses';
      default:
        return 'Other receivables';
    }
  }

  static getAccountSubcategory(code: string, type: AccountType): AccountSubcategory | undefined {
    // Auto-assign IFRS subcategory based on account code and type
    const codeNumber = parseInt(code);
    
    switch (type) {
      case 'Assets':
        // Current Assets (1000-1350)
        if (codeNumber >= 1000 && codeNumber <= 1350) return 'Current Assets';
        // Investments (1600-1640)
        if (codeNumber >= 1600 && codeNumber <= 1640) return 'Investments in Associates';
        // Investment Property (1700-1710)
        if (codeNumber >= 1700 && codeNumber <= 1710) return 'Investment Property';
        // Property, Plant and Equipment (1800-1890)
        if (codeNumber >= 1800 && codeNumber <= 1890) return 'Property, Plant and Equipment';
        // Goodwill (1900-1901)
        if (codeNumber >= 1900 && codeNumber <= 1901) return 'Goodwill';
        // Intangible Assets (1910-1980)
        if (codeNumber >= 1910 && codeNumber <= 1980) return 'Intangible Assets';
        return 'Non-Current Assets';
        
      case 'Liability':
        // Current Liabilities (2010-2700)
        if (codeNumber >= 2010 && codeNumber <= 2700) return 'Current Liabilities';
        // Non-Current Liabilities (2810-2880)
        if (codeNumber >= 2810 && codeNumber <= 2880) return 'Non-Current Liabilities';
        // Share Capital (2910-2912)
        if (codeNumber >= 2910 && codeNumber <= 2912) return 'Share Capital';
        // Other Reserves (2920-2962)
        if (codeNumber >= 2920 && codeNumber <= 2962) return 'Other Reserves';
        // Retained Earnings (2970-2980)
        if (codeNumber >= 2970 && codeNumber <= 2980) return 'Retained Earnings';
        return 'Current Liabilities';
        
      case 'Revenue':
        // Revenue from Contracts (3000-3099)
        if (codeNumber >= 3000 && codeNumber <= 3099) return 'Revenue from Contracts with Customers';
        // Other Operating Revenue (3510-3590)
        if (codeNumber >= 3510 && codeNumber <= 3590) return 'Other Operating Revenue';
        // Investment Income (6000-6050)
        if (codeNumber >= 6000 && codeNumber <= 6050) return 'Investment Income';
        return 'Other Operating Revenue';
        
      case 'Expense':
        // Cost of Sales (4000-4050)
        if (codeNumber >= 4000 && codeNumber <= 4050) return 'Cost of Sales';
        // Administrative Expenses (4200-4680)
        if (codeNumber >= 4200 && codeNumber <= 4680) return 'Administrative Expenses';
        // Distribution Costs (4710-4791)
        if (codeNumber >= 4710 && codeNumber <= 4791) return 'Distribution Costs';
        // Other Operating Expenses (4810-4990)
        if (codeNumber >= 4810 && codeNumber <= 4990) return 'Other Operating Expenses';
        // Finance Costs (6060-6065)
        if (codeNumber >= 6060 && codeNumber <= 6065) return 'Finance Costs';
        // Income Tax Expense (7000)
        if (codeNumber === 7000) return 'Income Tax Expense';
        return 'Other Operating Expenses';
        
      default:
        return undefined;
    }
  }

  static getIFRSReference(code: string, type: AccountType): string | undefined {
    // Auto-assign IFRS standard reference based on account type and code
    const codeNumber = parseInt(code);
    
    switch (type) {
      case 'Assets':
        // Cash and cash equivalents
        if (codeNumber >= 1000 && codeNumber <= 1080) return 'IAS 7';
        // Inventories
        if (codeNumber >= 1310 && codeNumber <= 1350) return 'IAS 2';
        // Property, Plant and Equipment
        if (codeNumber >= 1800 && codeNumber <= 1890) return 'IAS 16';
        // Investment Property
        if (codeNumber >= 1700 && codeNumber <= 1710) return 'IAS 40';
        // Intangible Assets
        if (codeNumber >= 1910 && codeNumber <= 1980) return 'IAS 38';
        // Goodwill
        if (codeNumber >= 1900 && codeNumber <= 1901) return 'IFRS 3';
        // Financial Assets
        if (codeNumber >= 1100 && codeNumber <= 1640) return 'IFRS 9';
        // Biological Assets
        if (codeNumber === 1400 || codeNumber === 1890) return 'IAS 41';
        return undefined;
        
      case 'Liability':
        // Financial Liabilities
        if (codeNumber >= 2010 && codeNumber <= 2030 || codeNumber >= 2810 && codeNumber <= 2830) return 'IFRS 9';
        // Employee Benefits
        if (codeNumber >= 2210 && codeNumber <= 2280) return 'IAS 19';
        // Provisions
        if (codeNumber === 2700 || codeNumber === 2870) return 'IAS 37';
        // Income Taxes
        if (codeNumber >= 2305 && codeNumber <= 2390) return 'IAS 12';
        // Share-based Payments (equity accounts)
        if (codeNumber >= 2910 && codeNumber <= 2980) return 'IAS 1';
        return undefined;
        
      case 'Revenue':
        // Revenue from Contracts with Customers
        if (codeNumber >= 3000 && codeNumber <= 3099) return 'IFRS 15';
        // Financial Income
        if (codeNumber >= 6000 && codeNumber <= 6050) return 'IFRS 9';
        return undefined;
        
      case 'Expense':
        // Employee Benefits
        if (codeNumber >= 4710 && codeNumber <= 4791) return 'IAS 19';
        // Depreciation
        if (codeNumber >= 4810 && codeNumber <= 4830) return 'IAS 16';
        // Finance Costs
        if (codeNumber >= 6060 && codeNumber <= 6065) return 'IAS 23';
        // Income Tax
        if (codeNumber === 7000) return 'IAS 12';
        return undefined;
        
      default:
        return undefined;
    }
  }
}