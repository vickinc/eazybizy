export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  type: 'fiat' | 'crypto';
  lastUpdated: string;
}