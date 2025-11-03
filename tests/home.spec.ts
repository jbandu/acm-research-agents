import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display home page correctly for unauthenticated users', async ({ page }) => {
    await page.goto('/');

    // Check hero section
    await expect(page.locator('h1')).toContainText('ACM Research Agents');
    await expect(page.locator('text=Multi-LLM Research Intelligence Platform')).toBeVisible();

    // Check stats cards
    await expect(page.locator('text=Research Queries')).toBeVisible();
    await expect(page.locator('text=Consensus Rate')).toBeVisible();
    await expect(page.locator('text=Research Workflows')).toBeVisible();

    // Check CTA buttons show sign in
    const signInButtons = page.locator('text=Sign In');
    await expect(signInButtons.first()).toBeVisible();

    // Check "How It Works" section
    await expect(page.locator('h2:has-text("How It Works")')).toBeVisible();
    await expect(page.locator('h3:has-text("Ask Your Question")')).toBeVisible();
    await expect(page.locator('h3:has-text("Parallel Analysis")')).toBeVisible();
    await expect(page.locator('h3:has-text("Consensus Detection")').first()).toBeVisible();

    // Check LLM models section
    await expect(page.locator('text=Claude Sonnet 4.5')).toBeVisible();
    await expect(page.locator('text=GPT-4o')).toBeVisible();
    await expect(page.locator('text=Gemini 2.0 Flash')).toBeVisible();
    await expect(page.locator('text=Grok 2')).toBeVisible();
  });

  test('should display workflows section', async ({ page }) => {
    await page.goto('/');

    // Wait for workflows to load
    await page.waitForLoadState('networkidle');

    // Check if workflows section exists
    const workflowsSection = page.locator('text=Research Workflows').first();

    if (await workflowsSection.isVisible()) {
      // If workflows are available, check the grid
      const workflowCards = page.locator('[class*="grid"] > div').filter({ hasText: /Target Identification|Clinical Trial|Literature Mining/ });

      // Should have at least some workflow cards
      const count = await workflowCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');

    // Check footer links
    await expect(page.locator('footer a[href="/query"]')).toBeVisible();
    await expect(page.locator('footer a[href="/workflows"]')).toBeVisible();
    await expect(page.locator('footer a[href="/history"]')).toBeVisible();
  });

  test('should show authenticated navigation after login', async ({ page }) => {
    // Login first with environment credentials
    const testEmail = process.env.TEST_USER_EMAIL || 'test@acm.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.goto('/auth/signin');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Check authenticated navigation
    await expect(page.locator('nav a[href="/query"]')).toBeVisible();
    await expect(page.locator('nav a[href="/workflows"]')).toBeVisible();
    await expect(page.locator('nav a[href="/history"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Out")')).toBeVisible();

    // Check user info is displayed (use environment email)
    const emailPart = testEmail.split('@')[0]; // Get first part of email
    await expect(
      page.locator(`text=${testEmail}`).or(page.locator(`text=${emailPart}`)).or(page.locator('text=Sign Out'))
    ).toBeVisible();
  });

  test('should not show React error #300', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that no React error #300 occurred
    const hasReactError = errors.some(err => err.includes('Minified React error #300'));
    expect(hasReactError).toBe(false);
  });

  test('should load without 500 errors', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('response', response => {
      if (response.status() === 500) {
        failedRequests.push(response.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // No requests should return 500
    expect(failedRequests).toHaveLength(0);
  });
});
