export const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
  'MXN', 'SGD', 'HKD', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'ILS', 'CLP',
  'PHP', 'AED', 'COP', 'SAR', 'MYR', 'RON', 'THB', 'TRY', 'BRL', 'TWD',
  'ZAR', 'KRW', 'INR', 'RUB', 'BGN', 'HRK', 'IDR', 'ISK'
];

export const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Real Estate', 'Consulting', 'Legal', 'Marketing',
  'Construction', 'Transportation', 'Other'
];

export const CLIENT_STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'lead', label: 'Lead', color: 'bg-blue-100 text-blue-800' }
];

// It's good practice to define types for constants if they have a specific structure
export interface ClientStatus {
  value: 'active' | 'inactive' | 'lead';
  label: string;
  color: string;
}
