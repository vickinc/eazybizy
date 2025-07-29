# Company Filter Navigation Persistence Test

## Test Scenario
This describes how to manually test that the company filter selection persists across page navigation.

## Before the Fix (Old Behavior)
1. User visits `/companies` page  
2. Selects "TechStart" from global company filter
3. Navigates to `/accounting/bookkeeping`
4. **❌ Company filter resets to "All Companies"**

## After the Fix (Expected Behavior)
1. User visits `/companies` page
2. Selects "TechStart" from global company filter  
3. URL updates to `/companies?companyId=1`
4. Selection saves to localStorage
5. User navigates to `/accounting/bookkeeping`
6. **✅ Company filter remains "TechStart"**
7. URL becomes `/accounting/bookkeeping` (no companyId param needed)
8. If user refreshes page, still shows "TechStart" from localStorage

## Technical Details

### Priority Order
1. **URL Parameter** (highest priority) - for direct links
2. **localStorage** (fallback) - for navigation persistence  
3. **"all"** (default) - when nothing is saved

### LocalStorage Key
- Key: `selectedCompanyId`
- Values: `"all"`, `"1"`, `"2"`, etc.

### URL Synchronization
- When user selects company: URL gets `?companyId=X` parameter
- When navigating to new page: URL parameter is removed but localStorage persists selection
- When visiting direct link with `?companyId=X`: URL takes precedence, localStorage gets updated

## Benefits
- ✅ Company selection persists across navigation
- ✅ Direct links with `?companyId=X` still work  
- ✅ URL sharing works correctly
- ✅ Browser refresh maintains selection
- ✅ No unwanted page reloads
- ✅ Clean URLs on navigation (no unnecessary parameters)