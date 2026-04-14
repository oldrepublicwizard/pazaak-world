import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const cloneWallet = (wallet) => ({ ...wallet });
const createWallet = (userId, displayName, startingBalance) => {
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
export const resolveDataFile = (rootDir, fileName) => {
    return path.resolve(rootDir, fileName);
};
export class JsonWalletRepository {
    filePath;
    startingBalance;
    state;
    constructor(filePath, startingBalance) {
        this.filePath = filePath;
        this.startingBalance = startingBalance;
    }
    async getWallet(userId, displayName) {
        const state = await this.ensureState();
        const wallet = state.wallets[userId] ?? this.upsertWallet(state, userId, displayName);
        return cloneWallet(wallet);
    }
    async canCover(userId, displayName, amount) {
        const wallet = await this.getWallet(userId, displayName);
        return wallet.balance >= amount;
    }
    async listWallets() {
        const state = await this.ensureState();
        return Object.values(state.wallets)
            .map(cloneWallet)
            .sort((left, right) => right.balance - left.balance || right.wins - left.wins || left.losses - right.losses);
    }
    async claimDailyBonus(userId, displayName, bonusAmount, cooldownMs) {
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
    async recordMatch(options) {
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
    topRivalry(wallet) {
        const entries = Object.values(wallet.rivalries);
        if (entries.length === 0)
            return undefined;
        return entries.reduce((best, entry) => {
            const bestTotal = best.wins + best.losses;
            const entryTotal = entry.wins + entry.losses;
            return entryTotal > bestTotal ? entry : best;
        });
    }
    allRivalries(wallet) {
        return Object.values(wallet.rivalries).sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses));
    }
    /**
     * Directly adjust a wallet balance by a signed delta (positive = add, negative = subtract).
     * Balance is floored at 0. Returns the updated wallet record.
     */
    async adjustBalance(userId, displayName, delta) {
        const state = await this.ensureState();
        const wallet = this.upsertWallet(state, userId, displayName);
        wallet.balance = Math.max(0, wallet.balance + delta);
        wallet.updatedAt = new Date().toISOString();
        await this.persist(state);
        return cloneWallet(wallet);
    }
    async ensureState() {
        if (this.state) {
            return this.state;
        }
        await mkdir(path.dirname(this.filePath), { recursive: true });
        try {
            const raw = await readFile(this.filePath, "utf8");
            this.state = JSON.parse(raw);
        }
        catch {
            this.state = {
                version: 1,
                wallets: {},
            };
            await this.persist(this.state);
        }
        return this.state;
    }
    upsertWallet(state, userId, displayName) {
        const existing = state.wallets[userId];
        if (existing) {
            existing.displayName = displayName;
            return existing;
        }
        const created = createWallet(userId, displayName, this.startingBalance);
        state.wallets[userId] = created;
        return created;
    }
    upsertRivalry(wallet, opponentId, opponentName, outcome) {
        const existing = wallet.rivalries[opponentId];
        if (existing) {
            existing.opponentName = opponentName;
            if (outcome === "win")
                existing.wins += 1;
            else
                existing.losses += 1;
            return;
        }
        wallet.rivalries[opponentId] = {
            opponentId,
            opponentName,
            wins: outcome === "win" ? 1 : 0,
            losses: outcome === "loss" ? 1 : 0,
        };
    }
    async persist(state) {
        await writeFile(this.filePath, JSON.stringify(state, null, 2), "utf8");
    }
}
const presetKey = (guildId, userId) => `${guildId}:${userId}`;
export class JsonDesignationPresetRepository {
    filePath;
    state;
    constructor(filePath) {
        this.filePath = filePath;
    }
    async getPreset(guildId, userId) {
        const state = await this.ensureState();
        return state.presets[presetKey(guildId, userId)]?.roleIds;
    }
    async savePreset(guildId, userId, roleIds) {
        const state = await this.ensureState();
        state.presets[presetKey(guildId, userId)] = {
            userId,
            guildId,
            roleIds: [...roleIds],
            updatedAt: new Date().toISOString(),
        };
        await this.persist(state);
    }
    async ensureState() {
        if (this.state) {
            return this.state;
        }
        await mkdir(path.dirname(this.filePath), { recursive: true });
        try {
            const raw = await readFile(this.filePath, "utf8");
            this.state = JSON.parse(raw);
        }
        catch {
            this.state = { version: 1, presets: {} };
            await this.persist(this.state);
        }
        return this.state;
    }
    async persist(state) {
        await writeFile(this.filePath, JSON.stringify(state, null, 2), "utf8");
    }
}
//# sourceMappingURL=index.js.map