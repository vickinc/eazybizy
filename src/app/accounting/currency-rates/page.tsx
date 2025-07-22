import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import { CurrencyRatesSSRService } from '@/services/database/currencyRatesSSRService';
import { CurrencyRatesClient } from './CurrencyRatesClient';

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function CurrencyRatesPage() {
  // Server-side authentication check only
  const { user, error } = await authenticateRequest();
  
  if (!user || error) {
    // Redirect to login if not authenticated
    redirect('/auth/login');
  }

  // Check API configuration on server
  const isAPIConfigured = process.env.FREE_CURRENCY_API_KEY ? true : false;

  // Fetch currency rates data on the server
  const initialData = await CurrencyRatesSSRService.getEnhancedRatesForSSR(
    user.id,
    undefined // No company ID for now
  );

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CurrencyRatesClient 
          initialData={initialData} 
          isAPIConfigured={isAPIConfigured}
        />
      </div>
    </div>
  );
} 