/**
 * Canonical browser sound preferences for PazaakWorld (single JSON blob + migration).
 *
 * Replaces three legacy keys:
 * - `pazaak-sound-config` — global SFX master + volumes (SoundManager)
 * - `pazaak-world-music-enabled-v1` — ambient music toggle (local practice)
 * - `pazaak-world-sound-enabled-v1` — SFX toggle scoped to local practice UI
 *
 * @see docs/solutions/sound-architecture-pazaak-world.md
 */

const CANONICAL_KEY = "pazaak-world-sound-v2";
const LEGACY_SOUND_CONFIG = "pazaak-sound-config";
const LEGACY_MUSIC = "pazaak-world-music-enabled-v1";
const LEGACY_LOCAL_SFX = "pazaak-world-sound-enabled-v1";

export interface SoundPrefsV2 {
  readonly version: 2;
  globalSoundEnabled: boolean;
  musicVolume: number;
  effectsVolume: number;
  /** Cantina-style ambient loop (local practice). */
  ambientMusicEnabled: boolean;
  /** Local-practice synthesized SFX (separate from global master). */
  localPracticeSfxEnabled: boolean;
}

function defaults(): SoundPrefsV2 {
  return {
    version: 2,
    globalSoundEnabled: true,
    musicVolume: 0.3,
    effectsVolume: 0.7,
    ambientMusicEnabled: false,
    localPracticeSfxEnabled: true,
  };
}

function isFinite01(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1;
}

function isSoundPrefsV2(value: unknown): value is SoundPrefsV2 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  return (
    o.version === 2
    && typeof o.globalSoundEnabled === "boolean"
    && isFinite01(o.musicVolume)
    && isFinite01(o.effectsVolume)
    && typeof o.ambientMusicEnabled === "boolean"
    && typeof o.localPracticeSfxEnabled === "boolean"
  );
}

function parseStoredBool(raw: string | null, fallback: boolean): boolean {
  if (raw === null) return fallback;
  return raw === "true";
}

function readJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function persist(prefs: SoundPrefsV2): void {
  try {
    window.localStorage.setItem(CANONICAL_KEY, JSON.stringify({ ...prefs, version: 2 as const }));
  } catch {
    /* quota / private mode */
  }
}

function migrateFromLegacy(): SoundPrefsV2 {
  const out = defaults();

  try {
    const raw = window.localStorage.getItem(LEGACY_SOUND_CONFIG);
    if (raw) {
      const parsed = readJson(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const o = parsed as Record<string, unknown>;
        if (typeof o.enabled === "boolean") out.globalSoundEnabled = o.enabled;
        if (isFinite01(o.musicVolume)) out.musicVolume = o.musicVolume;
        if (isFinite01(o.effectsVolume)) out.effectsVolume = o.effectsVolume;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    out.ambientMusicEnabled = parseStoredBool(window.localStorage.getItem(LEGACY_MUSIC), out.ambientMusicEnabled);
    out.localPracticeSfxEnabled = parseStoredBool(
      window.localStorage.getItem(LEGACY_LOCAL_SFX),
      out.localPracticeSfxEnabled,
    );
  } catch {
    /* ignore */
  }

  persist(out);

  try {
    window.localStorage.removeItem(LEGACY_SOUND_CONFIG);
    window.localStorage.removeItem(LEGACY_MUSIC);
    window.localStorage.removeItem(LEGACY_LOCAL_SFX);
  } catch {
    /* ignore */
  }

  return out;
}

/** Load prefs, migrating legacy keys once when canonical blob is missing. */
export function loadSoundPrefs(): SoundPrefsV2 {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = window.localStorage.getItem(CANONICAL_KEY);
    if (raw) {
      const parsed = readJson(raw);
      if (isSoundPrefsV2(parsed)) {
        return {
          ...defaults(),
          ...parsed,
          version: 2,
        };
      }
    }
  } catch {
    /* fall through to migrate */
  }
  return migrateFromLegacy();
}

export function patchSoundPrefs(partial: Partial<Omit<SoundPrefsV2, "version">>): SoundPrefsV2 {
  const base = loadSoundPrefs();
  const next: SoundPrefsV2 = {
    ...base,
    ...partial,
    version: 2,
  };
  persist(next);
  return next;
}

export function getAmbientMusicEnabled(): boolean {
  return loadSoundPrefs().ambientMusicEnabled;
}

export function setAmbientMusicEnabled(value: boolean): void {
  patchSoundPrefs({ ambientMusicEnabled: value });
}

export function getLocalPracticeSfxEnabled(): boolean {
  return loadSoundPrefs().localPracticeSfxEnabled;
}

export function setLocalPracticeSfxEnabled(value: boolean): void {
  patchSoundPrefs({ localPracticeSfxEnabled: value });
}
