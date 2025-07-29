'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CategoryMode = 'simplified' | 'advanced';

interface CategoryModeContextType {
  mode: CategoryMode;
  setMode: (mode: CategoryMode) => void;
  isLoading: boolean;
}

const CategoryModeContext = createContext<CategoryModeContextType | undefined>(undefined);

const STORAGE_KEY = 'eazybizy_category_mode';
const DEFAULT_MODE: CategoryMode = 'simplified';

interface CategoryModeProviderProps {
  children: ReactNode;
}

export const CategoryModeProvider: React.FC<CategoryModeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<CategoryMode>(DEFAULT_MODE);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved mode from localStorage on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY) as CategoryMode;
      if (savedMode && (savedMode === 'simplified' || savedMode === 'advanced')) {
        setModeState(savedMode);
      }
    } catch (error) {
      console.warn('Failed to load category mode from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save mode to localStorage whenever it changes
  const setMode = (newMode: CategoryMode) => {
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
      setModeState(newMode);
    } catch (error) {
      console.error('Failed to save category mode to localStorage:', error);
      setModeState(newMode); // Still update state even if localStorage fails
    }
  };

  const value: CategoryModeContextType = {
    mode,
    setMode,
    isLoading,
  };

  return (
    <CategoryModeContext.Provider value={value}>
      {children}
    </CategoryModeContext.Provider>
  );
};

export const useCategoryMode = (): CategoryModeContextType => {
  const context = useContext(CategoryModeContext);
  if (context === undefined) {
    throw new Error('useCategoryMode must be used within a CategoryModeProvider');
  }
  return context;
};

// Helper hooks for common use cases
export const useIsAdvancedMode = (): boolean => {
  const { mode } = useCategoryMode();
  return mode === 'advanced';
};

export const useIsSimplifiedMode = (): boolean => {
  const { mode } = useCategoryMode();
  return mode === 'simplified';
};