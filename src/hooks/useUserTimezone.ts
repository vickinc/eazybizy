import { useState, useEffect } from 'react';
import { detectUserTimezone, getTimezoneInfo } from '@/lib/timezone';

interface UserTimezone {
  timezoneId: string;
  displayName: string;
  loading: boolean;
  error: string | null;
}

export const useUserTimezone = (): UserTimezone => {
  const [timezoneId, setTimezoneId] = useState<string>(detectUserTimezone());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserTimezone = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/user/timezone');
        if (response.ok) {
          const data = await response.json();
          if (data.timezoneId) {
            setTimezoneId(data.timezoneId);
          }
        } else {
          // If API fails, fallback to device timezone
          console.warn('Failed to fetch user timezone, using device timezone');
          setTimezoneId(detectUserTimezone());
        }
      } catch (err) {
        console.error('Error fetching user timezone:', err);
        setError('Failed to load timezone');
        // Fallback to device timezone
        setTimezoneId(detectUserTimezone());
      } finally {
        setLoading(false);
      }
    };

    fetchUserTimezone();
  }, []);

  const timezoneInfo = getTimezoneInfo(timezoneId);
  
  return {
    timezoneId,
    displayName: timezoneInfo?.displayName || timezoneId,
    loading,
    error
  };
};