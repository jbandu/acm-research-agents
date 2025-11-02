import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('GET /api/workflows should return valid JSON', async ({ request }) => {
    const response = await request.get('/api/workflows');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('workflows');
    expect(Array.isArray(data.workflows)).toBe(true);
  });

  test('GET /api/history should return valid JSON', async ({ request }) => {
    const response = await request.get('/api/history?limit=10');

    // Should return 200, not 500
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('queries');
    expect(data).toHaveProperty('pagination');
    expect(Array.isArray(data.queries)).toBe(true);
  });

  test('GET /api/auth/session should work', async ({ request }) => {
    const response = await request.get('/api/auth/session');

    // Should return 200 (may be null session if not authenticated)
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Session data structure varies, just ensure valid JSON
    expect(data).toBeDefined();
  });

  test('API endpoints should not return HTML', async ({ request }) => {
    const endpoints = [
      '/api/workflows',
      '/api/history',
      '/api/auth/session',
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      const contentType = response.headers()['content-type'];

      expect(contentType).toContain('application/json');

      const text = await response.text();
      expect(text).not.toContain('<!DOCTYPE');
      expect(text).not.toContain('<html');
    }
  });
});
