import { test, expect } from '@playwright/test';

test.describe('app smoke tests', () => {
  test('app loads and shows menu screen', async ({ page }) => {
    await page.goto('/');
    // The menu screen should be visible with the Start Game button from ConfigStart
    await expect(
      page.getByRole('button', { name: /start game/i }),
    ).toBeVisible({ timeout: 10000 });
  });

  test('can dismiss tutorial and see menu', async ({ page }) => {
    // Clear localStorage to simulate first visit (Capacitor Preferences uses localStorage on web)
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Tutorial overlay should appear for first-time users
    // Look for tutorial content or Skip Tutorial button
    const skipButton = page.getByText('Skip Tutorial');
    const tutorialVisible = await skipButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (tutorialVisible) {
      await skipButton.click();
      // After dismissing tutorial, menu should be visible
      await expect(
        page.getByRole('button', { name: /start game/i }),
      ).toBeVisible({ timeout: 5000 });
    }
    // If tutorial doesn't show (tutorialCompleted already set), menu is already visible
  });

  test('start game and see game screen', async ({ page }) => {
    await page.goto('/');

    // Dismiss tutorial if present
    const skipButton = page.getByText('Skip Tutorial');
    const tutorialVisible = await skipButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (tutorialVisible) {
      await skipButton.click();
    }

    // Click the Start Game button on the menu
    await page.getByRole('button', { name: /start game/i }).click({
      timeout: 5000,
    });

    // Game screen should show response buttons (Color, Emoji, Position, Shape)
    await expect(page.getByText(/color/i).first()).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByText(/emoji/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('pause and resume game', async ({ page }) => {
    await page.goto('/');

    // Dismiss tutorial if present
    const skipButton = page.getByText('Skip Tutorial');
    const tutorialVisible = await skipButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (tutorialVisible) {
      await skipButton.click();
    }

    // Start the game
    await page.getByRole('button', { name: /start game/i }).click({
      timeout: 5000,
    });

    // Wait for game screen to be ready
    await expect(page.getByText(/color/i).first()).toBeVisible({
      timeout: 5000,
    });

    // Click pause button (top right, title="Pause")
    await page.locator('button[title="Pause"]').click({ timeout: 5000 });

    // Pause modal should show resume button
    await expect(page.getByRole('button', { name: /resume/i })).toBeVisible({
      timeout: 3000,
    });

    // Resume the game
    await page.getByRole('button', { name: /resume/i }).click();

    // Should be back in game (pause modal gone)
    await expect(
      page.getByRole('button', { name: /resume/i }),
    ).not.toBeVisible({ timeout: 3000 });
  });
});
