import type { CardWorldConfig } from "./game-mode.js";

/** Which product surface is checking the ownership gate. */
export type PazaakAccessSurface = "local_ai" | "online";

export interface PazaakAccessOptions {
  surface: PazaakAccessSurface;
  requiresOwnershipProof: boolean;
  isDiscordActivity: boolean;
  hasOwnershipProof: boolean;
}

/**
 * Holowan Multiplayer Pazaak access policy.
 *
 * - **local_ai** — always allowed (guest marketing / Pages playable slice).
 * - **online** — optional `chitin.key` only when `pazaakRequiresOwnershipProof` is true
 *   (Holowan default is false / `CARDWORLD_REQUIRE_CHITIN_KEY=0`; Discord Activity bypasses upload UX).
 */
export const isPazaakAccessAllowed = (options: PazaakAccessOptions): boolean => {
  if (options.surface === "local_ai") {
    return true;
  }

  if (!options.requiresOwnershipProof) {
    return true;
  }

  if (options.isDiscordActivity) {
    return true;
  }

  return options.hasOwnershipProof;
};

export const isPazaakAccessAllowedFromConfig = (
  surface: PazaakAccessSurface,
  config: Pick<CardWorldConfig, "pazaakRequiresOwnershipProof">,
  options: { isDiscordActivity: boolean; hasOwnershipProof: boolean },
): boolean => {
  return isPazaakAccessAllowed({
    surface,
    requiresOwnershipProof: config.pazaakRequiresOwnershipProof,
    isDiscordActivity: options.isDiscordActivity,
    hasOwnershipProof: options.hasOwnershipProof,
  });
};
