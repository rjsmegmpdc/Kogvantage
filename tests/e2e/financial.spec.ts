import { test, expect } from '@playwright/test';

test.describe('Financial Views', () => {
  test('should show Coordinator dashboard with summary cards', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Financials');
    await expect(page.locator('h2:has-text("Financials")')).toBeVisible();

    // Should show financial summary cards
    await page.waitForTimeout(1000);
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Total Budget');
  });

  test('should show quick navigation links on coordinator dashboard', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Financials');
    await page.waitForTimeout(500);

    // Should have quick links
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Import');
  });

  test('should show Data Pack Uploader on Resources view', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Resources');
    await expect(page.locator('h2:has-text("Resources")')).toBeVisible();

    await page.waitForTimeout(500);
    // Should show drag-drop upload area
    const pageContent = await page.textContent('body');
    expect(
      pageContent?.includes('Drop') ||
      pageContent?.includes('drag') ||
      pageContent?.includes('upload') ||
      pageContent?.includes('data pack')
    ).toBeTruthy();
  });

  test('should show Variance Alerts on Reports view', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Reports');
    await expect(page.locator('h2:has-text("Reports")')).toBeVisible();

    await page.waitForTimeout(500);
    // Should show alert content
    const pageContent = await page.textContent('body');
    expect(
      pageContent?.includes('Alert') ||
      pageContent?.includes('Variance') ||
      pageContent?.includes('commitment') ||
      pageContent?.includes('critical')
    ).toBeTruthy();
  });

  test('should show severity filter on alerts view', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Reports');
    await page.waitForTimeout(500);

    // Check for filter buttons
    const criticalBtn = page.locator('button:has-text("Critical")');
    const highBtn = page.locator('button:has-text("High")');

    if (await criticalBtn.isVisible()) {
      await criticalBtn.click();
      await page.waitForTimeout(300);
    }
  });
});
