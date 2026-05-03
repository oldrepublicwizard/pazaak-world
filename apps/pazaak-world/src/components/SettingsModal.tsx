import { useState, useEffect, useCallback, useRef } from "react";
import { soundManager } from "../utils/soundManager.ts";
import type {
  PazaakCardBackStyle,
  PazaakChatAudience,
  PazaakSoundTheme,
  PazaakTableAmbience,
  PazaakTableTheme,
  PazaakUserSettings,
} from "../types.ts";

const DEFAULT_MODAL_SETTINGS: PazaakUserSettings = {
  tableTheme: "ebon-hawk",
  cardBackStyle: "classic",
  tableAmbience: "cantina",
  soundEnabled: false,
  soundTheme: "default",
  reducedMotionEnabled: false,
  turnTimerSeconds: 45,
  preferredAiDifficulty: "professional",
  confirmForfeit: true,
  highlightValidPlays: true,
  focusMode: false,
  showRatingsInGame: true,
  showGuildEmblems: true,
  showHolocronStreaks: true,
  showPostMatchDebrief: true,
  chatAudience: "everyone",
};

const SETTINGS_EQUALITY_KEYS = [
  "tableTheme",
  "cardBackStyle",
  "tableAmbience",
  "soundEnabled",
  "soundTheme",
  "reducedMotionEnabled",
  "turnTimerSeconds",
  "preferredAiDifficulty",
  "confirmForfeit",
  "highlightValidPlays",
  "focusMode",
  "showRatingsInGame",
  "showGuildEmblems",
  "showHolocronStreaks",
  "showPostMatchDebrief",
  "chatAudience",
] as const satisfies readonly (keyof PazaakUserSettings)[];

const areSettingsEqual = (left: PazaakUserSettings, right: PazaakUserSettings): boolean => {
  return SETTINGS_EQUALITY_KEYS.every((key) => left[key] === right[key]);
};

interface SettingsModalProps {
  isOpen: boolean;
  currentSettings: PazaakUserSettings;
  onClose: () => void;
  onSave: (settings: PazaakUserSettings) => Promise<void>;
}

export function SettingsModal({ isOpen, currentSettings, onClose, onSave }: SettingsModalProps) {
  const [settings, setSettings] = useState<PazaakUserSettings>(currentSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const hasChanges = !areSettingsEqual(settings, currentSettings);

  const requestClose = useCallback(() => {
    if (!isSaving) {
      onClose();
    }
  }, [isSaving, onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSettings(currentSettings);
    setSaveError(null);
  }, [currentSettings, isOpen]);

  // Escape to close + focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isSaving) {
          requestClose();
        }
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        if (!isSaving && hasChanges) {
          event.preventDefault();
          void handleSave();
        }
        return;
      }

      if (event.key !== "Tab") return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusable = Array.from(
        modal.querySelectorAll<HTMLElement>(
          "button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex=\"-1\"])"
        )
      );
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !modal.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !modal.contains(active ?? document.body)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Auto-focus first focusable element when modal opens
    const rafId = requestAnimationFrame(() => {
      const modal = modalRef.current;
      if (!modal) return;
      const first = modal.querySelector<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled])"
      );
      first?.focus();
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.cancelAnimationFrame(rafId);
    };
  }, [hasChanges, isOpen, isSaving, requestClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(settings);
      soundManager.beep("success", 150);
      requestClose();
    } catch (error) {
      soundManager.playErrorSound();
      console.error("Failed to save settings:", error);
      setSaveError("Could not save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, onSave, requestClose, settings]);

  const handleResetDefaults = () => {
    setSettings(DEFAULT_MODAL_SETTINGS);
    setSaveError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={requestClose} role="presentation">
      <div
        ref={modalRef}
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        aria-busy={isSaving}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-modal-header">
          <h2 id="settings-modal-title">Settings</h2>
          <button
            className="settings-modal-close"
            onClick={requestClose}
            aria-label="Close settings"
            disabled={isSaving}
          >
            ✕
          </button>
        </div>

        <div className="settings-modal-content">
          {/* Theme Selection */}
          <div className="settings-group">
            <label htmlFor="theme-select">Table theme</label>
            <select
              id="theme-select"
              value={settings.tableTheme}
              onChange={(e) => setSettings({ ...settings, tableTheme: e.target.value as PazaakTableTheme })}
            >
              <option value="ebon-hawk">Ebon Hawk</option>
              <option value="coruscant">Coruscant</option>
              <option value="tatooine">Tatooine</option>
              <option value="manaan">Manaan</option>
              <option value="dantooine">Dantooine</option>
              <option value="malachor">Malachor</option>
            </select>
          </div>

          <div className="settings-group">
            <label htmlFor="card-back-select">Card back</label>
            <select
              id="card-back-select"
              value={settings.cardBackStyle}
              onChange={(e) =>
                setSettings({ ...settings, cardBackStyle: e.target.value as PazaakCardBackStyle })
              }
            >
              <option value="classic">Classic</option>
              <option value="holographic">Holographic</option>
              <option value="mandalorian">Mandalorian</option>
              <option value="republic">Republic</option>
              <option value="sith">Sith</option>
            </select>
          </div>

          <div className="settings-group">
            <label htmlFor="ambience-select">Table ambience</label>
            <select
              id="ambience-select"
              value={settings.tableAmbience}
              onChange={(e) =>
                setSettings({ ...settings, tableAmbience: e.target.value as PazaakTableAmbience })
              }
            >
              <option value="cantina">Cantina</option>
              <option value="ebon-hawk">Ebon Hawk</option>
              <option value="jedi-archives">Jedi Archives</option>
              <option value="outer-rim">Outer Rim</option>
              <option value="sith-sanctum">Sith Sanctum</option>
            </select>
          </div>

          {/* Sound Settings */}
          <div className="settings-group">
            <label htmlFor="sound-theme-select">Sound theme</label>
            <select
              id="sound-theme-select"
              value={settings.soundTheme}
              onChange={(e) =>
                setSettings({ ...settings, soundTheme: e.target.value as PazaakSoundTheme })
              }
            >
              <option value="default">Default</option>
              <option value="cantina">Cantina</option>
              <option value="droid">Droid</option>
              <option value="force">Force</option>
            </select>
          </div>

          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => {
                  setSettings({ ...settings, soundEnabled: e.target.checked });
                  soundManager.setEnabled(e.target.checked);
                }}
              />
              Enable Sound Effects
            </label>
          </div>

          {/* Reduced Motion */}
          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={settings.reducedMotionEnabled}
                onChange={(e) => setSettings({ ...settings, reducedMotionEnabled: e.target.checked })}
              />
              Reduced Motion (accessibility)
            </label>
          </div>

          {/* Turn Timer */}
          <div className="settings-group">
            <label htmlFor="timer-select">Turn Timer (seconds)</label>
            <select
              id="timer-select"
              value={settings.turnTimerSeconds}
              onChange={(e) => setSettings({ ...settings, turnTimerSeconds: parseInt(e.target.value) })}
            >
              <option value="30">30 seconds</option>
              <option value="45">45 seconds</option>
              <option value="60">60 seconds</option>
              <option value="90">90 seconds</option>
              <option value="120">120 seconds</option>
            </select>
          </div>

          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={settings.confirmForfeit}
                onChange={(e) => setSettings({ ...settings, confirmForfeit: e.target.checked })}
              />
              Confirm before forfeit
            </label>
          </div>

          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={settings.highlightValidPlays}
                onChange={(e) => setSettings({ ...settings, highlightValidPlays: e.target.checked })}
              />
              Highlight valid plays
            </label>
          </div>

          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={settings.focusMode}
                onChange={(e) => setSettings({ ...settings, focusMode: e.target.checked })}
              />
              Focus mode (minimal HUD)
            </label>
          </div>

          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={settings.showRatingsInGame}
                onChange={(e) => setSettings({ ...settings, showRatingsInGame: e.target.checked })}
              />
              Show ratings in game
            </label>
            <p className="settings-field-hint" style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.78 }}>
              Chess.com publishes the <strong>Glicko</strong> family (not pure Elo): a displayed rating plus <strong>rating deviation (RD)</strong> so upsets and provisional accounts can move more while the system is uncertain. PazaakWorld uses the same ideas—expected score from the MMR gap plus per-player RD—with a compact single-game update. See{" "}
              <a href="https://support.chess.com/en/articles/8566476-how-do-ratings-work-on-chess-com" target="_blank" rel="noreferrer">
                How do ratings work on Chess.com?
              </a>
              {" "}and <code>wiki/apps/pazaak-world/ratings.md</code>.
            </p>
          </div>

          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={settings.showGuildEmblems}
                onChange={(e) => setSettings({ ...settings, showGuildEmblems: e.target.checked })}
              />
              Show guild emblems
            </label>
          </div>

          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={settings.showHolocronStreaks}
                onChange={(e) => setSettings({ ...settings, showHolocronStreaks: e.target.checked })}
              />
              Show Holocron streaks
            </label>
          </div>

          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={settings.showPostMatchDebrief}
                onChange={(e) => setSettings({ ...settings, showPostMatchDebrief: e.target.checked })}
              />
              Show post-match debrief
            </label>
          </div>

          <div className="settings-group">
            <label htmlFor="chat-audience-select">Chat audience</label>
            <select
              id="chat-audience-select"
              value={settings.chatAudience}
              onChange={(e) =>
                setSettings({ ...settings, chatAudience: e.target.value as PazaakChatAudience })
              }
            >
              <option value="everyone">Everyone</option>
              <option value="guild">Guild only</option>
              <option value="silent">Silent</option>
            </select>
          </div>

          {/* AI Difficulty */}
          <div className="settings-group">
            <label htmlFor="ai-difficulty-select">Default AI Difficulty</label>
            <select
              id="ai-difficulty-select"
              value={settings.preferredAiDifficulty}
              onChange={(e) => setSettings({ ...settings, preferredAiDifficulty: e.target.value as PazaakUserSettings["preferredAiDifficulty"] })}
            >
              <option value="easy">Easy</option>
              <option value="hard">Hard</option>
              <option value="professional">Professional</option>
            </select>
          </div>

          {/* Info Section */}
          <div className="settings-info">
            <h3>About</h3>
            <p>Pazaak World v0.1</p>
            <p>The legendary card game from Knights of the Old Republic</p>
          </div>
        </div>

        {saveError ? (
          <p className="settings-modal-error" role="status" aria-live="polite">{saveError}</p>
        ) : null}

        <p className="settings-modal-hint" aria-live="off">Tip: press Ctrl+Enter to save quickly.</p>

        <div className="settings-modal-footer">
          <button
            className="settings-modal-reset"
            onClick={handleResetDefaults}
            disabled={isSaving || areSettingsEqual(settings, DEFAULT_MODAL_SETTINGS)}
          >
            Reset Defaults
          </button>
          <button
            className="settings-modal-cancel"
            onClick={requestClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="settings-modal-save"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
