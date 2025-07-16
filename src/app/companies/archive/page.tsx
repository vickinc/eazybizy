import { redirect } from 'next/navigation';
import { authenticateRequest } from '@/lib/api-auth';
import CompaniesArchiveClient from './CompaniesArchiveClient';

// Force dynamic rendering for private data
export const dynamic = 'force-dynamic';

export default async function CompaniesArchivePage() {
  // Server-side authentication check only
  const { user, error } = await authenticateRequest();
  
  if (!user || error) {
    // Redirect to login if not authenticated
    redirect('/auth/login');
  }

  // Render client component - all data fetching happens client-side
  return <CompaniesArchiveClient />;
}