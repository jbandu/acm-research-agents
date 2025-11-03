import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display sign in page correctly', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check page title
    await expect(page.locator('h2')).toContainText('ACM Research Agents');
    await expect(page.locator('text=Sign in to your account')).toBeVisible();

    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in');

    // Check register link
    await expect(page.locator('text=Register here')).toBeVisible();
  });

  test('should display register page correctly', async ({ page }) => {
    await page.goto('/auth/register');

    // Check page title
    await expect(page.locator('h2')).toContainText('ACM Research Agents');
    await expect(page.locator('text=Create your account')).toBeVisible();

    // Check form elements
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('should show validation error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message (multiple possible selectors)
    await expect(
      page.locator('.text-red-800').or(page.locator('.text-red-600')).or(page.locator('text=Invalid')).or(page.locator('text=incorrect'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill in valid test credentials (use environment variables for production)
    const testEmail = process.env.TEST_USER_EMAIL || 'test@acm.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to home page and show authenticated content
    await page.waitForURL('/', { timeout: 15000 });

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for navigation items that only appear when logged in
    await expect(page.locator('text=New Query').or(page.locator('text=Query'))).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Sign Out')).toBeVisible({ timeout: 10000 });
  });

  test('should show password mismatch error on registration', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[name="name"]', 'New User');
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

    await page.click('button[type="submit"]');

    // Should show password mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should navigate between signin and register pages', async ({ page }) => {
    await page.goto('/auth/signin');

    // Click register link
    await page.click('text=Register here');
    await expect(page).toHaveURL('/auth/register');
    await expect(page.locator('text=Create your account')).toBeVisible();

    // Go back to sign in
    await page.click('text=Sign in here');
    await expect(page).toHaveURL('/auth/signin');
    await expect(page.locator('text=Sign in to your account')).toBeVisible();
  });
});
