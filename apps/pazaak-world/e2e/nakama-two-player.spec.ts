import { test, expect, type Page } from "@playwright/test";

const onboarding = JSON.stringify({
  completed: true,
  boardStyle: "classic",
  notificationChoice: "skip",
  completedAt: new Date().toISOString(),
});

const chitinProof = JSON.stringify({
  filename: "chitin.key",
  size: 1,
  uploadedAt: new Date().toISOString(),
});

function seedStandaloneMatchHub(page: import("@playwright/test").Page): Promise<void> {
  return page.addInitScript(
    ([onb, chi]: [string, string]) => {
      // Wipe stale sessions (e.g. nk1.* tokens) so we always exercise cold guest → Nakama device auth.
      try {
        localStorage.clear();
      } catch {
        /* ignore */
      }
      localStorage.setItem("pazaak-world-onboarding-v1", onb);
      localStorage.setItem("cardworld-chitin-proof-v1", chi);
    },
    [onboarding, chitinProof],
  );
}

async function matchFinishedVisible(page: Page): Promise<boolean> {
  return page.locator(".game-result").isVisible();
}

/** Returns true if an action was taken (draw, side card, end turn, or stand). */
async function tryTakeTurn(page: Page): Promise<boolean> {
  if (await matchFinishedVisible(page)) {
    return false;
  }

  const draw = page.locator('[data-testid="draw-btn"]');
  if (await draw.isVisible() && await draw.isEnabled()) {
    await draw.click();
    return true;
  }

  const sideCard = page.locator(".side-cards .btn--card").first();
  if (await sideCard.isVisible() && await sideCard.isEnabled()) {
    await sideCard.click();
    return true;
  }

  const endTurnBtn = page.getByRole("button", { name: "End Turn" });
  if (await endTurnBtn.isVisible() && await endTurnBtn.isEnabled()) {
    await endTurnBtn.click();
    return true;
  }

  const stand = page.locator('[data-testid="stand-btn"]');
  if (await stand.isVisible() && await stand.isEnabled()) {
    const raw = await page.locator('[data-testid="score-display"]').textContent();
    const total = Number.parseInt(raw?.trim() ?? "0", 10);
    if (total >= 17) {
      await stand.click();
      return true;
    }
    const endAgain = page.getByRole("button", { name: "End Turn" });
    if (await endAgain.isVisible() && await endAgain.isEnabled()) {
      await endAgain.click();
      return true;
    }
    await stand.click();
    return true;
  }

  return false;
}

async function gotoMatchHubBoth(pageA: Page, pageB: Page): Promise<void> {
  // Fully serial: two simultaneous `authenticateDevice` calls against local Nakama often time out; finish guest A before loading B.
  const hubTimeout = 120_000;
  await pageA.goto("/pazaakworld", { waitUntil: "load" });
  await expect(pageA.getByRole("button", { name: "Find Match" })).toBeVisible({ timeout: hubTimeout });
  await pageB.goto("/pazaakworld", { waitUntil: "load" });
  await expect(pageB.getByRole("button", { name: "Find Match" })).toBeVisible({ timeout: hubTimeout });
}

async function playUntilBothSeeResult(pageA: Page, pageB: Page, maxMs: number): Promise<void> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const doneA = await matchFinishedVisible(pageA);
    const doneB = await matchFinishedVisible(pageB);
    if (doneA && doneB) {
      return;
    }

    let acted = false;
    for (const p of [pageA, pageB]) {
      if (await tryTakeTurn(p)) {
        acted = true;
        break;
      }
    }

    if (!acted) {
      await pageA.waitForTimeout(150);
    }
  }

  throw new Error(`Match did not complete within ${maxMs}ms`);
}

test.describe("Nakama quick match (two browsers)", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(async ({ request }) => {
    const port = process.env.VITE_NAKAMA_PORT ?? "7350";
    const host = process.env.VITE_NAKAMA_HOST ?? "127.0.0.1";
    const res = await request.get(`http://${host}:${port}/healthcheck`).catch(() => null);
    if (!res?.ok()) {
      test.skip(true, `Nakama not reachable at http://${host}:${port}/healthcheck — run pnpm dev:pazaak-nakama (or docker compose) and rebuild the runtime (pnpm build:pazaak-nakama).`);
    }
  });

  test("two guests queue and both reach the live table", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    await seedStandaloneMatchHub(pageA);
    await seedStandaloneMatchHub(pageB);

    await gotoMatchHubBoth(pageA, pageB);

    await pageA.getByRole("button", { name: "Find Match" }).click();
    await pageB.getByRole("button", { name: "Find Match" }).click();

    await Promise.all([
      expect(pageA.locator('[data-testid="draw-btn"]')).toBeVisible({ timeout: 90_000 }),
      expect(pageB.locator('[data-testid="draw-btn"]')).toBeVisible({ timeout: 90_000 }),
    ]);

    const enabledA = await pageA.locator('[data-testid="draw-btn"]').isEnabled();
    const enabledB = await pageB.locator('[data-testid="draw-btn"]').isEnabled();
    expect(enabledA || enabledB).toBe(true);

    await contextA.close();
    await contextB.close();
  });

  test("two guests play a full match to completion (two isolated contexts)", async ({ browser }) => {
    test.setTimeout(600_000);

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    await seedStandaloneMatchHub(pageA);
    await seedStandaloneMatchHub(pageB);

    await gotoMatchHubBoth(pageA, pageB);

    await pageA.getByRole("button", { name: "Find Match" }).click();
    await pageB.getByRole("button", { name: "Find Match" }).click();

    await Promise.all([
      expect(pageA.locator('[data-testid="draw-btn"]')).toBeVisible({ timeout: 90_000 }),
      expect(pageB.locator('[data-testid="draw-btn"]')).toBeVisible({ timeout: 90_000 }),
    ]);

    await playUntilBothSeeResult(pageA, pageB, 540_000);

    await expect(pageA.locator(".game-result")).toBeVisible();
    await expect(pageB.locator(".game-result")).toBeVisible();

    const textA = (await pageA.locator(".game-result").innerText()).toLowerCase();
    const textB = (await pageB.locator(".game-result").innerText()).toLowerCase();
    const aOutcome = textA.includes("you won") || textA.includes("you lost") || textA.includes("draw");
    const bOutcome = textB.includes("you won") || textB.includes("you lost") || textB.includes("draw");
    expect(aOutcome && bOutcome).toBe(true);

    const aWon = textA.includes("you won");
    const bWon = textB.includes("you won");
    const aLost = textA.includes("you lost");
    const bLost = textB.includes("you lost");
    expect(aWon !== bWon || (textA.includes("draw") && textB.includes("draw"))).toBe(true);
    if (aWon) {
      expect(bLost).toBe(true);
    }
    if (bWon) {
      expect(aLost).toBe(true);
    }

    await contextA.close();
    await contextB.close();
  });
});
