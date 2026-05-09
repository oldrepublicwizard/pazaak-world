# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: nakama-two-player.spec.ts >> Nakama quick match (two browsers) >> two guests queue and both reach the live table
- Location: e2e\nakama-two-player.spec.ts:126:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Find Match' })
Expected: visible
Timeout: 120000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 120000ms
  - waiting for getByRole('button', { name: 'Find Match' })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e5]:
    - generic [ref=e6]: ⚠
    - heading "Authentication Failed" [level=2] [ref=e7]
    - paragraph [ref=e8]: "Nakama authenticateDevice: HTTP 409 {\"code\":6, \"message\":\"Username is already in use.\"}"
    - button "Try Again" [ref=e9] [cursor=pointer]
  - generic "Global account controls" [ref=e10]:
    - generic [ref=e11]:
      - button "Guest Pilot Guest" [ref=e12] [cursor=pointer]:
        - generic [ref=e13]: ◌
        - generic [ref=e14]:
          - strong [ref=e15]: Guest Pilot
          - generic [ref=e16]: Guest
      - button "Open settings" [ref=e17] [cursor=pointer]: ⚙
```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | const onboarding = JSON.stringify({
  4   |   completed: true,
  5   |   boardStyle: "classic",
  6   |   notificationChoice: "skip",
  7   |   completedAt: new Date().toISOString(),
  8   | });
  9   | 
  10  | const chitinProof = JSON.stringify({
  11  |   filename: "chitin.key",
  12  |   size: 1,
  13  |   uploadedAt: new Date().toISOString(),
  14  | });
  15  | 
  16  | function seedStandaloneMatchHub(page: import("@playwright/test").Page): Promise<void> {
  17  |   return page.addInitScript(
  18  |     ([onb, chi]: [string, string]) => {
  19  |       // Wipe stale sessions (e.g. nk1.* tokens) so we always exercise cold guest → Nakama device auth.
  20  |       try {
  21  |         localStorage.clear();
  22  |       } catch {
  23  |         /* ignore */
  24  |       }
  25  |       localStorage.setItem("pazaak-world-onboarding-v1", onb);
  26  |       localStorage.setItem("cardworld-chitin-proof-v1", chi);
  27  |     },
  28  |     [onboarding, chitinProof],
  29  |   );
  30  | }
  31  | 
  32  | async function matchFinishedVisible(page: Page): Promise<boolean> {
  33  |   return page.locator(".game-result").isVisible();
  34  | }
  35  | 
  36  | /** Returns true if an action was taken (draw, side card, end turn, or stand). */
  37  | async function tryTakeTurn(page: Page): Promise<boolean> {
  38  |   if (await matchFinishedVisible(page)) {
  39  |     return false;
  40  |   }
  41  | 
  42  |   const draw = page.locator('[data-testid="draw-btn"]');
  43  |   if (await draw.isVisible() && await draw.isEnabled()) {
  44  |     await draw.click();
  45  |     return true;
  46  |   }
  47  | 
  48  |   const sideCard = page.locator(".side-cards .btn--card").first();
  49  |   if (await sideCard.isVisible() && await sideCard.isEnabled()) {
  50  |     await sideCard.click();
  51  |     return true;
  52  |   }
  53  | 
  54  |   const endTurnBtn = page.getByRole("button", { name: "End Turn" });
  55  |   if (await endTurnBtn.isVisible() && await endTurnBtn.isEnabled()) {
  56  |     await endTurnBtn.click();
  57  |     return true;
  58  |   }
  59  | 
  60  |   const stand = page.locator('[data-testid="stand-btn"]');
  61  |   if (await stand.isVisible() && await stand.isEnabled()) {
  62  |     const raw = await page.locator('[data-testid="score-display"]').textContent();
  63  |     const total = Number.parseInt(raw?.trim() ?? "0", 10);
  64  |     if (total >= 17) {
  65  |       await stand.click();
  66  |       return true;
  67  |     }
  68  |     const endAgain = page.getByRole("button", { name: "End Turn" });
  69  |     if (await endAgain.isVisible() && await endAgain.isEnabled()) {
  70  |       await endAgain.click();
  71  |       return true;
  72  |     }
  73  |     await stand.click();
  74  |     return true;
  75  |   }
  76  | 
  77  |   return false;
  78  | }
  79  | 
  80  | async function gotoMatchHubBoth(pageA: Page, pageB: Page): Promise<void> {
  81  |   // Fully serial: two simultaneous `authenticateDevice` calls against local Nakama often time out; finish guest A before loading B.
  82  |   const hubTimeout = 120_000;
  83  |   await pageA.goto("/pazaakworld", { waitUntil: "load" });
> 84  |   await expect(pageA.getByRole("button", { name: "Find Match" })).toBeVisible({ timeout: hubTimeout });
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  85  |   await pageB.goto("/pazaakworld", { waitUntil: "load" });
  86  |   await expect(pageB.getByRole("button", { name: "Find Match" })).toBeVisible({ timeout: hubTimeout });
  87  | }
  88  | 
  89  | async function playUntilBothSeeResult(pageA: Page, pageB: Page, maxMs: number): Promise<void> {
  90  |   const deadline = Date.now() + maxMs;
  91  |   while (Date.now() < deadline) {
  92  |     const doneA = await matchFinishedVisible(pageA);
  93  |     const doneB = await matchFinishedVisible(pageB);
  94  |     if (doneA && doneB) {
  95  |       return;
  96  |     }
  97  | 
  98  |     let acted = false;
  99  |     for (const p of [pageA, pageB]) {
  100 |       if (await tryTakeTurn(p)) {
  101 |         acted = true;
  102 |         break;
  103 |       }
  104 |     }
  105 | 
  106 |     if (!acted) {
  107 |       await pageA.waitForTimeout(150);
  108 |     }
  109 |   }
  110 | 
  111 |   throw new Error(`Match did not complete within ${maxMs}ms`);
  112 | }
  113 | 
  114 | test.describe("Nakama quick match (two browsers)", () => {
  115 |   test.describe.configure({ timeout: 180_000 });
  116 | 
  117 |   test.beforeAll(async ({ request }) => {
  118 |     const port = process.env.VITE_NAKAMA_PORT ?? "7350";
  119 |     const host = process.env.VITE_NAKAMA_HOST ?? "127.0.0.1";
  120 |     const res = await request.get(`http://${host}:${port}/healthcheck`).catch(() => null);
  121 |     if (!res?.ok()) {
  122 |       test.skip(true, `Nakama not reachable at http://${host}:${port}/healthcheck — run pnpm dev:pazaak-nakama (or docker compose) and rebuild the runtime (pnpm build:pazaak-nakama).`);
  123 |     }
  124 |   });
  125 | 
  126 |   test("two guests queue and both reach the live table", async ({ browser }) => {
  127 |     const contextA = await browser.newContext();
  128 |     const contextB = await browser.newContext();
  129 |     const pageA = await contextA.newPage();
  130 |     const pageB = await contextB.newPage();
  131 |     await seedStandaloneMatchHub(pageA);
  132 |     await seedStandaloneMatchHub(pageB);
  133 | 
  134 |     await gotoMatchHubBoth(pageA, pageB);
  135 | 
  136 |     await pageA.getByRole("button", { name: "Find Match" }).click();
  137 |     await pageB.getByRole("button", { name: "Find Match" }).click();
  138 | 
  139 |     await Promise.all([
  140 |       expect(pageA.locator('[data-testid="draw-btn"]')).toBeVisible({ timeout: 90_000 }),
  141 |       expect(pageB.locator('[data-testid="draw-btn"]')).toBeVisible({ timeout: 90_000 }),
  142 |     ]);
  143 | 
  144 |     const enabledA = await pageA.locator('[data-testid="draw-btn"]').isEnabled();
  145 |     const enabledB = await pageB.locator('[data-testid="draw-btn"]').isEnabled();
  146 |     expect(enabledA || enabledB).toBe(true);
  147 | 
  148 |     await contextA.close();
  149 |     await contextB.close();
  150 |   });
  151 | 
  152 |   test("two guests play a full match to completion (two isolated contexts)", async ({ browser }) => {
  153 |     test.setTimeout(600_000);
  154 | 
  155 |     const contextA = await browser.newContext();
  156 |     const contextB = await browser.newContext();
  157 |     const pageA = await contextA.newPage();
  158 |     const pageB = await contextB.newPage();
  159 |     await seedStandaloneMatchHub(pageA);
  160 |     await seedStandaloneMatchHub(pageB);
  161 | 
  162 |     await gotoMatchHubBoth(pageA, pageB);
  163 | 
  164 |     await pageA.getByRole("button", { name: "Find Match" }).click();
  165 |     await pageB.getByRole("button", { name: "Find Match" }).click();
  166 | 
  167 |     await Promise.all([
  168 |       expect(pageA.locator('[data-testid="draw-btn"]')).toBeVisible({ timeout: 90_000 }),
  169 |       expect(pageB.locator('[data-testid="draw-btn"]')).toBeVisible({ timeout: 90_000 }),
  170 |     ]);
  171 | 
  172 |     await playUntilBothSeeResult(pageA, pageB, 540_000);
  173 | 
  174 |     await expect(pageA.locator(".game-result")).toBeVisible();
  175 |     await expect(pageB.locator(".game-result")).toBeVisible();
  176 | 
  177 |     const textA = (await pageA.locator(".game-result").innerText()).toLowerCase();
  178 |     const textB = (await pageB.locator(".game-result").innerText()).toLowerCase();
  179 |     const aOutcome = textA.includes("you won") || textA.includes("you lost") || textA.includes("draw");
  180 |     const bOutcome = textB.includes("you won") || textB.includes("you lost") || textB.includes("draw");
  181 |     expect(aOutcome && bOutcome).toBe(true);
  182 | 
  183 |     const aWon = textA.includes("you won");
  184 |     const bWon = textB.includes("you won");
```