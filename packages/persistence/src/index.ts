import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface RivalryRecord {
  opponentId: string;
  opponentName: string;
  wins: number;
  losses: number;
}

export interface WalletRecord {
  userId: string;
  displayName: string;
  balance: number;
  wins: number;
  losses: number;
  streak: number;
  bestStreak: number;
  lastDailyAt: string | null;
  rivalries: Record<string, RivalryRecord>;
  updatedAt: string;
}

interface WalletFileShape {
  version: 1;
  wallets: Record<string, WalletRecord>;
}

const cloneWallet = (wallet: WalletRecord): WalletRecord => ({ ...wallet });

const createWallet = (userId: string, displayName: string, startingBalance: number): WalletRecord => {
  return {
    userId,
    displayName,
    balance: startingBalance,
    wins: 0,
    losses: 0,
    streak: 0,
    bestStreak: 0,
    lastDailyAt: null,
    rivalries: {},
    updatedAt: new Date().toISOString(),
  };
};

export const resolveDataFile = (rootDir: string, fileName: string): string => {
  return path.resolve(rootDir, fileName);
};

export class JsonWalletRepository {
  private state?: WalletFileShape;

  public constructor(
    private readonly filePath: string,
    private readonly startingBalance: number,
  ) {}

  public async getWallet(userId: string, displayName: string): Promise<WalletRecord> {
    const state = await this.ensureState();
    const wallet = state.wallets[userId] ?? this.upsertWallet(state, userId, displayName);
    return cloneWallet(wallet);
  }

  public async canCover(userId: string, displayName: string, amount: number): Promise<boolean> {
    const wallet = await this.getWallet(userId, displayName);
    return wallet.balance >= amount;
  }

  public async listWallets(): Promise<readonly WalletRecord[]> {
    const state = await this.ensureState();
    return Object.values(state.wallets)
      .map(cloneWallet)
      .sort((left, right) => right.balance - left.balance || right.wins - left.wins || left.losses - right.losses);
  }

  public async claimDailyBonus(
    userId: string,
    displayName: string,
    bonusAmount: number,
    cooldownMs: number,
  ): Promise<{ credited: boolean; amount: number; nextEligibleAt: number }> {
    const state = await this.ensureState();
    const wallet = this.upsertWallet(state, userId, displayName);
    const now = Date.now();
    const lastDaily = wallet.lastDailyAt ? new Date(wallet.lastDailyAt).getTime() : 0;

    if (now - lastDaily < cooldownMs) {
      return { credited: false, amount: 0, nextEligibleAt: lastDaily + cooldownMs };
    }

    wallet.balance += bonusAmount;
    wallet.lastDailyAt = new Date().toISOString();
    wallet.updatedAt = new Date().toISOString();
    await this.persist(state);
    return { credited: true, amount: bonusAmount, nextEligibleAt: now + cooldownMs };
  }

  public async recordMatch(options: {
    winnerId: string;
    winnerName: string;
    loserId: string;
    loserName: string;
    wager: number;
  }): Promise<{ winner: WalletRecord; loser: WalletRecord }> {
    const state = await this.ensureState();
    const winner = this.upsertWallet(state, options.winnerId, options.winnerName);
    const loser = this.upsertWallet(state, options.loserId, options.loserName);

    loser.balance = Math.max(0, loser.balance - options.wager);
    loser.losses += 1;
    loser.streak = 0;
    loser.updatedAt = new Date().toISOString();

    winner.balance += options.wager;
    winner.wins += 1;
    winner.streak += 1;
    winner.bestStreak = Math.max(winner.bestStreak, winner.streak);
    winner.updatedAt = new Date().toISOString();

    this.upsertRivalry(winner, options.loserId, options.loserName, "win");
    this.upsertRivalry(loser, options.winnerId, options.winnerName, "loss");

    await this.persist(state);

    return {
      winner: cloneWallet(winner),
      loser: cloneWallet(loser),
    };
  }

  public topRivalry(wallet: WalletRecord): RivalryRecord | undefined {
    const entries = Object.values(wallet.rivalries);
    if (entries.length === 0) return undefined;
    return entries.reduce((best, entry) => {
      const bestTotal = best.wins + best.losses;
      const entryTotal = entry.wins + entry.losses;
      return entryTotal > bestTotal ? entry : best;
    });
  }

  public allRivalries(wallet: WalletRecord): readonly RivalryRecord[] {
    return Object.values(wallet.rivalries).sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses));
  }

  /**
   * Directly adjust a wallet balance by a signed delta (positive = add, negative = subtract).
   * Balance is floored at 0. Returns the updated wallet record.
   */
  public async adjustBalance(userId: string, displayName: string, delta: number): Promise<WalletRecord> {
    const state = await this.ensureState();
    const wallet = this.upsertWallet(state, userId, displayName);
    wallet.balance = Math.max(0, wallet.balance + delta);
    wallet.updatedAt = new Date().toISOString();
    await this.persist(state);
    return cloneWallet(wallet);
  }

  private async ensureState(): Promise<WalletFileShape> {
    if (this.state) {
      return this.state;
    }

    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      const raw = await readFile(this.filePath, "utf8");
      this.state = JSON.parse(raw) as WalletFileShape;
    } catch {
      this.state = {
        version: 1,
        wallets: {},
      };

      await this.persist(this.state);
    }

    return this.state;
  }

  private upsertWallet(state: WalletFileShape, userId: string, displayName: string): WalletRecord {
    const existing = state.wallets[userId];

    if (existing) {
      existing.displayName = displayName;
      return existing;
    }

    const created = createWallet(userId, displayName, this.startingBalance);
    state.wallets[userId] = created;
    return created;
  }

  private upsertRivalry(wallet: WalletRecord, opponentId: string, opponentName: string, outcome: "win" | "loss"): void {
    const existing = wallet.rivalries[opponentId];

    if (existing) {
      existing.opponentName = opponentName;
      if (outcome === "win") existing.wins += 1;
      else existing.losses += 1;
      return;
    }

    wallet.rivalries[opponentId] = {
      opponentId,
      opponentName,
      wins: outcome === "win" ? 1 : 0,
      losses: outcome === "loss" ? 1 : 0,
    };
  }

  private async persist(state: WalletFileShape): Promise<void> {
    await writeFile(this.filePath, JSON.stringify(state, null, 2), "utf8");
  }
}

// ---------------------------------------------------------------------------
// Designation preset repository
// ---------------------------------------------------------------------------

export interface DesignationPresetRecord {
  userId: string;
  guildId: string;
  roleIds: readonly string[];
  updatedAt: string;
}

interface DesignationPresetFileShape {
  version: 1;
  presets: Record<string, DesignationPresetRecord>;
}

const presetKey = (guildId: string, userId: string): string => `${guildId}:${userId}`;

export class JsonDesignationPresetRepository {
  private state?: DesignationPresetFileShape;

  public constructor(private readonly filePath: string) {}

  public async getPreset(guildId: string, userId: string): Promise<readonly string[] | undefined> {
    const state = await this.ensureState();
    return state.presets[presetKey(guildId, userId)]?.roleIds;
  }

  public async savePreset(guildId: string, userId: string, roleIds: readonly string[]): Promise<void> {
    const state = await this.ensureState();
    state.presets[presetKey(guildId, userId)] = {
      userId,
      guildId,
      roleIds: [...roleIds],
      updatedAt: new Date().toISOString(),
    };
    await this.persist(state);
  }

  private async ensureState(): Promise<DesignationPresetFileShape> {
    if (this.state) {
      return this.state;
    }

    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      const raw = await readFile(this.filePath, "utf8");
      this.state = JSON.parse(raw) as DesignationPresetFileShape;
    } catch {
      this.state = { version: 1, presets: {} };
      await this.persist(this.state);
    }

    return this.state;
  }

  private async persist(state: DesignationPresetFileShape): Promise<void> {
    await writeFile(this.filePath, JSON.stringify(state, null, 2), "utf8");
  }
}