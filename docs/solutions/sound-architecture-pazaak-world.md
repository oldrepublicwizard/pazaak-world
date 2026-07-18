---
title: Web audio architecture (PazaakWorld / Cardworld)
date: 2026-05-15
tags: [pazaak-world, cardworld, web-audio, localStorage]
---

# Web audio architecture (PazaakWorld / Cardworld)

## Surfaces

| Surface | Module | Role |
|--------|--------|------|
| Global SFX + volumes + master mute | [`apps/pazaak-world/src/utils/soundManager.ts`](../../apps/pazaak-world/src/utils/soundManager.ts) (Cardworld: `apps/cardworld/...`) | Short beeps, card/round cues. One shared `AudioContext` per tab; **closed** when master sound is disabled. |
| Ambient cantina loop | [`apps/pazaak-world/src/utils/ambientAudio.ts`](../../apps/pazaak-world/src/utils/ambientAudio.ts) | Separate `AudioContext`, LFO drones, explicit **teardown** (`StopFn`). |
| Persistence | [`apps/pazaak-world/src/utils/soundUserPrefs.ts`](../../apps/pazaak-world/src/utils/soundUserPrefs.ts) | Single JSON blob per app canonical key; migrates legacy keys (see below). |
| SFX timeline data | [`packages/platform/src/sfxBeepTimeline.ts`](../../packages/platform/src/sfxBeepTimeline.ts) | Pure offsets for multi-hit cues (unit-tested). |

## Persistence model (`SoundPrefsV2`)

- **`globalSoundEnabled`** — mirrors Settings / `soundManager.setEnabled` (global SFX master).
- **`musicVolume` / `effectsVolume`** — `soundManager` gain staging.
- **`ambientMusicEnabled`** — local-practice ambient loop toggle (was `pazaak-world-music-enabled-v1`).
- **`localPracticeSfxEnabled`** — synthesized tones inside local practice only (was `pazaak-world-sound-enabled-v1`).

Canonical keys:

- PazaakWorld: `pazaak-pazaak-world-sound-v2` (migrates then **removes** `pazaak-sound-config`, `pazaak-world-music-enabled-v1`, `pazaak-world-sound-enabled-v1`).
- Cardworld: `pazaak-cardworld-sound-v2` (reads the same legacy keys once; **does not delete** `pazaak-sound-config` so PazaakWorld can still migrate it).

## Timing

Multi-hit SFX use `AudioContext.currentTime` + scheduled `GainNode` ramps (see [@pazaak/platform/sfx-timeline](../../packages/platform/src/sfxBeepTimeline.ts)), avoiding main-thread `setTimeout` jitter for musical spacing.

## Autoplay

Both paths call `AudioContext.resume()` where needed; browsers may still block audio until a user gesture — failures are swallowed intentionally.
