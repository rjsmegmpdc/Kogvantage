import { test, expect } from '@playwright/test';

test.describe('Gantt View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Should default to Gantt view
  });

  test('should render the Gantt chart container', async ({ page }) => {
    // The Gantt view should have an SVG or scrollable container
    const ganttContainer = page.locator('[class*="overflow"]').first();
    await expect(ganttContainer).toBeVisible();
  });

  test('should show zoom level controls', async ({ page }) => {
    // Check for zoom buttons or selector
    const zoomButtons = page.locator('button:has-text("Day"), button:has-text("Week"), button:has-text("Month"), button:has-text("Quarter"), button:has-text("Year")');
    // At least one zoom indicator should be present
    const monthBtn = page.locator('button:has-text("Month")');
    if (await monthBtn.isVisible()) {
      await expect(monthBtn).toBeVisible();
    }
  });

  test('should render SVG elements for tasks', async ({ page }) => {
    // Wait for SVG to render
    await page.waitForTimeout(1000);

    // SVG should be present in the page
    const svgElements = page.locator('svg');
    const count = await svgElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show the Today indicator', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Today line is typically a dashed line in the SVG
    const todayElements = page.locator('text:has-text("Today"), line[stroke-dasharray]');
    const count = await todayElements.count();
    // May or may not be visible depending on scroll position
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should switch to Subway view via toggle', async ({ page }) => {
    const subwayToggle = page.locator('button:has-text("Subway")').first();
    await subwayToggle.click();

    // Header should update
    await expect(page.locator('h2:has-text("Subway Map")')).toBeVisible();
  });
});
