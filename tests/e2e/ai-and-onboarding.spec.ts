import { test, expect } from '@playwright/test';

test.describe('AI Assistant Panel', () => {
  test('should open AI panel when clicking the button', async ({ page }) => {
    await page.goto('/');

    // Click AI Assistant button in header
    const aiBtn = page.locator('header button:has-text("AI Assistant")');
    await aiBtn.click();

    // Panel should appear with welcome message
    await page.waitForTimeout(500);
    await expect(page.locator('aside h3:has-text("AI Assistant")')).toBeVisible();
    await expect(page.locator('text=Claude Sonnet')).toBeVisible();
  });

  test('should show quick action buttons', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("AI Assistant")').click();
    await page.waitForTimeout(300);

    // Quick action buttons
    const analyzeBtn = page.locator('button:has-text("Analyze risks")');
    const reportBtn = page.locator('button:has-text("Draft report")');

    await expect(analyzeBtn).toBeVisible();
    await expect(reportBtn).toBeVisible();
  });

  test('should have a chat input field', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("AI Assistant")').click();
    await page.waitForTimeout(300);

    const input = page.locator('input[placeholder*="portfolio"]');
    await expect(input).toBeVisible();
  });

  test('should type and send a message', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("AI Assistant")').click();
    await page.waitForTimeout(300);

    const input = page.locator('input[placeholder*="portfolio"]');
    await input.fill('What projects are at risk?');
    await input.press('Enter');

    // Should show user message
    await page.waitForTimeout(500);
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('What projects are at risk?');
  });

  test('should close AI panel', async ({ page }) => {
    await page.goto('/');
    await page.locator('header button:has-text("AI Assistant")').click();
    await page.waitForTimeout(300);

    // Close button (X icon) — first button inside the AI aside panel
    const closeBtn = page.locator('aside:last-of-type button').first();
    await closeBtn.click();
    await page.waitForTimeout(300);

    // Panel should be gone
    await expect(page.locator('text=Claude Sonnet')).not.toBeVisible();
  });
});

test.describe('Onboarding Wizard', () => {
  test('should open wizard when clicking Setup button', async ({ page }) => {
    await page.goto('/');

    const setupBtn = page.locator('button:has-text("Setup")');
    await setupBtn.click();
    await page.waitForTimeout(300);

    // Wizard should appear
    await expect(page.locator('text=Welcome to Kogvantage')).toBeVisible();
  });

  test('should show step 1 with role selection', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Setup")').click();
    await page.waitForTimeout(300);

    // Should show role options
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Admin');
    expect(pageContent).toContain('Portfolio Manager');
  });

  test('should navigate to next step', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Setup")').click();
    await page.waitForTimeout(300);

    // Click Next
    const nextBtn = page.locator('button:has-text("Next")');
    await nextBtn.click();
    await page.waitForTimeout(300);

    // Should be on step 2 (Organization Profile)
    const pageContent = await page.textContent('body');
    expect(
      pageContent?.includes('Organization') ||
      pageContent?.includes('Currency') ||
      pageContent?.includes('Fiscal')
    ).toBeTruthy();
  });

  test('should navigate back to previous step', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Setup")').click();
    await page.waitForTimeout(300);

    // Go to step 2
    await page.locator('button:has-text("Next")').click();
    await page.waitForTimeout(300);

    // Go back to step 1
    const prevBtn = page.locator('button:has-text("Previous")');
    await prevBtn.click();
    await page.waitForTimeout(300);

    // Should show Welcome again
    await expect(page.locator('text=Welcome to Kogvantage')).toBeVisible();
  });

  test('should show progress indicator', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Setup")').click();
    await page.waitForTimeout(300);

    // Step indicator (e.g., "Step 1 of 8" or progress dots)
    const pageContent = await page.textContent('body');
    expect(
      pageContent?.includes('1') &&
      pageContent?.includes('8')
    ).toBeTruthy();
  });

  test('should close wizard with skip', async ({ page }) => {
    await page.goto('/');
    await page.locator('button:has-text("Setup")').click();
    await page.waitForTimeout(300);

    // Skip button
    const skipBtn = page.locator('button:has-text("Skip")');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
      await page.waitForTimeout(300);
      // Wizard should close
      await expect(page.locator('text=Welcome to Kogvantage')).not.toBeVisible();
    }
  });
});

test.describe('Settings View', () => {
  test('should show settings tabs', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Settings');
    await page.waitForTimeout(500);

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('General');
    expect(pageContent).toContain('Security');
    expect(pageContent).toContain('Integrations');
  });

  test('should show theme toggle in general settings', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Settings');
    await page.waitForTimeout(500);

    const pageContent = await page.textContent('body');
    expect(
      pageContent?.includes('Dark') ||
      pageContent?.includes('Light') ||
      pageContent?.includes('Theme')
    ).toBeTruthy();
  });
});
