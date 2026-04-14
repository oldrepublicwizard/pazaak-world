# Pazaak — How to Play

Deadeye Duncan runs the pazaak table on this server. Pazaak is a card game from Knights of the Old Republic. You play against other server members for fake credits — no real money involved.

---

## Quick Start

1. Type **`/pazaak wallet`** to see your credits. Every new player starts with **1,000 credits**.
2. Type **`/pazaak challenge`**, pick someone to play against, and set a wager.
3. Both of you play sets of cards trying to reach exactly **20** without going over.
4. First person to win **3 sets** wins the match and takes the wager.

---

## Commands

### `/pazaak challenge`

Start a game against another player.

| What to fill in | What it means |
|---|---|
| **opponent** | The person you want to play against (type `@` and pick them) |
| **wager** | How many credits to bet (minimum 1, maximum 5,000) |

After you run this command, a message appears in the channel with two buttons: **Accept** and **Decline**. Your opponent has 5 minutes to accept before the challenge expires. Both players need enough credits to cover the wager.

### `/pazaak wallet`

Check your credits, win/loss record, current win streak, best streak, and your top rivalry. Also shows when your next daily bonus is available. Only you can see the response.

### `/pazaak daily`

Claim **200 free credits** once every 24 hours. If you have a win streak going, you get a bonus multiplier:

| Win streak | Multiplier | Daily bonus |
|---|---|---|
| 0–1 wins | 1x | 200 credits |
| 2–4 wins | 1.25x | 250 credits |
| 5–9 wins | 1.5x | 300 credits |
| 10+ wins | 2x | 400 credits |

If you already claimed today, the bot tells you how many hours are left until you can claim again. Only you can see the response.

### `/pazaak rules`

Shows the full pazaak ruleset in the channel so everyone can read it.

### `/pazaak leaderboard`

Shows the top 10 players sorted by credit balance. Visible to everyone in the channel.

### `/pazaak rivalry`

Shows your head-to-head record against every opponent you have played. Lists up to 10 opponents sorted by how many matches you have played together. Only you can see the response.

---

## How a Match Works

### Step 1 — Challenge and Accept

You type `/pazaak challenge`, pick an opponent and a wager. A public message appears:

> **Deadeye Duncan** — Pazaak Challenge
> @You challenges @Opponent for 500 credits!
> [ Accept ] [ Decline ]

Your opponent clicks **Accept**. The game begins. A random coin flip decides who goes first.

### Step 2 — Your Sideboard and Hand

At the start of the match, each player receives a **10-card sideboard** drawn randomly from the full card pool (see Card Types below). At the start of each set, **4 cards** are drawn from your sideboard into your hand.

Hands are **always refreshed** at the start of every set, including after ties.

### Step 3 — The Board

A **public board** message appears in the channel. It shows:

- Both players' names (the active player is marked)
- Each player's board total (the sum of their played cards)
- How many sets each player has won
- How many side cards each player has left
- Whether a player is standing

Two buttons are on the public board:
- **Open Controls** — opens your private control panel
- **Forfeit** — instantly lose the match (the other player gets the wager)

### Step 4 — Your Private Controls

Each player gets their own **private control panel** that only they can see. This shows:

- Your current credit balance
- Your hand (side cards)
- Your board (cards you have played and your total)
- Your opponent's board and total
- Action buttons

**You never see your opponent's hand. They never see yours.**

### Step 5 — Taking Your Turn

On your turn you **must draw first** — a card from the main deck is added to your board.

**If the draw puts you over 20, you bust and lose the set immediately.** There is no chance to play a side card to recover.

If you are still at 20 or under after drawing, you have three choices:

1. **Play a side card** — pick one of your side cards to modify your total, then stand or end the turn
2. **Stand** — stop drawing and lock in your current total for this set
3. **End Turn** — keep your total as-is and pass the turn

You can only play **one side card per turn**, and each side card can only be used **once per set**. After playing a card you can still stand or end the turn — playing a card does not automatically end your turn.

### Step 6 — Side Cards (Card Types)

Your sideboard can contain any of these card types:

#### Basic Cards

| Type | Examples | What it does |
|---|---|---|
| **Plus** | `+1`, `+2`, `+3`, `+4`, `+5`, `+6` | Adds that number to your total |
| **Minus** | `-1`, `-2`, `-3`, `-4`, `-5`, `-6` | Subtracts that number from your total |
| **Flip** | `±1`, `±2`, `±3`, `±4`, `±5`, `±6` | You choose whether to add or subtract |

Flip cards show two buttons — one for plus, one for minus — so you choose at play time.

#### Special Cards

| Type | Label | What it does |
|---|---|---|
| **Tiebreaker** | `T+1` | Always adds +1 to your total. If the set ends in a tie, the player who played the Tiebreaker wins instead. |
| **Double** | `x2` | Doubles the value of the last basic card on your board (targets the last main-deck draw, plus, minus, or flip card — skips tiebreaker and special cards). Does not add a new card. |
| **Flip 2&4** | `Flip 2&4` | Flips the sign of every 2 and 4 on your board that came from the main deck or a plus/minus card. Flip and special cards are not affected. |
| **Flip 3&6** | `Flip 3&6` | Same as above but targets every 3 and 6 on your board. |

**When to use side cards:**
- Your total is 18 and you have a `+2` → play it to hit exactly 20
- Your total is 14 and you have a `±6` → play `+6` to hit 20
- Your board has 10+4+8 = 22 and you play Flip 2&4 → the 4 becomes -4, total drops to 14
- Your last draw was a 5 and you play x2 → the 5 becomes 10

### Step 7 — Winning a Set

A set ends when both players have stood or one player busts:

- If your draw puts you **over 20**, you **bust** and lose the set immediately.
- If a side card you play puts you over 20, you also bust immediately.
- If both players stand, whoever is **closer to 20** wins the set.
- If both players stand on the **same total**, the set is a **tie** — unless one player has played a **Tiebreaker** card, in which case that player wins.
- On a true tie (no tiebreaker), a new set starts with **fresh side cards**.

### Step 8 — Who Goes First Next

- The **loser** of a set goes first in the next set.
- On a tie, the original **coin-flip opener** resumes.
- The very first set uses a random coin flip.

### Step 9 — Winning the Match

First player to win **3 sets** wins the match. The winner's credits go up by the wager amount. The loser's credits go down by the wager amount (but never below 0).

After the match ends, a **Rematch** button appears. Either player can click it to start a new challenge at the same wager.

### Nine-Card Rule

If your board reaches **9 cards** without going over 20, you **automatically win the set**. This is rare but powerful.

### Turn Timer

If you do not take any action for **5 minutes**, you automatically forfeit the match. The other player wins the wager.

---

## Credits

| Event | Credits |
|---|---|
| Starting balance (new player) | +1,000 |
| Daily bonus | +200 (multiplied by streak bonus) |
| Winning a match | +wager amount |
| Losing a match | −wager amount |
| Lowest possible balance | 0 (you can never go negative) |

Credits are fake. They are just for fun on this server. There is no way to convert them to real money or trade them outside the server.

---

## Tips

- **Stand early if you are close to 20.** If your total is 17–20 and you have no good side cards, standing is safer than drawing. Drawing over 20 is an instant bust with no recovery.
- **Play side cards to fine-tune your total before standing.** A `+2` when you are at 18 locks in a perfect 20.
- **Minus and flip cards shine when you are close to 20 but not over.** Use them to drop your total after a strong draw — but remember, you cannot use them to recover if a draw puts you over 20.
- **Tiebreaker cards are insurance.** If you play one early, ties become wins. The Tiebreaker always adds +1.
- **Double (x2) is high risk, high reward.** If your last draw was a 10, doubling makes 20. If it was a 3, doubling only adds 3.
- **Flip 2&4 / Flip 3&6 affect main-deck draws and plus/minus cards only.** They will not flip cards placed by other side cards.
- **Claim your daily bonus every day.** Free credits add up, especially with a win streak multiplier.
- **Watch your opponent's side card count.** If they have no side cards left, they cannot adjust their total after drawing.
- **Do not wager more than you can afford to lose.** If your balance hits 0, you have to wait for daily bonuses to build it back up.

---

## Admin Commands

Server moderators (with **Manage Server** permission) have access to extra commands:

### `/pazaak-admin give`

Add credits to a player's wallet.

| What to fill in | What it means |
|---|---|
| **player** | The person to give credits to |
| **amount** | How many credits to add (1–1,000,000) |

### `/pazaak-admin take`

Remove credits from a player's wallet. Their balance cannot go below 0.

| What to fill in | What it means |
|---|---|
| **player** | The person to take credits from |
| **amount** | How many credits to remove (1–1,000,000) |
