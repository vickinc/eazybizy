// Individual focused hooks for single responsibilities
export { useCompanyQuery } from '../useCompanyQuery'
export { useCompanyFilters } from '../useCompanyFilters'
export { useCompanyCrud } from '../useCompanyCrud'
export { useCompanyForm } from '../useCompanyForm'

// Composed hook that combines all functionality
export { useCompanyManagementComposed } from '../useCompanyManagement.composed'

// Legacy hook (deprecated - use composed hook instead)
export { useCompanyManagement } from '../useCompanyManagement'

// Type exports
export type { CompanyQueryHook } from '../useCompanyQuery'
export type { CompanyFiltersHook } from '../useCompanyFilters'
export type { CompanyCrudHook } from '../useCompanyCrud'
export type { CompanyFormHook } from '../useCompanyForm'
export type { ComposedCompanyManagementHook } from '../useCompanyManagement.composed'