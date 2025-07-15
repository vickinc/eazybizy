import { useState, useEffect, useCallback, useRef } from 'react'

export interface DebouncedSearchHook {
  // Immediate state for UI
  searchInput: string
  
  // Debounced value for API calls
  debouncedSearchTerm: string
  
  // Loading state
  isSearching: boolean
  
  // Actions
  setSearchInput: (value: string) => void
  clearSearch: () => void
  
  // Utilities
  hasActiveSearch: boolean
}

export function useDebouncedSearch(
  initialValue: string = '',
  delay: number = 250
): DebouncedSearchHook {
  const [searchInput, setSearchInput] = useState(initialValue)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue)
  const [isSearching, setIsSearching] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Update debounced value after delay
  useEffect(() => {
    // Set searching state when input changes
    if (searchInput !== debouncedSearchTerm) {
      setIsSearching(true)
    }
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchInput)
      setIsSearching(false)
    }, delay)
    
    // Cleanup on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [searchInput, delay, debouncedSearchTerm])
  
  // Clear search function
  const clearSearch = useCallback(() => {
    setSearchInput('')
    setDebouncedSearchTerm('')
    setIsSearching(false)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return {
    searchInput,
    debouncedSearchTerm,
    isSearching,
    setSearchInput,
    clearSearch,
    hasActiveSearch: debouncedSearchTerm.length > 0,
  }
}