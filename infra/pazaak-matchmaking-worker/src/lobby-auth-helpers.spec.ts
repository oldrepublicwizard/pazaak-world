import { expect, test } from "@playwright/test";

import {
  buildMatchActorCreatePayload,
  normalizeLobbyRoundAndTimerSettings,
  selectAccountByUsernameOrEmail,
} from "./lobby-auth-helpers.js";

test("selectAccountByUsernameOrEmail ignores null-email collisions", () => {
  const accounts = {
    a: {
      accountId: "a",
      username: "alpha",
      displayName: "Alpha",
      email: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      mmr: 1000,
      mmrRd: 350,
    },
    b: {
      accountId: "b",
      username: "beta",
      displayName: "Beta",
      email: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      mmr: 1000,
      mmrRd: 350,
    },
  };

  const byUsername = selectAccountByUsernameOrEmail(accounts, "beta", null);
  expect(byUsername?.accountId).toBe("b");

  const byEmailWhenNull = selectAccountByUsernameOrEmail(accounts, "missing", null);
  expect(byEmailWhenNull).toBeUndefined();
});

test("normalizeLobbyRoundAndTimerSettings preserves explicit zero timer", () => {
  const normalized = normalizeLobbyRoundAndTimerSettings({
    maxRounds: 5,
    turnTimerSeconds: 0,
  });

  expect(normalized.maxRounds).toBe(5);
  expect(normalized.turnTimerSeconds).toBe(0);
});

test("normalizeLobbyRoundAndTimerSettings clamps and defaults invalid values", () => {
  const normalized = normalizeLobbyRoundAndTimerSettings({
    maxRounds: Number.NaN,
    turnTimerSeconds: Number.POSITIVE_INFINITY,
  });

  expect(normalized.maxRounds).toBe(3);
  expect(normalized.turnTimerSeconds).toBe(45);

  const clamped = normalizeLobbyRoundAndTimerSettings({
    maxRounds: 99,
    turnTimerSeconds: -20,
  });

  expect(clamped.maxRounds).toBe(9);
  expect(clamped.turnTimerSeconds).toBe(0);
});

test("buildMatchActorCreatePayload maps lobby mutators to actor payload", () => {
  const payload = buildMatchActorCreatePayload({
    matchId: "m1",
    playerOneId: "p1",
    playerOneName: "Host",
    playerTwoId: "p2",
    playerTwoName: "Join",
    gameMode: "wacky",
    maxRounds: 7,
    turnTimerSeconds: 60,
  });

  expect(payload).toEqual({
    matchId: "m1",
    playerOneId: "p1",
    playerOneName: "Host",
    playerTwoId: "p2",
    playerTwoName: "Join",
    gameMode: "wacky",
    setsToWin: 7,
    turnTimeoutMs: 60000,
  });
});
