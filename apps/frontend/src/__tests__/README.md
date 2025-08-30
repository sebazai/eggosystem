# Frontend Test Utilities

This directory contains reusable test utilities for the frontend application.

## test-utils.tsx

Provides common mocking patterns and helper functions for testing React components that use SWR and fetch APIs.

### Usage

```typescript
import { renderWithSWR, setupFetchMock, clearAllMocks } from '@/__tests__/utils/test-utils';

describe('MyComponent', () => {
  beforeEach(() => {
    clearAllMocks();
    setupFetchMock();
  });

  it('renders correctly', () => {
    renderWithSWR(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Available Functions

#### `renderWithSWR(component, swrConfig?, renderOptions?)`

Wraps components with SWR configuration to prevent actual API calls during tests.

- **component**: React component to render
- **swrConfig**: Optional SWR configuration overrides
- **renderOptions**: Optional React Testing Library render options

#### `setupFetchMock()`

Sets up global fetch mock with default successful responses. Call in `beforeEach`.

#### `clearAllMocks()`

Clears all Jest mocks and resets fetch mock. Call in `beforeEach` or `afterEach`.

#### `createSWRConfig(fallbackData)`

Creates custom SWR configuration with specific mock data.

```typescript
const config = createSWRConfig({
  '/api/v1/users': [{ id: 1, name: 'Test User' }]
});
renderWithSWR(<UsersList />, config);
```

### When to Use

Use these utilities when your components:

- Use SWR hooks that make API calls
- Make direct fetch calls
- Need to prevent network requests during testing
- Require consistent SWR configuration across tests

### Example

```typescript
import { renderWithSWR, clearAllMocks, setupFetchMock } from '@/__tests__/utils/test-utils';

describe('SignupForm', () => {
  beforeEach(() => {
    clearAllMocks();
    setupFetchMock();
  });

  it('renders without API errors', () => {
    renderWithSWR(<SignupForm />);
    // No fetch errors in console, component renders normally
  });
});
```

This prevents common test issues like:

- `ReferenceError: fetch is not defined`
- Console spam from failed API calls
- Tests depending on network availability
- Inconsistent test behavior
