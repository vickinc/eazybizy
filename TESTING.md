# Testing Setup for EazyBizy

This document outlines the testing approach and setup for the EazyBizy application, particularly focusing on the company management hooks.

## Test Coverage

### useCompanyQuery Hook Tests
Location: `src/hooks/__tests__/useCompanyQuery.test.ts`

**Pagination Logic Tests:**
- ✅ Initial pagination values
- ✅ Load more functionality with data accumulation
- ✅ Prevents loading when hasMore is false
- ✅ Resets pagination when filters change
- ✅ Resets pagination when sorting changes
- ✅ Manual pagination reset functionality

**Query Key Stability Tests:**
- ✅ Stable query keys for identical parameters
- ✅ Different query keys for different parameters
- ✅ Primitive values array approach for better cache stability

**Data Management Tests:**
- ✅ Company separation (active vs passive)
- ✅ Industry extraction
- ✅ Statistics handling
- ✅ Error handling
- ✅ Loading states

### useCompanyCrud Hook Tests
Location: `src/hooks/__tests__/useCompanyCrud.test.ts`

**Invalidation Timing Tests:**
- ✅ Post-create invalidation and refetch
- ✅ Post-update invalidation, refetch, and cache update
- ✅ Fresh data fetch error handling during update
- ✅ Post-delete invalidation and refetch
- ✅ Post-archive invalidation and refetch
- ✅ Post-unarchive invalidation and refetch
- ✅ Bulk operations invalidation and refetch

**Cache Management Tests:**
- ✅ Manual cache invalidation
- ✅ Manual cache refetch
- ✅ Error scenarios without cache corruption

**Mutation State Tests:**
- ✅ Loading state tracking for all operations
- ✅ Bulk operation state management

**Selection Management Tests:**
- ✅ Selected companies state management
- ✅ Selection clearing after bulk operations

## Required Dependencies

To run these tests, you need to install the following dependencies:

```bash
npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom
```

## Test Configuration

The project includes:

1. **Jest Configuration** (`jest.config.js`):
   - Integrates with Next.js using `next/jest`
   - Sets up path mapping for `@/` imports
   - Configures test environment as `jsdom`
   - Sets up coverage collection

2. **Jest Setup** (`jest.setup.js`):
   - Imports jest-dom matchers
   - Mocks browser APIs (IntersectionObserver, ResizeObserver, matchMedia)
   - Provides common test utilities

## Running Tests

Add the following script to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

Then run:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test useCompanyQuery.test.ts
```

## Key Testing Patterns

### 1. QueryClient Wrapper Pattern
```typescript
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
  
  return { wrapper, queryClient };
};
```

### 2. Invalidation Timing Verification
```typescript
it('should invalidate and refetch queries after successful create', async () => {
  const { wrapper, invalidateQueriesSpy, refetchQueriesSpy } = createWrapper();
  
  // ... test setup
  
  await act(async () => {
    await result.current.createCompany(mockData);
  });

  // Verify invalidation happened
  expect(invalidateQueriesSpy).toHaveBeenCalledWith({ 
    queryKey: ['companies'], 
    exact: false 
  });
});
```

### 3. Async State Management Testing
```typescript
it('should accumulate companies on load more', async () => {
  // Mock multiple API responses
  mockApiService.getCompanies
    .mockResolvedValueOnce(firstPageResponse)
    .mockResolvedValueOnce(secondPageResponse);

  // Test pagination logic
  await waitFor(() => {
    expect(result.current.companies).toHaveLength(2);
  });

  act(() => {
    result.current.loadMore();
  });

  await waitFor(() => {
    expect(result.current.companies).toHaveLength(3);
  });
});
```

## Benefits of This Testing Approach

1. **Comprehensive Coverage**: Tests cover both happy paths and edge cases
2. **Timing Verification**: Ensures cache invalidation happens at the right time
3. **State Management**: Verifies complex pagination and accumulation logic
4. **Error Handling**: Tests graceful degradation scenarios
5. **Performance**: Validates query key stability for optimal caching

## Best Practices

1. **Mock External Dependencies**: API services, toast notifications, browser APIs
2. **Test Timing**: Use `waitFor` for async operations, `act` for state updates
3. **Verify Side Effects**: Check cache invalidation, refetch calls, state updates
4. **Error Scenarios**: Test both success and failure paths
5. **Isolation**: Each test should be independent and clean up after itself

## Integration with CI/CD

These tests are designed to run in automated environments:

- No external dependencies (all mocked)
- Deterministic timing with proper async handling
- Clear assertions for pass/fail decisions
- Coverage reporting for code quality metrics

## Future Test Additions

Consider adding tests for:

1. **Integration Tests**: Testing hook combinations
2. **E2E Tests**: Full user workflow testing with Playwright
3. **Performance Tests**: Query optimization verification
4. **Accessibility Tests**: Screen reader compatibility
5. **Visual Regression Tests**: UI consistency validation