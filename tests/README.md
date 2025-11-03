# ACM Research Agents - E2E Testing

Comprehensive end-to-end testing suite using Playwright to ensure application stability and prevent regressions.

## 📋 Test Coverage

### Authentication Tests (`auth.spec.ts`)
- ✅ Sign in page rendering
- ✅ Register page rendering
- ✅ Invalid credentials validation
- ✅ Successful login flow
- ✅ Password mismatch detection
- ✅ Navigation between auth pages

### Home Page Tests (`home.spec.ts`)
- ✅ Unauthenticated user experience
- ✅ Workflows section rendering
- ✅ Navigation links functionality
- ✅ Authenticated navigation
- ✅ React error #300 detection
- ✅ 500 error prevention

### Workflows & Query Tests (`workflows.spec.ts`)
- ✅ Workflows page display
- ✅ Query page navigation
- ✅ Query form rendering
- ✅ History page access
- ✅ Intelligence features
- ✅ Page-to-page navigation
- ✅ Sign out functionality

### API Tests (`api.spec.ts`)
- ✅ /api/workflows endpoint
- ✅ /api/history endpoint
- ✅ /api/auth/session endpoint
- ✅ JSON vs HTML response validation

## 🚀 Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

3. **Seed test data:**
   ```bash
   npm run seed:test
   ```

### Test Commands

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug specific test
npm run test:debug

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 🧪 Test Data

### Test Users

Created by `npm run seed:test`:

**Regular User:**
- Email: `test@acm.com`
- Password: `TestPassword123!`
- Role: `user`

**Admin User:**
- Email: `admin@acm.com`
- Password: `AdminPassword123!`
- Role: `admin`

## 📊 CI/CD Integration

Tests automatically run on:
- ✅ Push to `main`, `master`, or `develop` branches
- ✅ Pull requests to main branches

### GitHub Actions Workflow

Located in `.github/workflows/playwright.yml`

**Features:**
- Automated test database setup
- Test data seeding
- Parallel test execution
- Screenshot capture on failure
- HTML report generation
- Artifact retention

### Viewing CI Test Results

1. Go to your repository's "Actions" tab
2. Click on the latest workflow run
3. Download artifacts to see:
   - Full HTML test report
   - Screenshots of failures
   - Video recordings (if enabled)

## 🐛 Debugging Failed Tests

### Locally

```bash
# Run with UI to see what's happening
npm run test:ui

# Run in headed mode
npm run test:headed

# Debug specific test
npx playwright test tests/auth.spec.ts --debug
```

### Analyzing CI Failures

1. Check the GitHub Actions logs
2. Download screenshot artifacts
3. Look for specific error messages
4. Verify environment variables are set correctly

## 🧹 Test Data Cleanup

**Current Status:** All existing tests are **read-only** - they don't create data that needs cleanup.

However, cleanup utilities are provided in `helpers/cleanup.ts` for future tests that create data.

### Using Cleanup Utilities

```typescript
import { CleanupTracker } from './helpers/cleanup';

test.describe('Query Creation Tests', () => {
  const cleanup = new CleanupTracker();

  test.afterAll(async ({ request }) => {
    await cleanup.cleanup(request);
  });

  test('should create query', async ({ page, request }) => {
    // ... create query ...
    cleanup.trackQuery(queryId); // Track for cleanup
  });
});
```

### Available Functions

- `deleteTestQueries(request, ids[])` - Delete specific queries
- `deleteTestUsers(request, emails[])` - Delete test users (safety checks)
- `deleteTestWorkflows(request, ids[])` - Delete workflows
- `CleanupTracker` - Automatic cleanup tracking

### Safety Features

- Only emails with "test" or "example" can be deleted
- Failed deletions are logged as warnings (don't fail tests)
- Cleanup happens in `afterAll` to ensure it runs even if tests fail

## 📝 Writing New Tests

### Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ page }) => {
    await page.goto('/some-page');
    await expect(page.locator('h1')).toContainText('Expected Text');
  });
});
```

### Best Practices

1. **Use data-testid for reliable selectors**
   ```typescript
   await page.locator('[data-testid="submit-button"]').click();
   ```

2. **Wait for network idle when needed**
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. **Handle async operations**
   ```typescript
   await expect(page.locator('.success')).toBeVisible({ timeout: 5000 });
   ```

4. **Clean up after tests**
   ```typescript
   test.afterEach(async ({ page }) => {
     // Cleanup
   });
   ```

## 🔧 Configuration

### Environment Variables

Create `.env.local` with:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/acm_test
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Playwright Config

Modify `playwright.config.ts` to:
- Change number of workers
- Add/remove browsers
- Adjust timeouts
- Configure retries

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)

## 🎯 Coverage Goals

- ✅ All critical user flows
- ✅ Authentication and authorization
- ✅ Data fetching and display
- ✅ Form submissions
- ✅ Navigation
- ✅ Error states
- ✅ API endpoints

## 🔄 Maintenance

**Weekly:**
- Review test failures
- Update test data if schema changes

**Monthly:**
- Update Playwright version
- Review and refactor flaky tests
- Add tests for new features

**Per Release:**
- Run full test suite
- Verify all critical paths
- Check test coverage
