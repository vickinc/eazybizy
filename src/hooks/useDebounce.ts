import { useState, useEffect } from 'react'

/**
 * Hook that returns a debounced value. The debounced value will only reflect the latest value
 * when the hook hasn't been called for the specified delay period.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set debouncedValue to value (passed in) after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cancel the timeout if value changes (also on delay change or unmount)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for debounced search with loading state
 */
export function useDebouncedSearch(initialValue = '', delay = 300) {
  const [searchValue, setSearchValue] = useState(initialValue)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearchValue = useDebounce(searchValue, delay)

  useEffect(() => {
    if (searchValue !== debouncedSearchValue) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [searchValue, debouncedSearchValue])

  return {
    searchValue,
    debouncedSearchValue,
    isSearching,
    setSearchValue,
  }
}