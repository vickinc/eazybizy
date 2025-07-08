import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for delayed loading states.
 * Shows loading state only if the loading operation takes longer than the specified delay.
 * This prevents loading screen flashes when data is cached or loads quickly.
 * 
 * @param isLoading - Current loading state from data fetching hooks
 * @param delay - Delay in milliseconds before showing loader (default: 50ms)
 * @returns boolean indicating whether to show the loading screen
 */
export function useDelayedLoading(isLoading: boolean, delay: number = 50): boolean {
  const [showLoader, setShowLoader] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isLoading) {
      // Start timer when loading begins
      timeoutRef.current = setTimeout(() => {
        setShowLoader(true);
      }, delay);
    } else {
      // Clear timer and hide loader when loading ends
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setShowLoader(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, delay]);

  return showLoader;
}