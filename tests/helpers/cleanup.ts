/**
 * Test Cleanup Utilities
 *
 * Provides functions to clean up test data created during E2E tests.
 * Import and use these in afterEach/afterAll hooks to ensure tests
 * don't leave artifacts in production database.
 */

import { APIRequestContext } from '@playwright/test';

interface CleanupOptions {
  request: APIRequestContext;
  testUserEmail?: string;
}

/**
 * Delete queries created during tests
 * @param queryIds Array of query IDs to delete
 */
export async function deleteTestQueries(
  request: APIRequestContext,
  queryIds: string[]
): Promise<void> {
  for (const queryId of queryIds) {
    try {
      await request.delete(`/api/history/${queryId}`);
      console.log(`✓ Deleted test query: ${queryId}`);
    } catch (error) {
      console.warn(`⚠ Failed to delete query ${queryId}:`, error);
    }
  }
}

/**
 * Delete users created during tests
 * CAUTION: Only use for test users, never delete production users!
 * @param emails Array of email addresses to delete
 */
export async function deleteTestUsers(
  request: APIRequestContext,
  emails: string[]
): Promise<void> {
  for (const email of emails) {
    // Safety check: only delete test users
    if (!email.includes('test') && !email.includes('example')) {
      console.warn(`⚠ Skipping deletion of non-test user: ${email}`);
      continue;
    }

    try {
      await request.delete(`/api/admin/users?email=${encodeURIComponent(email)}`);
      console.log(`✓ Deleted test user: ${email}`);
    } catch (error) {
      console.warn(`⚠ Failed to delete user ${email}:`, error);
    }
  }
}

/**
 * Delete workflows created during tests
 * @param workflowIds Array of workflow IDs to delete
 */
export async function deleteTestWorkflows(
  request: APIRequestContext,
  workflowIds: string[]
): Promise<void> {
  for (const workflowId of workflowIds) {
    try {
      await request.delete(`/api/workflows/${workflowId}`);
      console.log(`✓ Deleted test workflow: ${workflowId}`);
    } catch (error) {
      console.warn(`⚠ Failed to delete workflow ${workflowId}:`, error);
    }
  }
}

/**
 * Get all queries created by a specific user
 * Useful for bulk cleanup after test suite
 */
export async function getQueriesByUser(
  request: APIRequestContext,
  userEmail: string
): Promise<string[]> {
  try {
    const response = await request.get(`/api/history?user=${encodeURIComponent(userEmail)}&limit=1000`);
    const data = await response.json();

    return data.queries?.map((q: any) => q.id) || [];
  } catch (error) {
    console.warn('⚠ Failed to fetch queries:', error);
    return [];
  }
}

/**
 * Complete cleanup for a test user session
 * Removes all queries, workflows, and optionally the user account
 */
export async function cleanupTestSession(
  options: CleanupOptions & {
    deleteUser?: boolean;
    queryIds?: string[];
    workflowIds?: string[];
  }
): Promise<void> {
  const { request, testUserEmail, deleteUser = false, queryIds = [], workflowIds = [] } = options;

  console.log('🧹 Starting test cleanup...');

  // Delete queries
  if (queryIds.length > 0) {
    await deleteTestQueries(request, queryIds);
  }

  // Delete workflows
  if (workflowIds.length > 0) {
    await deleteTestWorkflows(request, workflowIds);
  }

  // Delete user (if requested and is a test user)
  if (deleteUser && testUserEmail) {
    await deleteTestUsers(request, [testUserEmail]);
  }

  console.log('✓ Test cleanup complete');
}

/**
 * Create a cleanup tracker for accumulating IDs during tests
 */
export class CleanupTracker {
  private queryIds: string[] = [];
  private workflowIds: string[] = [];
  private userEmails: string[] = [];

  trackQuery(queryId: string): void {
    this.queryIds.push(queryId);
  }

  trackWorkflow(workflowId: string): void {
    this.workflowIds.push(workflowId);
  }

  trackUser(email: string): void {
    this.userEmails.push(email);
  }

  async cleanup(request: APIRequestContext): Promise<void> {
    await cleanupTestSession({
      request,
      queryIds: this.queryIds,
      workflowIds: this.workflowIds,
    });

    if (this.userEmails.length > 0) {
      await deleteTestUsers(request, this.userEmails);
    }

    // Reset tracker
    this.queryIds = [];
    this.workflowIds = [];
    this.userEmails = [];
  }
}
