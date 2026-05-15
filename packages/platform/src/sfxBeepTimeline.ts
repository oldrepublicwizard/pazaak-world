/**
 * Pure data for scheduling multi-hit UI beeps on an {@link AudioContext} timeline.
 * Keeps offsets out of main-thread timers (see web.dev "audio scheduling").
 */

export type SfxBeepKind = "success" | "error" | "warning";

export interface SfxBeepEvent {
  readonly offsetSec: number;
  readonly kind: SfxBeepKind;
  readonly durationMs: number;
}

/** Two ascending beeps (legacy round-win cue). */
export function roundWinBeepEvents(): readonly SfxBeepEvent[] {
  return [
    { offsetSec: 0, kind: "success", durationMs: 150 },
    { offsetSec: 0.2, kind: "success", durationMs: 150 },
  ];
}

export function roundLossBeepEvents(): readonly SfxBeepEvent[] {
  return [
    { offsetSec: 0, kind: "error", durationMs: 200 },
    { offsetSec: 0.15, kind: "error", durationMs: 150 },
  ];
}

export function bustBeepEvents(): readonly SfxBeepEvent[] {
  return [
    { offsetSec: 0, kind: "error", durationMs: 150 },
    { offsetSec: 0.1, kind: "error", durationMs: 130 },
    { offsetSec: 0.2, kind: "error", durationMs: 100 },
  ];
}

/** Two round-win pairs spaced 300ms apart (legacy victory cue). */
export function victoryBeepEvents(): readonly SfxBeepEvent[] {
  return [
    { offsetSec: 0, kind: "success", durationMs: 150 },
    { offsetSec: 0.2, kind: "success", durationMs: 150 },
    { offsetSec: 0.5, kind: "success", durationMs: 150 },
    { offsetSec: 0.7, kind: "success", durationMs: 150 },
  ];
}
