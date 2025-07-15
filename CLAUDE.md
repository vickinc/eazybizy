# Claude Code Architecture Rules

## Core Principles

### 1. Separation of Concerns
- **Components**: Handle UI presentation and user interactions only
- **Services**: Manage business logic, API calls, and data transformations
- **Hooks/Composables**: Encapsulate stateful logic and side effects
- **Storage**: Manage state by scope (local, shared, server, persistent)

### 2. Dependency Direction
- Components depend on services and hooks, never the reverse
- Services should not directly manipulate UI state
- Higher-level modules should not depend on lower-level implementation details

## Project Structure

### Required Folder Structure
```
src/
├── components/
│   ├── ui/              # Reusable UI components (Button, Input, Modal)
│   ├── features/        # Feature-specific components (UserProfile, ProductList)
│   └── layout/          # Layout components (Header, Sidebar, Footer)
├── services/
│   ├── api/            # API client and endpoints
│   ├── business/       # Business logic and rules
│   └── integrations/   # Third-party service integrations
├── hooks/              # Custom hooks (React) or composables (Vue)
├── stores/             # State management (Context, Zustand, Pinia, etc.)
├── utils/              # Pure utility functions
├── types/              # TypeScript type definitions
├── constants/          # Application constants
└── config/             # Environment and app configuration
```

## Component Rules

### DO
- Keep components focused on a single UI responsibility
- Use props for data input and callbacks for events
- Prefer functional/stateless components when possible
- Implement proper error boundaries
- Use semantic HTML and accessibility attributes

### DON'T
- Put business logic directly in components
- Make direct API calls from components
- Hard-code external dependencies
- Mix presentation logic with data fetching logic

### Component Template
```typescript
// components/features/UserProfile.tsx
interface UserProfileProps {
  userId: string;
  onUserUpdate?: (user: User) => void;
}

export const UserProfile: FC<UserProfileProps> = ({ userId, onUserUpdate }) => {
  const { user, loading, error } = useUser(userId);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="user-profile">
      {/* UI only */}
    </div>
  );
};
```

## Service Rules

### API Services
- Centralize all HTTP requests
- Handle request/response transformations
- Implement proper error handling
- Use consistent naming conventions
- **Dependency Injection**: Prefer instantiable service classes over static methods to improve testability. Provide service instances via React Context or a dedicated DI container.

```typescript
// services/api/userService.ts
export class UserService {
  private baseUrl = '/api/users';

  // The constructor can be expanded to accept configuration or other dependencies.
  constructor() {}

  async getUser(id: string): Promise<User> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) throw new ApiError(response);
    return response.json();
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    // Implementation
  }
}
```

### Business Services
- Keep business logic separate from API logic
- Make functions pure when possible
- Handle validation and business rules

```typescript
// services/business/userBusinessService.ts
export class UserBusinessService {
  static validateUserData(userInput: UserInput): ValidationResult {
    // Business validation logic
  }
  
  static calculateUserScore(user: User): number {
    // Business calculation logic
  }
}
```

## Hook/Composable Rules

### DO
- Encapsulate related stateful logic
- Handle side effects properly
- Provide clear return interfaces
- Use descriptive naming (useUser, useAuth, useForm)

### DON'T
- Mix unrelated concerns in one hook
- Directly manipulate DOM
- Handle business logic (delegate to services)

### Hook Template
```typescript
// hooks/useUser.ts
export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    UserService.getUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);
  
  const updateUser = useCallback(async (data: UpdateUserRequest) => {
    try {
      const updatedUser = await UserService.updateUser(userId, data);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [userId]);
  
  return { user, loading, error, updateUser };
};
```

## State Management Rules

### Local State
- Use for component-specific state only
- Prefer useState for simple state
- Use useReducer for complex state logic

### Shared State
- Use Context for infrequent updates
- Use external libraries (Zustand, Jotai) for frequent updates
- Keep state normalized and flat

### Server State
- Use specialized libraries (React Query, SWR, Apollo)
- Implement proper caching strategies
- Handle loading and error states consistently

### Persistent Storage
- Wrap browser storage APIs in services
- Handle storage errors gracefully
- Implement data migration strategies

## Error Handling Rules

### Error Boundaries
- Implement at feature level
- Provide fallback UI
- Log errors appropriately

### Service Errors
- Use custom error classes
- Provide meaningful error messages
- Implement retry logic where appropriate

### Network Errors
- Handle offline scenarios
- Implement timeout handling
- Provide user-friendly error messages

## Testing Rules

### Unit Tests
- Test services in isolation
- Test business logic thoroughly
- Mock external dependencies

### Integration Tests
- Test hook behavior
- Test service integration
- Test error scenarios

### Component Tests
- Test user interactions
- Test accessibility
- Test error states

### Recommended Libraries
- **Unit/Integration**: Vitest or Jest
- **Component**: React Testing Library
- **E2E**: Playwright or Cypress

## File Naming Conventions

### General Naming Conventions
- Avoid using the project name in file or folder names. For example, if the project is named "MyApp", avoid names like `MyAppButton.tsx` or `myapp-utils.ts`.

### Components
- PascalCase: `UserProfile.tsx`
- Include component type: `UserProfileCard.tsx`

### Services
- camelCase with Service suffix: `userService.ts`
- Group by domain: `api/userService.ts`

### Hooks
- camelCase with use prefix: `useUser.ts`
- Descriptive names: `useUserAuthentication.ts`

### Types
- PascalCase: `User.ts`
- Interface prefix: `IUserRepository.ts` (if needed)

### Test Files
- Suffix with `.test.ts(x)` or `.spec.ts(x)`.
- Co-locate with the file being tested (e.g., `userService.ts` and `userService.test.ts`).

## Import/Export Rules

### Barrel Exports
- Use index files for clean imports
- Export types and implementations separately
- Avoid circular dependencies

```typescript
// services/index.ts
export * from './api';
export * from './business';
export * from './integrations';
```

### Import Order
1. External libraries
2. Internal services
3. Internal hooks
4. Internal components
5. Internal types
6. Relative imports

## Performance Rules

### Components
- Use React.memo for expensive renders
- Implement proper key props for lists
- Avoid inline object/function creation

### Services
- Implement request deduplication
- Use appropriate caching strategies
- Handle pagination for large datasets

### State
- Normalize state structure
- Avoid unnecessary re-renders
- Use selectors for derived state

## Security Rules

### API Services
- Validate all inputs
- Handle authentication tokens securely
- Implement proper CORS handling

### Frontend Security
- **XSS Prevention**: Sanitize all user-generated content rendered to the DOM using a library like `DOMPurify`.
- **Secrets**: Never expose secret API keys or other sensitive credentials in client-side code. Use environment variables and backend proxies.

### Storage
- Encrypt sensitive data
- Validate stored data on read
- Implement proper cleanup

## Documentation Rules

### Components
- Document props interface
- Provide usage examples
- Document accessibility features

### Services
- Document API contracts
- Provide error handling examples
- Document business rules

### Hooks
- Document return interface
- Provide usage examples
- Document side effects

## Code Review Checklist

- [ ] Proper separation of concerns maintained
- [ ] No business logic in components
- [ ] Services handle errors appropriately
- [ ] Hooks have clear responsibilities
- [ ] State is managed at appropriate level
- [ ] Tests cover critical paths
- [ ] Documentation is up to date
- [ ] Performance considerations addressed
- [ ] Security best practices followed
- [ ] Accessibility requirements met

## Migration Guidelines

When refactoring existing code:

1. **Identify mixed concerns** - Look for components doing too much
2. **Extract services** - Move business logic to service layer
3. **Create custom hooks** - Extract stateful logic from components
4. **Normalize state** - Restructure state management
5. **Update tests** - Ensure tests still pass after refactoring
6. **Update documentation** - Keep docs in sync with changes

## Common Anti-Patterns to Avoid

- **God Components**: Components that handle too many responsibilities
- **Service Locator**: Directly accessing global service instances
- **Prop Drilling**: Passing props through multiple component levels
- **Mixed Concerns**: Business logic mixed with presentation logic
- **Tight Coupling**: Components directly dependent on specific services
- **Global State Abuse**: Using global state for local component state

## Internationalization (i18n)

- **Library**: Standardize on a library like `next-intl` or `react-i18next` for handling translations.
- **File Structure**: Store translation files in a dedicated `/src/i18n` or `/src/locales` directory.
- **Keys**: Use structured, semantic keys for translation strings (e.g., `common.buttons.save` instead of `save_button_text`).
- **Component Usage**: Abstract translation logic into a `useTranslation` hook for use in components.

## Environment Variables

- **Prefixing**: Variables exposed to the browser must be prefixed with `NEXT_PUBLIC_` (for Next.js projects).
- **Security**: Never commit `.env.local` or other files containing secrets to version control. Use `.gitignore` to exclude them.
- **Documentation**: Maintain a `.env.example` file in the root of the project, listing all required environment variables with placeholder or non-sensitive default values.

## Page Layout and Spacing Rules

### Standard Page Container Pattern

**All pages MUST use the standardized container pattern for consistent spacing across the application:**

```tsx
// Standard page layout template
export default function PageName() {
  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Page Title</h1>
              <p className="text-sm sm:text-base text-gray-600">Page description</p>
            </div>
          </div>
        </div>
        
        {/* Page content */}
        {/* ... */}
        
      </div>
    </div>
  );
}
```

### Container Rules

- **Outer wrapper**: Always use `min-h-screen bg-lime-50` for full-height lime background
- **Inner container**: Always use `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8` for consistent spacing
  - `max-w-7xl`: Maximum width constraint (1280px)
  - `mx-auto`: Center the content horizontally
  - `px-4 sm:px-6 lg:px-8`: Responsive horizontal padding (16px → 24px → 32px)
  - `py-8`: Vertical padding (32px top and bottom)

### What NOT to Use

**❌ Avoid these patterns:**
- `p-6`, `p-8` - Direct padding on wrapper
- `container mx-auto` - Use `max-w-7xl mx-auto` instead
- `px-6 py-8` - Use responsive padding instead
- Custom spacing patterns - Stick to the standard

### Benefits

- **Visual Consistency**: All pages have identical side margins and spacing
- **Responsive Design**: Content adapts properly on all screen sizes
- **Maintainability**: Single standard pattern for all developers to follow
- **Professional Look**: Consistent max-width prevents content from stretching too wide on large screens

### Page Header Pattern

**Standard page header structure:**
```tsx
<div className="mb-8">
  <div className="flex items-center space-x-3">
    <div className="p-2 bg-[COLOR]-100 rounded-lg">
      <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-[COLOR]-600" />
    </div>
    <div>
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Page Title</h1>
      <p className="text-sm sm:text-base text-gray-600">Page description</p>
    </div>
  </div>
</div>
```

### Code Review Requirements

- [ ] Page uses standard `min-h-screen bg-lime-50` wrapper
- [ ] Page uses standard `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8` container
- [ ] Page includes proper page header with icon and title
- [ ] No custom spacing patterns that deviate from standard
- [ ] Responsive design works correctly on all screen sizes

## Button Loading State Rules

### Smooth User Experience
- **Immediate visual feedback** when button is clicked
- **Consistent styling** with existing component theme
- **Graceful error handling** with automatic loading state reset

### How It Works
1. User clicks button → Loading state becomes true
2. Loading UI appears → Spinner + "Loading..." text
3. Button becomes disabled → Prevents multiple clicks
4. Operation executes → Navigation/API call/etc.
5. Loading state clears → When operation completes or component unmounts

### Visual Elements
- **Spinner**: Theme-colored rotating border animation matching component colors
- **Layout**: Flexbox with spinner and text side-by-side
- **Spacing**: Consistent 8px gap between spinner and text (`space-x-2`)
- **Accessibility**: Button properly disabled during loading

### Implementation Pattern
```tsx
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    await performOperation();
  } catch (error) {
    console.error('Operation error:', error);
    setIsLoading(false); // Reset on error
  }
};

// In JSX
<Button onClick={handleAction} disabled={isLoading}>
  {isLoading ? (
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      <span>Loading...</span>
    </div>
  ) : (
    "Button Text"
  )}
</Button>
```

---

*These rules should be followed consistently across all projects to maintain code quality, readability, and maintainability.*