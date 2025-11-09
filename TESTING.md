# Testing Guide

This directory contains all test-related files for the 10x-bp-tracker project.

## Directory Structure

```
src/test/              # Unit test setup and configuration
src/**/*.test.ts       # Unit tests (co-located with source files)
e2e/                   # E2E tests
e2e/fixtures/          # Playwright fixtures for test setup
e2e/page-objects/      # Page Object Model classes
e2e/**/*.spec.ts       # E2E test files
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests once
npm run test:unit

# Run unit tests in watch mode (for development)
npm run test:unit:watch

# Run with UI mode
npm run test:unit:ui

# Run with coverage report
npm run test:unit:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Generate tests with codegen
npm run test:e2e:codegen

# Show test report
npm run test:e2e:report
```

### Run All Tests

```bash
npm test
```

## Writing Tests

### Unit Tests

Unit tests use Vitest and React Testing Library. Place test files next to the code they test with `.test.ts` or `.test.tsx` extension.

Example:
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### E2E Tests

E2E tests use Playwright. Follow the Page Object Model pattern for maintainability.

Example:
```typescript
import { test, expect } from '../fixtures/test';
import { MyPage } from '../page-objects/MyPage';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    const myPage = new MyPage(page);
    await myPage.goto('/path');
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

## Best Practices

### Unit Tests
- Follow Arrange-Act-Assert pattern
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error conditions
- Keep tests focused and independent

### E2E Tests
- Use Page Object Model for maintainability
- Use data-testid attributes for stable selectors
- Test user flows, not implementation
- Keep tests independent and idempotent
- Use fixtures for common setup
- Leverage trace viewer for debugging

## Configuration

- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration
- `src/test/setup.ts` - Vitest setup file with global mocks

