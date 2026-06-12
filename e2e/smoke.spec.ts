import { test, expect } from '@playwright/test';

test.describe('Timeline App', () => {
  test('loads empty state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Daily Check-in Timeline');
    await expect(page.locator('.month-nav')).toBeVisible();
  });

  test('adds bullets and persists after reload', async ({ page }) => {
    await page.goto('/');

    // Find the first textarea (today's work section)
    const textarea = page.locator('.category-section').first().locator('textarea');
    await textarea.fill('task one\ntask two');

    // Wait for autosave
    await page.waitForTimeout(600);

    // Reload
    await page.reload();

    // Verify persistence
    await expect(page.locator('.category-section').first().locator('textarea')).toHaveValue('task one\ntask two');
  });

  test('switches views', async ({ page }) => {
    await page.goto('/');

    // Switch to stats
    await page.click('button:has-text("Stats")');
    await expect(page.locator('.stats-panel')).toBeVisible();

    // Switch to gantt
    await page.click('button:has-text("Gantt")');
    await expect(page.locator('.timeline-gantt-view')).toBeVisible();

    // Switch back to cards
    await page.click('button:has-text("Cards")');
    await expect(page.locator('.timeline-cards-view')).toBeVisible();
  });

  test('opens settings dialog', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Settings")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toHaveText('Settings');
  });

  test('opens export dialog', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Export")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('h2')).toHaveText('Export');
  });
});
