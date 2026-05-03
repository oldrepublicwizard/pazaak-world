import type {
  AdvisorDifficulty,
  LeaderboardEntry,
  MatchmakingQueueRecord,
  PazaakGameMode,
  PazaakOpponentProfileRecord,
  PazaakLobbyRecord,
  PazaakMatchHistoryRecord,
  PazaakTableSettings,
  PazaakUserSettings,
  SavedSideboardCollectionRecord,
  SerializedMatch,
  SideCardOption,
  SwissStandingsRowRecord,
  TournamentBracketViewRecord,
  TournamentFormat,
  TournamentStateRecord,
  WalletRecord,
} from "./types.ts";
import {
  createBrowserApiClient,
  parseConfiguredBases,
  resolveBrowserApiBases,
  subscribeToReconnectingWebSocket,
  type RealtimeConnectionState,
} from "@openkotor/platform/browser";
import { SOCIAL_AUTH_PROVIDERS, type CardWorldConfig, type SocialAuthProvider } from "@openkotor/platform";

export type { SocialAuthProvider };

export interface PazaakAccountRecord {
  accountId: string;
  username: string;
  displayName: string;
  email: string | null;
  legacyGameUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PazaakLinkedIdentityRecord {
  provider: "discord";
  providerUserId: string;
  accountId: string;
  username: string;
  displayName: string;
  linkedAt: string;
  updatedAt: string;
}

export interface PazaakAccountSessionRecord {
  sessionId: string;
  accountId: string;
  label: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export interface AuthSessionResponse {
  app_token: string;
  token_type: "Bearer";
  account: PazaakAccountRecord;
  session: PazaakAccountSessionRecord;
  linkedIdentities: PazaakLinkedIdentityRecord[];
}

export interface SocialAuthProviderConfig {
  provider: SocialAuthProvider;
  enabled: boolean;
}

export interface SocialAuthProviderListResponse {
  providers: SocialAuthProviderConfig[];
}

export interface SocialAuthStartResponse {
  provider: SocialAuthProvider;
  redirectUrl: string;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

const apiClient = createBrowserApiClient({
  apiBases: resolveBrowserApiBases({
    configuredBases: parseConfiguredBases(import.meta.env.VITE_API_BASES),
    localApiPort: 4001,
  }),
});

const apiFetch = apiClient.requestJsonWithBearer;
const apiPublicFetch = apiClient.requestJson;
const apiPublicOptionalFetch = apiClient.requestOptionalJson;

// ---------------------------------------------------------------------------
// Public API client
// ---------------------------------------------------------------------------

export interface MatchResponse {
  match: SerializedMatch;
}

export interface SideboardsResponse {
  sideboards: SavedSideboardCollectionRecord;
}

export interface MeResponse {
  user: { id: string; username: string; displayName: string };
  wallet: WalletRecord;
  queue: MatchmakingQueueRecord | null;
  match: SerializedMatch | null;
}

export interface SettingsResponse {
  settings: PazaakUserSettings;
  wallet?: WalletRecord;
}

export interface LeaderboardResponse {
  leaders: LeaderboardEntry[];
}

export interface HistoryResponse {
  history: PazaakMatchHistoryRecord[];
}

export interface OpponentsResponse {
  opponents: PazaakOpponentProfileRecord[];
  serverTime: string;
}

const DEFAULT_CARDWORLD_CONFIG: CardWorldConfig = {
  botGameType: "pazaak",
  defaultPublicGameType: "blackjack",
  pazaakRequiresOwnershipProof: true,
  acceptedOwnershipProofFilenames: ["chitin.key"],
};

export interface QueueResponse {
  queue: MatchmakingQueueRecord | null;
}

export interface MatchmakingStatsResponse {
  playersInQueue: number;
  openLobbies: number;
  activeGames: number;
  averageWaitSeconds: number;
  averageWaitTime: string;
  queueUpdatedAt: string;
}

export interface LobbiesResponse {
  lobbies: PazaakLobbyRecord[];
}

export interface LobbyResponse {
  lobby: PazaakLobbyRecord | null;
  match?: SerializedMatch;
}

export interface TraskSourceRecord {
  id: string;
  name: string;
  kind: "website" | "github" | "discord";
  homeUrl: string;
  description: string;
  freshnessPolicy: string;
}

export interface TraskQueryRecord {
  queryId: string;
  userId: string;
  query: string;
  status: "pending" | "complete" | "failed";
  answer: string | null;
  sources: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/me", accessToken);
}

/** Public ops subset (time presets, regions, flags) — no auth. */
export interface PublicPazaakConfig {
  version: 1;
  timers: { turnTimerSeconds: number };
  matchmaking: {
    regions: Array<{ id: string; label: string; locationHint?: string }>;
    defaultRegionId: string;
  };
  timeControls: {
    presets: Array<{ id: string; label: string; turnSeconds: number; incrementSeconds?: number }>;
  };
  features: { blackjackOnlineEnabled: boolean; allowPrivateBackendUrl: boolean };
}

export async function fetchPublicPazaakConfig(): Promise<PublicPazaakConfig | null> {
  return apiPublicOptionalFetch<PublicPazaakConfig>("/api/config/public");
}

export async function fetchAdminPolicy(accessToken: string): Promise<{ policy: unknown; etag: string | null }> {
  return apiFetch<{ policy: unknown; etag: string | null }>("/api/admin/policy", accessToken);
}

export async function putAdminPolicy(accessToken: string, patch: unknown): Promise<{ ok: true; etag: string }> {
  return apiFetch<{ ok: true; etag: string }>("/api/admin/policy", accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function fetchBlackjackRules(accessToken: string): Promise<{ blackjack: unknown }> {
  return apiFetch<{ blackjack: unknown }>("/api/blackjack/rules", accessToken);
}

export interface CrateOpenResponse {
  wallet: WalletRecord;
  opened: { tokens: string[]; bonusCredits: number };
  kind: "standard" | "premium";
}

export async function openRewardCrate(accessToken: string, kind: "standard" | "premium"): Promise<CrateOpenResponse> {
  return apiFetch<CrateOpenResponse>("/api/crates/open", accessToken, {
    method: "POST",
    body: JSON.stringify({ kind }),
  });
}

export async function registerAccount(input: {
  username: string;
  displayName?: string;
  email?: string;
  password: string;
}): Promise<AuthSessionResponse> {
  return apiPublicFetch<AuthSessionResponse>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function loginAccount(identifier: string, password: string): Promise<AuthSessionResponse> {
  return apiPublicFetch<AuthSessionResponse>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
}

export async function fetchSocialAuthProviders(): Promise<SocialAuthProviderListResponse> {
  const body = await apiPublicOptionalFetch<SocialAuthProviderListResponse>("/api/auth/oauth/providers");
  return body ?? {
    providers: SOCIAL_AUTH_PROVIDERS.map((provider: SocialAuthProvider) => ({ provider, enabled: false })),
  };
}

export async function startSocialAuth(provider: SocialAuthProvider, matchId?: string): Promise<SocialAuthStartResponse> {
  return apiPublicFetch<SocialAuthStartResponse>(`/api/auth/oauth/${encodeURIComponent(provider)}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: matchId ? JSON.stringify({ matchId }) : undefined,
  });
}

export async function fetchAuthSession(accessToken: string): Promise<{
  account: PazaakAccountRecord;
  linkedIdentities: PazaakLinkedIdentityRecord[];
}> {
  return apiFetch("/api/auth/session", accessToken);
}

export async function logoutAccount(accessToken: string): Promise<void> {
  await apiFetch<{ ok: true }>("/api/auth/logout", accessToken, { method: "POST" });
}

export async function fetchSettings(accessToken: string): Promise<PazaakUserSettings> {
  const data = await apiFetch<SettingsResponse>("/api/settings", accessToken);
  return data.settings;
}

export async function updateSettings(
  accessToken: string,
  settings: Partial<PazaakUserSettings>,
): Promise<PazaakUserSettings> {
  const data = await apiFetch<SettingsResponse>("/api/settings", accessToken, {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  return data.settings;
}

export async function fetchLeaderboard(accessToken: string): Promise<LeaderboardEntry[]> {
  const data = await apiFetch<LeaderboardResponse>("/api/leaderboard", accessToken);
  return data.leaders;
}

export async function fetchHistory(accessToken: string, limit = 25): Promise<PazaakMatchHistoryRecord[]> {
  const data = await apiFetch<HistoryResponse>(`/api/me/history?limit=${encodeURIComponent(String(limit))}`, accessToken);
  return data.history;
}

export async function fetchPazaakOpponents(): Promise<PazaakOpponentProfileRecord[]> {
  const body = await apiPublicOptionalFetch<OpponentsResponse>("/api/pazaak/opponents");
  return body?.opponents ?? [];
}

export async function fetchCardWorldConfig(): Promise<CardWorldConfig> {
  const body = await apiPublicOptionalFetch<CardWorldConfig>("/api/cardworld/config");
  return body ?? DEFAULT_CARDWORLD_CONFIG;
}

export async function enqueueMatchmaking(
  accessToken: string,
  preferredMaxPlayers = 2,
  preferredRegions?: string[],
): Promise<MatchmakingQueueRecord | null> {
  const data = await apiFetch<QueueResponse>("/api/matchmaking/enqueue", accessToken, {
    method: "POST",
    body: JSON.stringify({
      preferredMaxPlayers,
      ...(preferredRegions?.length ? { preferredRegions } : {}),
    }),
  });
  return data.queue;
}

export async function leaveMatchmaking(accessToken: string): Promise<boolean> {
  const data = await apiFetch<{ removed: boolean }>("/api/matchmaking/leave", accessToken, { method: "POST" });
  return data.removed;
}

export async function fetchMatchmakingStatus(accessToken: string): Promise<MatchmakingQueueRecord | null> {
  const data = await apiFetch<QueueResponse>("/api/matchmaking/status", accessToken);
  return data.queue;
}

export async function fetchMatchmakingStats(accessToken: string): Promise<MatchmakingStatsResponse> {
  return apiFetch<MatchmakingStatsResponse>("/api/matchmaking/stats", accessToken);
}

export async function fetchLobbies(accessToken: string): Promise<PazaakLobbyRecord[]> {
  const data = await apiFetch<LobbiesResponse>("/api/lobbies", accessToken);
  return data.lobbies;
}

export async function createLobby(
  accessToken: string,
  input: {
    name?: string;
    maxPlayers?: number;
    password?: string;
    variant?: "canonical" | "multi_seat";
    tableSettings?: Partial<PazaakTableSettings>;
    maxRounds?: number;
    turnTimerSeconds?: number;
    ranked?: boolean;
    allowAiFill?: boolean;
    sideboardMode?: "runtime_random" | "player_active_custom" | "host_mirror_custom";
    gameMode?: PazaakGameMode;
  },
): Promise<PazaakLobbyRecord> {
  const data = await apiFetch<LobbyResponse>("/api/lobbies", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!data.lobby) throw new Error("Lobby was not created.");
  return data.lobby;
}

export async function joinLobby(accessToken: string, lobbyId: string, password?: string): Promise<PazaakLobbyRecord> {
  const data = await apiFetch<LobbyResponse>(`/api/lobbies/${encodeURIComponent(lobbyId)}/join`, accessToken, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  if (!data.lobby) throw new Error("Lobby was not joined.");
  return data.lobby;
}

export async function joinLobbyByCode(accessToken: string, lobbyCode: string, password?: string): Promise<PazaakLobbyRecord> {
  const data = await apiFetch<LobbyResponse>("/api/lobbies/join-by-code", accessToken, {
    method: "POST",
    body: JSON.stringify({ lobbyCode, password }),
  });
  if (!data.lobby) throw new Error("Lobby was not joined.");
  return data.lobby;
}

export async function setLobbyReady(accessToken: string, lobbyId: string, ready: boolean): Promise<PazaakLobbyRecord> {
  const data = await apiFetch<LobbyResponse>(`/api/lobbies/${encodeURIComponent(lobbyId)}/ready`, accessToken, {
    method: "POST",
    body: JSON.stringify({ ready }),
  });
  if (!data.lobby) throw new Error("Lobby was not updated.");
  return data.lobby;
}

export async function setLobbyStatus(accessToken: string, lobbyId: string, status: "waiting" | "matchmaking"): Promise<PazaakLobbyRecord> {
  const data = await apiFetch<LobbyResponse>(`/api/lobbies/${encodeURIComponent(lobbyId)}/status`, accessToken, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
  if (!data.lobby) throw new Error("Lobby status was not updated.");
  return data.lobby;
}

export async function updateLobbyAiDifficulty(accessToken: string, lobbyId: string, aiUserId: string, difficulty: AdvisorDifficulty): Promise<PazaakLobbyRecord> {
  const data = await apiFetch<LobbyResponse>(`/api/lobbies/${encodeURIComponent(lobbyId)}/ai/${encodeURIComponent(aiUserId)}/difficulty`, accessToken, {
    method: "POST",
    body: JSON.stringify({ difficulty }),
  });
  if (!data.lobby) throw new Error("Lobby AI seat was not updated.");
  return data.lobby;
}

export async function addLobbyAi(accessToken: string, lobbyId: string, difficulty: AdvisorDifficulty): Promise<PazaakLobbyRecord> {
  const data = await apiFetch<LobbyResponse>(`/api/lobbies/${encodeURIComponent(lobbyId)}/addAi`, accessToken, {
    method: "POST",
    body: JSON.stringify({ difficulty }),
  });
  if (!data.lobby) throw new Error("AI seat was not added.");
  return data.lobby;
}

export async function leaveLobby(accessToken: string, lobbyId: string): Promise<PazaakLobbyRecord | null> {
  const data = await apiFetch<LobbyResponse>(`/api/lobbies/${encodeURIComponent(lobbyId)}/leave`, accessToken, { method: "POST" });
  return data.lobby;
}

export async function startLobby(accessToken: string, lobbyId: string): Promise<{ lobby: PazaakLobbyRecord; match: SerializedMatch }> {
  const data = await apiFetch<LobbyResponse>(`/api/lobbies/${encodeURIComponent(lobbyId)}/start`, accessToken, { method: "POST" });
  if (!data.lobby || !data.match) throw new Error("Lobby did not start a match.");
  return { lobby: data.lobby, match: data.match };
}

/** Fetch the caller's active match, or null if none exists. */
export async function fetchMyMatch(accessToken: string): Promise<SerializedMatch | null> {
  try {
    const data = await apiFetch<MatchResponse>("/api/match/me", accessToken);
    return data.match;
  } catch (err) {
    if (err instanceof Error && err.message.includes("No active match")) return null;
    throw err;
  }
}

/** Fetch a match by ID. */
export async function fetchMatch(matchId: string, accessToken: string): Promise<SerializedMatch | null> {
  try {
    const data = await apiFetch<MatchResponse>(`/api/match/${matchId}`, accessToken);
    return data.match;
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) return null;
    throw err;
  }
}

export async function fetchSideboards(accessToken: string): Promise<SavedSideboardCollectionRecord> {
  const data = await apiFetch<SideboardsResponse>("/api/sideboards", accessToken);
  return data.sideboards;
}

export async function saveSideboard(
  name: string,
  tokens: string[],
  accessToken: string,
  makeActive = true,
): Promise<SavedSideboardCollectionRecord> {
  const data = await apiFetch<SideboardsResponse>(`/api/sideboards/${encodeURIComponent(name)}`, accessToken, {
    method: "PUT",
    body: JSON.stringify({ tokens, makeActive }),
  });
  return data.sideboards;
}

export async function setActiveSideboard(name: string, accessToken: string): Promise<SavedSideboardCollectionRecord> {
  const data = await apiFetch<SideboardsResponse>("/api/sideboards/active", accessToken, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return data.sideboards;
}

export async function deleteSideboard(name: string, accessToken: string): Promise<SavedSideboardCollectionRecord> {
  const data = await apiFetch<SideboardsResponse>(`/api/sideboards/${encodeURIComponent(name)}`, accessToken, {
    method: "DELETE",
  });
  return data.sideboards;
}

export async function fetchTraskSources(accessToken: string): Promise<TraskSourceRecord[]> {
  const data = await apiFetch<{ sources: TraskSourceRecord[] }>("/api/trask/sources", accessToken);
  return data.sources;
}

export async function probeTraskAvailable(accessToken: string): Promise<boolean> {
  try {
    await fetchTraskSources(accessToken);
    return true;
  } catch {
    return false;
  }
}

export async function fetchTraskHistory(accessToken: string, limit = 25): Promise<TraskQueryRecord[]> {
  const data = await apiFetch<{ history: TraskQueryRecord[] }>(`/api/trask/history?limit=${encodeURIComponent(String(limit))}`, accessToken);
  return data.history;
}

export async function askTrask(accessToken: string, query: string): Promise<TraskQueryRecord> {
  const data = await apiFetch<{ query: TraskQueryRecord }>("/api/trask/ask", accessToken, {
    method: "POST",
    body: JSON.stringify({ query }),
  });
  return data.query;
}

export async function draw(matchId: string, accessToken: string): Promise<SerializedMatch> {
  const data = await apiFetch<MatchResponse>(`/api/match/${matchId}/draw`, accessToken, { method: "POST" });
  return data.match;
}

export async function stand(matchId: string, accessToken: string): Promise<SerializedMatch> {
  const data = await apiFetch<MatchResponse>(`/api/match/${matchId}/stand`, accessToken, { method: "POST" });
  return data.match;
}

export async function endTurn(matchId: string, accessToken: string): Promise<SerializedMatch> {
  const data = await apiFetch<MatchResponse>(`/api/match/${matchId}/endturn`, accessToken, { method: "POST" });
  return data.match;
}

export async function playSideCard(
  matchId: string,
  accessToken: string,
  option: SideCardOption,
): Promise<SerializedMatch> {
  const data = await apiFetch<MatchResponse>(`/api/match/${matchId}/play`, accessToken, {
    method: "POST",
    body: JSON.stringify({ cardId: option.cardId, appliedValue: option.appliedValue }),
  });
  return data.match;
}

export async function forfeit(matchId: string, accessToken: string): Promise<SerializedMatch> {
  const data = await apiFetch<MatchResponse>(`/api/match/${matchId}/forfeit`, accessToken, { method: "POST" });
  return data.match;
}

// ---------------------------------------------------------------------------
// WebSocket subscription
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  matchId: string;
  userId: string;
  displayName: string;
  text: string;
  at: number;
}

export type MatchUpdateHandler = (match: SerializedMatch) => void;

export type MatchSocketConnectionState = RealtimeConnectionState;

export interface MatchSubscriptionOptions {
  reconnect?: boolean;
  maxDelayMs?: number;
  onConnectionChange?: (state: MatchSocketConnectionState) => void;
  onChatMessage?: (msg: ChatMessage) => void;
}

interface MatchUpdateWsMessage {
  type: "match_update";
  data: SerializedMatch;
}

interface ChatWsMessage {
  type: "chat_message";
  data: ChatMessage;
}

type WsMessage = MatchUpdateWsMessage | ChatWsMessage;

interface LobbyWsMessage {
  type: "lobby_update" | "lobby_list_update";
  data: PazaakLobbyRecord | PazaakLobbyRecord[];
}

/**
 * Opens a WebSocket connection that listens for live match updates.
 * Returns an unsubscribe function.
 */
export function subscribeToMatch(matchId: string, onUpdate: MatchUpdateHandler, options: MatchSubscriptionOptions = {}): () => void {
  return subscribeToReconnectingWebSocket<WsMessage>({
    createUrl: () => `${apiClient.resolveWebSocketBase()}/ws?matchId=${encodeURIComponent(matchId)}`,
    reconnect: options.reconnect,
    maxDelayMs: options.maxDelayMs,
    onConnectionChange: options.onConnectionChange,
    onMessage: (msg: WsMessage) => {
      if (msg.type === "match_update") {
        onUpdate(msg.data);
      } else if (msg.type === "chat_message") {
        options.onChatMessage?.(msg.data);
      }
    },
  });
}

export type LobbyUpdateHandler = () => void;

/**
 * Opens a WebSocket connection for lobby updates.
 * Emits callback whenever lobby state changes server-side.
 */
export function subscribeToLobbies(onUpdate: LobbyUpdateHandler, options: MatchSubscriptionOptions = {}): () => void {
  return subscribeToReconnectingWebSocket<LobbyWsMessage>({
    createUrl: () => `${apiClient.resolveWebSocketBase()}/ws?stream=lobbies`,
    reconnect: options.reconnect,
    maxDelayMs: options.maxDelayMs,
    onConnectionChange: options.onConnectionChange,
    onMessage: (msg: LobbyWsMessage) => {
      if (msg.type === "lobby_update" || msg.type === "lobby_list_update") {
        onUpdate();
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Tournaments
// ---------------------------------------------------------------------------

export interface TournamentsListResponse {
  tournaments: TournamentStateRecord[];
}

export interface TournamentDetailResponse {
  tournament: TournamentStateRecord;
  bracket: TournamentBracketViewRecord;
  standings: SwissStandingsRowRecord[] | null;
}

export interface CreateTournamentInput {
  name: string;
  format: TournamentFormat;
  gameMode?: PazaakGameMode;
  setsPerMatch?: number;
  rounds?: number;
  maxParticipants?: number | null;
}

export async function fetchTournaments(accessToken: string): Promise<TournamentStateRecord[]> {
  const data = await apiFetch<TournamentsListResponse>("/api/tournaments", accessToken);
  return data.tournaments;
}

export async function fetchTournament(accessToken: string, tournamentId: string): Promise<TournamentDetailResponse> {
  return apiFetch<TournamentDetailResponse>(`/api/tournaments/${encodeURIComponent(tournamentId)}`, accessToken);
}

export async function createTournament(accessToken: string, input: CreateTournamentInput): Promise<TournamentStateRecord> {
  const data = await apiFetch<{ tournament: TournamentStateRecord }>("/api/tournaments", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.tournament;
}

export async function joinTournament(accessToken: string, tournamentId: string): Promise<TournamentStateRecord> {
  const data = await apiFetch<{ tournament: TournamentStateRecord }>(`/api/tournaments/${encodeURIComponent(tournamentId)}/join`, accessToken, { method: "POST" });
  return data.tournament;
}

export async function leaveTournament(accessToken: string, tournamentId: string): Promise<TournamentStateRecord> {
  const data = await apiFetch<{ tournament: TournamentStateRecord }>(`/api/tournaments/${encodeURIComponent(tournamentId)}/leave`, accessToken, { method: "POST" });
  return data.tournament;
}

export async function startTournament(accessToken: string, tournamentId: string): Promise<TournamentStateRecord> {
  const data = await apiFetch<{ tournament: TournamentStateRecord }>(`/api/tournaments/${encodeURIComponent(tournamentId)}/start`, accessToken, { method: "POST" });
  return data.tournament;
}

export async function reportTournamentMatch(
  accessToken: string,
  tournamentId: string,
  matchId: string,
  winnerUserId: string | null,
): Promise<{ tournament: TournamentStateRecord; tournamentCompleted: boolean }> {
  return apiFetch<{ tournament: TournamentStateRecord; tournamentCompleted: boolean }>(
    `/api/tournaments/${encodeURIComponent(tournamentId)}/report`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ matchId, winnerUserId }),
    },
  );
}

export async function cancelTournament(accessToken: string, tournamentId: string): Promise<TournamentStateRecord> {
  const data = await apiFetch<{ tournament: TournamentStateRecord }>(`/api/tournaments/${encodeURIComponent(tournamentId)}/cancel`, accessToken, { method: "POST" });
  return data.tournament;
}

export interface TournamentSubscriptionEvent {
  event: "tournament.updated" | "match.scheduled" | "round.advanced";
  tournamentId: string;
  matchId?: string;
  summary: TournamentStateRecord;
}

/**
 * Subscribe to live tournament events for a specific tournament id. The
 * matchmaking worker brokers these events through its relay Durable Object so
 * the Activity can keep the bracket/standings in sync without polling.
 */
export function subscribeToTournaments(
  tournamentId: string,
  onEvent: (event: TournamentSubscriptionEvent) => void,
  options: MatchSubscriptionOptions = {},
): () => void {
  return subscribeToReconnectingWebSocket<TournamentSubscriptionEvent>({
    createUrl: () => `${apiClient.resolveWebSocketBase()}/ws/tournaments/${encodeURIComponent(tournamentId)}`,
    reconnect: options.reconnect,
    maxDelayMs: options.maxDelayMs,
    onConnectionChange: options.onConnectionChange,
    onMessage: (msg: TournamentSubscriptionEvent) => {
      if (msg && typeof msg.event === "string") {
        onEvent(msg);
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export async function sendChatMessage(matchId: string, accessToken: string, text: string): Promise<ChatMessage> {
  const data = await apiFetch<{ message: ChatMessage }>(`/api/match/${encodeURIComponent(matchId)}/chat`, accessToken, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return data.message;
}

export async function fetchChatHistory(matchId: string, accessToken: string): Promise<ChatMessage[]> {
  const data = await apiFetch<{ messages: ChatMessage[] }>(`/api/match/${encodeURIComponent(matchId)}/chat`, accessToken);
  return data.messages;
}
