# Frontend Testing Guide

## 📋 Overview

Testing infrastructure được thiết lập với **Vitest** và **React Testing Library** để đảm bảo chất lượng code và tránh regression bugs.

## 🛠️ Tech Stack

- **Vitest**: Fast unit test framework (thay thế Jest)
- **React Testing Library**: Testing React components
- **Testing Library User Event**: Simulate user interactions
- **MSW (Mock Service Worker)**: API mocking
- **@vitest/ui**: Visual test UI

## 🚀 Quick Start

### Chạy tests

```bash
# Watch mode (tự động chạy lại khi file thay đổi)
npm test

# Run once (CI mode)
npm run test:run

# With UI
npm run test:ui

# With coverage
npm run test:coverage
```

## 📁 File Structure

```
frontend/src/
├── test/
│   ├── setup.ts              # Test configuration
│   ├── test-utils.tsx        # Custom render with providers
│   └── mocks/
│       ├── handlers.ts       # MSW API handlers
│       └── server.ts         # MSW server setup
│
├── components/
│   └── __tests__/
│       └── AnimatedContent.test.tsx
│
├── modules/
│   └── shop/
│       └── components/
│           └── __tests__/
│               └── ProductCard.test.tsx
│
├── services/
│   └── __tests__/
│       └── products.test.ts
│
├── stores/
│   ├── slices/
│   │   └── __tests__/
│   │       └── cartSlice.test.ts
│   └── __tests__/
│       └── themeStore.test.ts
│
└── utils/
    └── __tests__/
        └── formatters.test.ts
```

## ✍️ Writing Tests

### Component Test Example

```tsx
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '@/test/test-utils';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles click event', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Service Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { myService } from '../myService';
import api from '../api';

vi.mock('../api');

describe('MyService', () => {
  it('fetches data successfully', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { id: 1 } });

    const result = await myService.getData();

    expect(api.get).toHaveBeenCalledWith('/data');
    expect(result).toEqual({ id: 1 });
  });
});
```

### Store/Hook Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyStore } from '../myStore';

describe('useMyStore', () => {
  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyStore());

    act(() => {
      result.current.setValue(42);
    });

    expect(result.current.value).toBe(42);
  });
});
```

## 🎯 Best Practices

### 1. Test Naming

```typescript
describe('Component/Function name', () => {
  it('should do something when condition', () => {
    // test implementation
  });
});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('adds item to cart', () => {
  // Arrange
  const item = { id: 1, name: 'Product' };

  // Act
  addToCart(item);

  // Assert
  expect(cart.items).toHaveLength(1);
});
```

### 3. Use Testing Library Queries

```typescript
// ✅ Good - Accessible queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText('Email')
screen.getByText('Welcome')

// ❌ Avoid - Implementation details
screen.getByClassName('btn-primary')
screen.getByTestId('submit-button')
```

### 4. Clean Up

```typescript
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

## 🔧 Configuration

### vitest.config.ts

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

## 📊 Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## 🔍 Debugging Tests

```bash
# Run specific test file
npm test products.test.ts

# Run tests matching pattern
npm test -- --grep "cart"

# Debug mode
npm test -- --inspect-brk
```

## 🐛 Common Issues

### Mock antd message

```typescript
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});
```

### Mock API calls

```typescript
import { server } from '@/test/mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🎓 Example Tests Created

1. **Component Tests**:
   - ✅ `ProductCard.test.tsx` - UI component with interactions
   - ✅ `AnimatedContent.test.tsx` - Animation wrapper

2. **Store Tests**:
   - ✅ `cartSlice.test.ts` - Redux slice logic
   - ✅ `themeStore.test.ts` - Zustand store

3. **Service Tests**:
   - ✅ `products.test.ts` - API service methods

4. **Utility Tests**:
   - ✅ `formatters.test.ts` - Helper functions

## 🚦 CI/CD Integration

GitHub Actions workflow đã được thiết lập tại `.github/workflows/frontend-test.yml`:

- ✅ Run tests on push/PR
- ✅ Type checking
- ✅ Linting
- ✅ Coverage report
- ✅ Build verification

## 📈 Next Steps

1. Viết tests cho các components còn lại
2. Tăng coverage lên > 80%
3. Add E2E tests với Playwright/Cypress
4. Setup visual regression testing
5. Add performance tests
