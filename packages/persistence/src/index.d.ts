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
export declare const resolveDataFile: (rootDir: string, fileName: string) => string;
export declare class JsonWalletRepository {
    private readonly filePath;
    private readonly startingBalance;
    private state?;
    constructor(filePath: string, startingBalance: number);
    getWallet(userId: string, displayName: string): Promise<WalletRecord>;
    canCover(userId: string, displayName: string, amount: number): Promise<boolean>;
    listWallets(): Promise<readonly WalletRecord[]>;
    claimDailyBonus(userId: string, displayName: string, bonusAmount: number, cooldownMs: number): Promise<{
        credited: boolean;
        amount: number;
        nextEligibleAt: number;
    }>;
    recordMatch(options: {
        winnerId: string;
        winnerName: string;
        loserId: string;
        loserName: string;
        wager: number;
    }): Promise<{
        winner: WalletRecord;
        loser: WalletRecord;
    }>;
    topRivalry(wallet: WalletRecord): RivalryRecord | undefined;
    allRivalries(wallet: WalletRecord): readonly RivalryRecord[];
    /**
     * Directly adjust a wallet balance by a signed delta (positive = add, negative = subtract).
     * Balance is floored at 0. Returns the updated wallet record.
     */
    adjustBalance(userId: string, displayName: string, delta: number): Promise<WalletRecord>;
    private ensureState;
    private upsertWallet;
    private upsertRivalry;
    private persist;
}
export interface DesignationPresetRecord {
    userId: string;
    guildId: string;
    roleIds: readonly string[];
    updatedAt: string;
}
export declare class JsonDesignationPresetRepository {
    private readonly filePath;
    private state?;
    constructor(filePath: string);
    getPreset(guildId: string, userId: string): Promise<readonly string[] | undefined>;
    savePreset(guildId: string, userId: string, roleIds: readonly string[]): Promise<void>;
    private ensureState;
    private persist;
}
