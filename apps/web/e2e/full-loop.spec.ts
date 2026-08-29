import { expect, test } from '@playwright/test';

/**
 * The whole career runs in the browser (the engine ships client-side), so this
 * passes with no API and no database — the game degrades to "offline, unsaved".
 */
test('play a full career from create to legacy', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start a new career' }).click();

  await expect(page).toHaveURL(/\/create$/);
  await page.getByLabel('Name').fill('E2E Tester');
  // default position PG + first archetype are pre-selected
  await page.getByRole('button', { name: 'Enter the summer circuit' }).click();

  await expect(page).toHaveURL(/\/play$/);

  // Click the first choice on each node until the career ends (nav is links, not buttons).
  for (let step = 0; step < 60; step += 1) {
    if (/\/legacy$/.test(page.url())) break;
    await page.getByRole('button').first().click();
    await page.waitForTimeout(30);
  }

  await expect(page).toHaveURL(/\/legacy$/);
  await expect(page.getByRole('heading', { name: 'E2E Tester' })).toBeVisible();
  await expect(page.getByText('Trophy case')).toBeVisible();
  await expect(page.getByText(/legacy$/)).toBeVisible();
});

test('unknown share id shows a friendly fallback', async ({ page }) => {
  await page.goto('/c/aaaaaaaaaaaa');
  await expect(page.getByRole('button', { name: /start your own career/i })).toBeVisible();
});
