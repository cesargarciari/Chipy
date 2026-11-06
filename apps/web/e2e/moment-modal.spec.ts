import { ENGINE_VERSION } from '@chipy/engine';
import { expect, test } from '@playwright/test';

/**
 * A saved run that is one screen away from a championship: seed 1, always the
 * first option, wins the ring in season 3. The engine is deterministic, so
 * replaying these choices always lands on that season's celebration.
 */
const RING_RUN = {
  seed: 1,
  profile: {
    name: 'Ring Tester',
    position: 'PG',
    archetype: 'floor_general',
    market: 'large',
    jerseyNumber: 23,
    country: 'us',
    handedness: 'right',
  },
  choices: [
    { nodeId: 'highschool', choiceId: 'aau_superteam' },
    { nodeId: 'recruiting', choiceId: 'blue_blood' },
    { nodeId: 'college1', choiceId: 'ucla' },
    { nodeId: 'cy1', choiceId: 'cy_declare_1' },
    { nodeId: 'landing', choiceId: 'offer_0' },
    { nodeId: 's1', choiceId: 'plat_brand' },
    { nodeId: 's2', choiceId: 'coach_buy_in' },
    { nodeId: 'chem2', choiceId: 'chm_night_roll' },
    { nodeId: 's3', choiceId: 'lab_muscle' },
    { nodeId: 'finals3', choiceId: 'fin_iso_spot' },
  ],
};

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 375, height: 700 },
]) {
  test(`championship trophy stays above the headline at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
      `chipy.run.${ENGINE_VERSION}`,
      JSON.stringify({ state: RING_RUN, version: 0 }),
    ] as const);
    await page.goto('/play');

    const dialog = page.getByRole('dialog');
    const headline = dialog.getByRole('heading', { name: 'ON TOP OF THE WORLD' });
    await expect(headline).toBeVisible();

    // The trophy art is taller than it is wide, which is what used to push it out of its frame.
    const trophy = dialog.locator('img').first();
    await expect(trophy).toHaveJSProperty('complete', true);
    await trophy.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));

    const trophyBox = await trophy.boundingBox();
    const headlineBox = await headline.boundingBox();
    expect(trophyBox).not.toBeNull();
    expect(headlineBox).not.toBeNull();
    expect(trophyBox!.y + trophyBox!.height).toBeLessThanOrEqual(headlineBox!.y);
  });
}
