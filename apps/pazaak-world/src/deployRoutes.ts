/** Strip trailing slash from Vite base URL (e.g. `/pazaak-world/` → `/pazaak-world`). */
export function viteBasePath(): string {
  return (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
}

export const GITHUB_PAGES_ORIGIN = "https://oldrepublicwizard.github.io";
/** Holowan Multiplayer Pazaak Pages root. */
export const GITHUB_PAGES_SITE_ROOT = `${GITHUB_PAGES_ORIGIN}/pazaak-world`;

function resolvePagesSiteRootFromBasePath(): string {
  const b = viteBasePath();
  if (b && b !== "/") {
    return `${GITHUB_PAGES_ORIGIN}${b}`;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return GITHUB_PAGES_SITE_ROOT;
}

/** Operator / SPA deploy root. */
export function operatorConsoleRoute(): string {
  const b = viteBasePath();
  return b || "/";
}

/** Pazaak World browser route (Activity + standalone SPA). */
export function pazaakWorldRoute(): string {
  const b = viteBasePath();
  return b || "/";
}

export function pazaakWorldPublicUrl(): string {
  if (import.meta.env.PROD) {
    return resolvePagesSiteRootFromBasePath();
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}${pazaakWorldRoute()}`;
  }
  return GITHUB_PAGES_SITE_ROOT;
}
