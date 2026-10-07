import { expect, test } from '@playwright/test';

/** The engine runs in the browser, so this works with no API or database. */
test('play a full career from create to legacy', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start a new career' }).click();

  await expect(page).toHaveURL(/\/create$/);
  await page.getByLabel('Name').fill('E2E Tester');
  // Position, archetype, jersey and country are pre-filled.
  await page.getByRole('button', { name: 'Enter the summer circuit' }).click();

  await expect(page).toHaveURL(/\/play$/);

  // Click the first choice on each screen, skipping the perks shop button.
  for (let step = 0; step < 220; step += 1) {
    if (/\/legacy$/.test(page.url())) break;
    await page.locator('button:not([aria-label="Perks shop"])').first().click();
    await page.waitForTimeout(15);
  }

  await expect(page).toHaveURL(/\/legacy$/);
  await expect(page.getByRole('heading', { name: /E2E Tester/ })).toBeVisible();
  await expect(page.getByText('Trophy case')).toBeVisible();
  await expect(page.getByText(/\d+ legacy$/)).toBeVisible();
  await expect(page.getByText('College')).toBeVisible();
  await expect(page.getByText('Career earnings')).toBeVisible();
});

test('unknown share id shows a friendly fallback', async ({ page }) => {
  await page.goto('/c/aaaaaaaaaaaa');
  await expect(page.getByRole('button', { name: /start your own career/i })).toBeVisible();
});
