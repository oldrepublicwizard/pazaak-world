import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bustBeepEvents,
  roundLossBeepEvents,
  roundWinBeepEvents,
  victoryBeepEvents,
} from "./sfxBeepTimeline.js";

test("roundWinBeepEvents are monotonic and spaced", () => {
  const ev = roundWinBeepEvents();
  assert.equal(ev.length, 2);
  assert.ok(ev[0]!.offsetSec < ev[1]!.offsetSec);
  assert.equal(ev[0]!.kind, "success");
});

test("bustBeepEvents has three descending-timing hits", () => {
  const ev = bustBeepEvents();
  assert.equal(ev.length, 3);
  assert.ok(ev.every((e) => e.kind === "error"));
});

test("victoryBeepEvents covers two pairs", () => {
  const ev = victoryBeepEvents();
  assert.equal(ev.length, 4);
  const gaps = [ev[1]!.offsetSec - ev[0]!.offsetSec, ev[3]!.offsetSec - ev[2]!.offsetSec];
  assert.ok(gaps.every((g) => g > 0));
});

test("roundLossBeepEvents offsets stay ordered", () => {
  const ev = roundLossBeepEvents();
  assert.equal(ev.length, 2);
  assert.ok(ev[1]!.offsetSec > ev[0]!.offsetSec);
});
