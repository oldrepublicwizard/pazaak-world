/**
 * Global sound effects for Pazaak World (Web Audio API).
 *
 * Scheduling uses {@link AudioContext} clock time — not main-thread `setTimeout` alone —
 * for multi-hit SFX so timing survives modest UI thread jitter.
 *
 * Ambient cantina music lives in {@link ./ambientAudio.ts} (separate graph + teardown).
 */

import type { SfxBeepEvent } from "@pazaak/platform/sfx-timeline";
import {
  bustBeepEvents,
  roundLossBeepEvents,
  roundWinBeepEvents,
  victoryBeepEvents,
} from "@pazaak/platform/sfx-timeline";
import { loadSoundPrefs, patchSoundPrefs } from "./soundUserPrefs.ts";

interface SoundConfig {
  enabled: boolean;
  musicVolume: number;
  effectsVolume: number;
}

type AudioContextConstructor = new () => AudioContext;

interface AudioWindow extends Window {
  webkitAudioContext?: AudioContextConstructor;
}

type BeepType = SfxBeepEvent["kind"];

function frequencyForBeep(type: BeepType): number {
  switch (type) {
    case "success":
      return 1200;
    case "error":
      return 400;
    case "warning":
    default:
      return 800;
  }
}

class SoundManager {
  private config: SoundConfig = {
    enabled: true,
    musicVolume: 0.3,
    effectsVolume: 0.7,
  };

  private audioContext: AudioContext | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const prefs = loadSoundPrefs();
    this.config = {
      enabled: prefs.globalSoundEnabled,
      musicVolume: prefs.musicVolume,
      effectsVolume: prefs.effectsVolume,
    };
  }

  private getAudioContextCtor(): AudioContextConstructor | null {
    return window.AudioContext ?? (window as AudioWindow).webkitAudioContext ?? null;
  }

  /** Lazily create (or recreate) the shared context after teardown. */
  private ensureContext(): AudioContext | null {
    if (this.audioContext?.state === "closed") {
      this.audioContext = null;
    }
    if (this.audioContext) {
      return this.audioContext;
    }
    const Ctor = this.getAudioContextCtor();
    if (!Ctor) return null;
    try {
      this.audioContext = new Ctor();
    } catch {
      return null;
    }
    return this.audioContext;
  }

  /**
   * Schedule one beep envelope starting at `when` on the audio timeline (seconds).
   */
  private scheduleBeepAt(ctx: AudioContext, when: number, type: BeepType, durationMs: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequencyForBeep(type);
    const dur = durationMs / 1000;
    const peak = this.config.effectsVolume * 0.8;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.01);
    gain.gain.linearRampToValueAtTime(0, when + dur);
    osc.start(when);
    osc.stop(when + dur);
  }

  /**
   * Play a beep sound effect.
   * @param type success | error | warning (controls pitch)
   * @param duration duration in ms
   */
  beep(type: BeepType = "warning", duration = 200) {
    if (!this.config.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    void ctx.resume().catch(() => {});
    this.scheduleBeepAt(ctx, ctx.currentTime, type, duration);
  }

  /**
   * Schedule multiple beeps on the audio clock (offsets in seconds from `anchorTime`).
   */
  private scheduleBeepSequence(
    events: readonly { offsetSec: number; type: BeepType; durationMs: number }[],
    anchorTime?: number,
  ) {
    if (!this.config.enabled || events.length === 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    void ctx.resume().catch(() => {});
    const t0 = anchorTime ?? ctx.currentTime;
    for (const ev of events) {
      this.scheduleBeepAt(ctx, t0 + ev.offsetSec, ev.type, ev.durationMs);
    }
  }

  private scheduleFromTimeline(events: readonly SfxBeepEvent[], anchorTime?: number) {
    this.scheduleBeepSequence(
      events.map((e) => ({ offsetSec: e.offsetSec, type: e.kind, durationMs: e.durationMs })),
      anchorTime,
    );
  }

  /**
   * Play a card play sound effect
   */
  playCardSound() {
    this.beep("success", 150);
  }

  /**
   * Play a stand sound effect
   */
  playStandSound() {
    this.beep("warning", 250);
  }

  /**
   * Play a draw/turn sound effect
   */
  playDrawSound() {
    this.beep("success", 100);
  }

  /**
   * Play a round win sound
   */
  playRoundWinSound() {
    this.scheduleFromTimeline(roundWinBeepEvents());
  }

  /**
   * Play a round loss sound
   */
  playRoundLossSound() {
    this.scheduleFromTimeline(roundLossBeepEvents());
  }

  /**
   * Play a bust/bust sound
   */
  playBustSound() {
    this.scheduleFromTimeline(bustBeepEvents());
  }

  /** Two ascending pairs spaced like the legacy `setTimeout(..., 300)` victory cue. */
  playVictorySound() {
    this.scheduleFromTimeline(victoryBeepEvents());
  }

  /**
   * Play an error sound (e.g., auth failure)
   */
  playErrorSound() {
    this.beep("error", 500);
  }

  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    patchSoundPrefs({ globalSoundEnabled: enabled });
    if (!enabled) {
      const ctx = this.audioContext;
      this.audioContext = null;
      void ctx?.close().catch(() => {});
    }
  }

  setMusicVolume(volume: number) {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    patchSoundPrefs({ musicVolume: this.config.musicVolume });
  }

  setEffectsVolume(volume: number) {
    this.config.effectsVolume = Math.max(0, Math.min(1, volume));
    patchSoundPrefs({ effectsVolume: this.config.effectsVolume });
  }

  getConfig() {
    return { ...this.config };
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Convenience standalone exports used by card game components
export const playDrawSound = () => soundManager.playDrawSound();
export const playPositiveSound = () => soundManager.playRoundWinSound();
export const playNegativeSound = () => soundManager.playRoundLossSound();
export const playVictorySound = () => soundManager.playVictorySound();
