import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health endpoint should return OK', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.version).toBe('0.1.0');
    expect(body.database).toBe('connected');
    expect(body.uptime).toBeGreaterThan(0);
    expect(body.timestamp).toBeTruthy();
  });

  test('tRPC projects.list should return data', async ({ request }) => {
    const response = await request.get('/api/trpc/projects.list');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    // tRPC batch format
    expect(body).toBeTruthy();
  });

  test('tRPC tasks.list should return data', async ({ request }) => {
    const response = await request.get('/api/trpc/tasks.list');
    expect(response.ok()).toBeTruthy();
  });

  test('tRPC settings.getAll should return settings', async ({ request }) => {
    const response = await request.get('/api/trpc/settings.getAll');
    expect(response.ok()).toBeTruthy();
  });

  test('tRPC coordinator.summary should return counts', async ({ request }) => {
    const response = await request.get('/api/trpc/coordinator.summary');
    expect(response.ok()).toBeTruthy();
  });

  test('tRPC coordinator.getImportCounts should return import stats', async ({ request }) => {
    const response = await request.get('/api/trpc/coordinator.getImportCounts');
    expect(response.ok()).toBeTruthy();
  });
});
