import { test, expect } from '@playwright/test';

test.describe('Workflows and Query Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test with environment credentials
    const testEmail = process.env.TEST_USER_EMAIL || 'test@acm.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display workflows page', async ({ page }) => {
    await page.goto('/workflows');

    // Check page title
    await expect(page.locator('h1')).toContainText('Research Workflows');

    // Wait for workflows to load
    await page.waitForLoadState('networkidle');

    // Should have workflow cards
    const workflowCards = page.locator('[class*="rounded-lg"][class*="border"]').filter({ hasText: /Target|Clinical|Literature|Competitive|Regulatory/ });
    const count = await workflowCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to query page', async ({ page }) => {
    await page.goto('/query');

    // Check page elements
    await expect(page.locator('h1')).toContainText('New Research Query');
    await expect(page.locator('textarea')).toBeVisible();

    // Check workflow selector
    await expect(page.locator('select').or(page.locator('text=Select Workflow'))).toBeVisible();
  });

  test('should display query form correctly', async ({ page }) => {
    await page.goto('/query');

    // Check form elements
    await expect(page.locator('textarea[placeholder*="Enter your research"]').or(page.locator('textarea'))).toBeVisible();

    // Check submit button exists
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Submit")').or(page.locator('button:has-text("Run Query")')));
    await expect(submitButton.first()).toBeVisible();
  });

  test('should navigate to history page', async ({ page }) => {
    await page.goto('/history');

    // Check page loads without error
    await page.waitForLoadState('networkidle');

    // Should have history title or empty state
    await expect(
      page.locator('h1').or(page.locator('text=Query History').or(page.locator('text=No queries found')))
    ).toBeVisible();
  });

  test('should access intelligence features', async ({ page }) => {
    await page.goto('/');

    // Check if Intelligence dropdown exists
    const intelligenceDropdown = page.locator('text=Intelligence').first();

    if (await intelligenceDropdown.isVisible()) {
      await intelligenceDropdown.click();

      // Should show dropdown options
      await expect(
        page.locator('text=Knowledge Graph').or(page.locator('text=Competitor Map'))
      ).toBeVisible();
    }
  });

  test('should handle navigation between pages', async ({ page }) => {
    // Start at home
    await page.goto('/');

    // Navigate to workflows
    await page.click('text=Workflows');
    await expect(page).toHaveURL(/\/workflows/);

    // Navigate to new query
    await page.click('text=New Query');
    await expect(page).toHaveURL(/\/query/);

    // Navigate to history
    await page.click('text=History');
    await expect(page).toHaveURL(/\/history/);

    // Navigate back to home
    await page.click('text=ACM Research Agents');
    await expect(page).toHaveURL('/');
  });

  test('should sign out successfully', async ({ page }) => {
    await page.goto('/');

    // Click sign out
    await page.click('text=Sign Out');

    // Should redirect to sign in page
    await page.waitForURL('/auth/signin', { timeout: 10000 });

    // Should show sign in form
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
  });
});
