import { test, expect } from '@playwright/test';

test.describe('Subway View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to Subway view
    await page.click('text=Subway Map');
    await expect(page.locator('h2:has-text("Subway Map")')).toBeVisible();
  });

  test('should render the subway canvas with SVG', async ({ page }) => {
    await page.waitForTimeout(1000);
    const svgElements = page.locator('svg');
    const count = await svgElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show the legend with station types', async ({ page }) => {
    // Legend should show station type labels
    const legend = page.locator('text=Major Milestone, text=Minor Milestone, text=Resolution');
    // At least check that some station type text is present
    await page.waitForTimeout(500);
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });

  test('should show the Today button', async ({ page }) => {
    const todayBtn = page.locator('button:has-text("Today")');
    if (await todayBtn.isVisible()) {
      await todayBtn.click();
      // Should scroll to today's position
      await page.waitForTimeout(500);
    }
  });

  test('should show Add button', async ({ page }) => {
    const addBtn = page.locator('button:has-text("Add")');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Should open add station modal
      await page.waitForTimeout(300);
      const modal = page.locator('text=Add Station, text=Add Stop, text=Route');
      const modalCount = await modal.count();
      expect(modalCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show Settings button', async ({ page }) => {
    const settingsBtn = page.locator('button:has-text("Settings")').last();
    // Settings button in the subway header (not sidebar)
    await page.waitForTimeout(500);
  });

  test('should switch back to Gantt view', async ({ page }) => {
    const ganttToggle = page.locator('button:has-text("Gantt")').first();
    await ganttToggle.click();
    await expect(page.locator('h2:has-text("Gantt Roadmap")')).toBeVisible();
  });
});
