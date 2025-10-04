# Testing Guide

## Overview
This project uses Jest and Supertest for unit and integration testing.

## Test Structure
```
backend/src/__tests__/
├── setup.ts                    # Test configuration and global setup
├── unit/                       # Unit tests for individual components
│   ├── errorHandler.test.ts
│   └── auth.middleware.test.ts
└── integration/                # Integration tests for API endpoints
    └── health.test.ts
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test -- errorHandler.test
```

### Run only unit tests
```bash
npm test -- unit
```

### Run only integration tests
```bash
npm test -- integration
```

## Writing Tests

### Unit Test Example
```typescript
import { myFunction } from '../../services/myService';

describe('MyService', () => {
  test('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Integration Test Example
```typescript
import request from 'supertest';
import app from '../../index';

describe('API Endpoint', () => {
  test('GET /api/v1/endpoint', async () => {
    const response = await request(app)
      .get('/api/v1/endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });
});
```

## Test Database Setup

For integration tests that require database:
1. Create a test database: `medical_test`
2. Run migrations on test database
3. Use `.env.test` configuration

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up after tests (use `afterEach`, `afterAll`)
3. **Mocking**: Mock external dependencies (database, APIs, etc.)
4. **Descriptive Names**: Use clear, descriptive test names
5. **Coverage**: Aim for >80% code coverage on critical paths

## CI/CD Integration

Add to your CI pipeline:
```yaml
- run: npm test -- --coverage --ci
```

## Common Issues

### Database Connection Errors
- Ensure test database exists
- Check `.env.test` configuration
- Verify database credentials

### Timeout Errors
- Increase timeout in `jest.config.js`
- Use `jest.setTimeout()` for specific tests

### Mock Not Working
- Clear mocks between tests: `jest.clearAllMocks()`
- Reset modules: `jest.resetModules()`
