import { useReducer, useCallback, useMemo } from 'react'
import { Company } from '@/types/company.types'

// Define all UI state in one place
export interface CompanyUIState {
  // Dialog States
  isDialogOpen: boolean
  editingCompany: Company | null
  
  // View States
  viewMode: 'grid' | 'list'
  showFilters: boolean
  isFilterPanelExpanded: boolean
  
  // Loading States
  copiedFields: { [key: string]: boolean }
  
  // Selection States
  selectedCompanies: string[]
  
  // Search State (for immediate UI feedback)
  searchInputValue: string
  
  // Form States
  isFormDirty: boolean
  validationErrors: { [key: string]: string }
}

// Define all possible actions
export type CompanyUIAction =
  | { type: 'OPEN_DIALOG'; payload?: { company?: Company } }
  | { type: 'CLOSE_DIALOG' }
  | { type: 'SET_EDITING_COMPANY'; payload: Company | null }
  | { type: 'SET_VIEW_MODE'; payload: 'grid' | 'list' }
  | { type: 'TOGGLE_FILTERS' }
  | { type: 'SET_SHOW_FILTERS'; payload: boolean }
  | { type: 'TOGGLE_FILTER_PANEL' }
  | { type: 'SET_COPIED_FIELD'; payload: { key: string; value: boolean } }
  | { type: 'CLEAR_COPIED_FIELDS' }
  | { type: 'SET_SELECTED_COMPANIES'; payload: string[] }
  | { type: 'TOGGLE_COMPANY_SELECTION'; payload: string }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_SEARCH_INPUT'; payload: string }
  | { type: 'SET_FORM_DIRTY'; payload: boolean }
  | { type: 'SET_VALIDATION_ERROR'; payload: { field: string; error: string } }
  | { type: 'CLEAR_VALIDATION_ERRORS' }
  | { type: 'RESET_UI_STATE' }

const initialState: CompanyUIState = {
  // Dialog States
  isDialogOpen: false,
  editingCompany: null,
  
  // View States
  viewMode: 'grid',
  showFilters: false,
  isFilterPanelExpanded: false,
  
  // Loading States
  copiedFields: {},
  
  // Selection States
  selectedCompanies: [],
  
  // Search State
  searchInputValue: '',
  
  // Form States
  isFormDirty: false,
  validationErrors: {},
}

// Reducer function to handle state updates efficiently
function companyUIReducer(state: CompanyUIState, action: CompanyUIAction): CompanyUIState {
  switch (action.type) {
    case 'OPEN_DIALOG':
      return {
        ...state,
        isDialogOpen: true,
        editingCompany: action.payload?.company || null,
        isFormDirty: false,
        validationErrors: {},
      }
    
    case 'CLOSE_DIALOG':
      return {
        ...state,
        isDialogOpen: false,
        editingCompany: null,
        isFormDirty: false,
        validationErrors: {},
      }
    
    case 'SET_EDITING_COMPANY':
      return {
        ...state,
        editingCompany: action.payload,
      }
    
    case 'SET_VIEW_MODE':
      return {
        ...state,
        viewMode: action.payload,
      }
    
    case 'TOGGLE_FILTERS':
      return {
        ...state,
        showFilters: !state.showFilters,
      }
    
    case 'SET_SHOW_FILTERS':
      return {
        ...state,
        showFilters: action.payload,
      }
    
    case 'TOGGLE_FILTER_PANEL':
      return {
        ...state,
        isFilterPanelExpanded: !state.isFilterPanelExpanded,
      }
    
    case 'SET_COPIED_FIELD':
      return {
        ...state,
        copiedFields: {
          ...state.copiedFields,
          [action.payload.key]: action.payload.value,
        },
      }
    
    case 'CLEAR_COPIED_FIELDS':
      return {
        ...state,
        copiedFields: {},
      }
    
    case 'SET_SELECTED_COMPANIES':
      return {
        ...state,
        selectedCompanies: action.payload,
      }
    
    case 'TOGGLE_COMPANY_SELECTION':
      const companyId = action.payload
      const isSelected = state.selectedCompanies.includes(companyId)
      return {
        ...state,
        selectedCompanies: isSelected
          ? state.selectedCompanies.filter(id => id !== companyId)
          : [...state.selectedCompanies, companyId],
      }
    
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedCompanies: [],
      }
    
    case 'SET_SEARCH_INPUT':
      return {
        ...state,
        searchInputValue: action.payload,
      }
    
    case 'SET_FORM_DIRTY':
      return {
        ...state,
        isFormDirty: action.payload,
      }
    
    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          [action.payload.field]: action.payload.error,
        },
      }
    
    case 'CLEAR_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: {},
      }
    
    case 'RESET_UI_STATE':
      return initialState
    
    default:
      return state
  }
}

export interface CompanyUIStateHook {
  // State
  state: CompanyUIState
  
  // Dialog Actions
  openDialog: (company?: Company) => void
  closeDialog: () => void
  setEditingCompany: (company: Company | null) => void
  
  // View Actions
  setViewMode: (mode: 'grid' | 'list') => void
  toggleFilters: () => void
  setShowFilters: (show: boolean) => void
  toggleFilterPanel: () => void
  
  // Selection Actions
  setSelectedCompanies: (companies: string[]) => void
  toggleCompanySelection: (companyId: string) => void
  clearSelection: () => void
  
  // Copy Actions
  setCopiedField: (key: string, value: boolean) => void
  clearCopiedFields: () => void
  
  // Search Actions
  setSearchInput: (value: string) => void
  
  // Form Actions
  setFormDirty: (dirty: boolean) => void
  setValidationError: (field: string, error: string) => void
  clearValidationErrors: () => void
  
  // Utility Actions
  resetUIState: () => void
  
  // Derived State
  hasSelection: boolean
  selectionCount: number
  hasValidationErrors: boolean
}

export function useCompanyUIState(): CompanyUIStateHook {
  const [state, dispatch] = useReducer(companyUIReducer, initialState)
  
  // Memoized action creators to prevent unnecessary re-renders
  const actions = useMemo(() => ({
    openDialog: (company?: Company) => 
      dispatch({ type: 'OPEN_DIALOG', payload: { company } }),
    
    closeDialog: () => 
      dispatch({ type: 'CLOSE_DIALOG' }),
    
    setEditingCompany: (company: Company | null) => 
      dispatch({ type: 'SET_EDITING_COMPANY', payload: company }),
    
    setViewMode: (mode: 'grid' | 'list') => 
      dispatch({ type: 'SET_VIEW_MODE', payload: mode }),
    
    toggleFilters: () => 
      dispatch({ type: 'TOGGLE_FILTERS' }),
    
    setShowFilters: (show: boolean) => 
      dispatch({ type: 'SET_SHOW_FILTERS', payload: show }),
    
    toggleFilterPanel: () => 
      dispatch({ type: 'TOGGLE_FILTER_PANEL' }),
    
    setSelectedCompanies: (companies: string[]) => 
      dispatch({ type: 'SET_SELECTED_COMPANIES', payload: companies }),
    
    toggleCompanySelection: (companyId: string) => 
      dispatch({ type: 'TOGGLE_COMPANY_SELECTION', payload: companyId }),
    
    clearSelection: () => 
      dispatch({ type: 'CLEAR_SELECTION' }),
    
    setCopiedField: (key: string, value: boolean) => 
      dispatch({ type: 'SET_COPIED_FIELD', payload: { key, value } }),
    
    clearCopiedFields: () => 
      dispatch({ type: 'CLEAR_COPIED_FIELDS' }),
    
    setSearchInput: (value: string) => 
      dispatch({ type: 'SET_SEARCH_INPUT', payload: value }),
    
    setFormDirty: (dirty: boolean) => 
      dispatch({ type: 'SET_FORM_DIRTY', payload: dirty }),
    
    setValidationError: (field: string, error: string) => 
      dispatch({ type: 'SET_VALIDATION_ERROR', payload: { field, error } }),
    
    clearValidationErrors: () => 
      dispatch({ type: 'CLEAR_VALIDATION_ERRORS' }),
    
    resetUIState: () => 
      dispatch({ type: 'RESET_UI_STATE' }),
  }), [])
  
  // Memoized derived state to prevent unnecessary re-computations
  const derivedState = useMemo(() => ({
    hasSelection: state.selectedCompanies.length > 0,
    selectionCount: state.selectedCompanies.length,
    hasValidationErrors: Object.keys(state.validationErrors).length > 0,
  }), [state.selectedCompanies, state.validationErrors])
  
  return {
    state,
    ...actions,
    ...derivedState,
  }
}