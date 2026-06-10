# 🎰 SofStake Crypto Betting System

Complete guide to the crypto UP/DOWN prediction betting system integrated into SofStake.

## 🎯 System Overview

This system combines DexScreener market data with a prediction-based betting game where users:
- View trending crypto tokens in real-time
- Search for specific tokens
- Predict whether prices will go UP or DOWN
- Bet virtual points on predictions
- Win 1.8x their stake on correct predictions
- See risk scores for each token

## 🏗️ Architecture

### Backend Components

#### 1. **DexScreener Service** (`/lib/dexscreener.ts`)
Provides public API integration with DexScreener (NO API KEY REQUIRED).

**Functions:**
```typescript
fetchTrendingTokens(): Promise<NormalizedToken[]>
  // Returns top 10 trending tokens with caching (25s TTL)

searchTokens(query: string): Promise<NormalizedToken[]>
  // Search tokens by name/symbol, returns up to 20 results

getTokenPairs(address: string): Promise<NormalizedToken[]>
  // Get token pairs by address, returns up to 15 pairs
```

**Normalized Token Format:**
```typescript
{
  name: string
  symbol: string
  priceUsd: number
  liquidityUsd: number
  volume24h: number
  priceChange24h: number
  dex: string
  pairAddress: string
  chainId?: string
  quoteSymbol?: string
  url?: string
  createdAt?: number
}
```

**Caching Strategy:**
- In-memory cache with 25-second TTL
- Deduplication of requests
- Prevents duplicate API calls within TTL window

#### 2. **Betting Engine** (`/lib/bettingEngine.ts`)
Core prediction logic (in-memory for now, integrates with DB via API).

**Key Functions:**
```typescript
placeBet(userId, pairAddress, direction, stake, windowMinutes, entryPrice)
  // Places a new bet, deducts points

calculateOutcome(entryPrice, currentPrice, direction, stake)
  // Calculates WIN/LOSS/TIE and payout

resolveBet(betId, currentPrice)
  // Resolves bet after time window expires
```

**Payout Logic:**
- WIN: 1.8x stake
- LOSS: 0 (stake lost)
- TIE: 1.0x stake (break even)

#### 3. **Anti-Rug Detection** (`/lib/rugCheck.ts`)
Risk scoring engine with 0-100 scale.

**Factors Evaluated:**
- Liquidity (low liquidity = risky)
- Trading volume (low volume = risky)
- Price volatility (extreme swings = risky)
- Pair age (newly listed = risky)

**Risk Labels:**
- 🟢 **LOW** (0-24): Safe to trade
- 🟡 **MEDIUM** (25-49): Moderate caution
- 🟠 **HIGH** (50-74): High risk
- 🔴 **EXTREME** (75-100): Do not trade

```typescript
evaluateRugRisk(token): {
  riskScore: number (0-100)
  label: "LOW" | "MEDIUM" | "HIGH" | "EXTREME"
  warnings: string[]
}
```

### API Routes

#### Crypto Endpoints

**GET `/api/crypto/trending`**
```json
{
  "success": true,
  "data": [NormalizedToken[]],
  "count": 10,
  "timestamp": "2026-06-10T..."
}
```

**GET `/api/crypto/search?q=bitcoin`**
```json
{
  "success": true,
  "data": [NormalizedToken[]],
  "count": 20,
  "query": "bitcoin",
  "timestamp": "2026-06-10T..."
}
```

**GET `/api/crypto/tokens/[address]`**
```json
{
  "success": true,
  "data": [NormalizedToken[]],
  "count": 15,
  "address": "0x...",
  "timestamp": "2026-06-10T..."
}
```

#### Betting Endpoints (Protected - require auth token)

**POST `/api/bet/place`**
```json
Request:
{
  "pairAddress": "0x...",
  "direction": "UP|DOWN",
  "stake": 100,
  "windowMinutes": 5,
  "entryPrice": 0.00000123
}

Response:
{
  "success": true,
  "bet": {
    "id": "uuid",
    "pairAddress": "0x...",
    "direction": "UP",
    "stake": 100,
    "windowMinutes": 5,
    "entryPrice": 0.00000123,
    "createdAt": "2026-06-10T...",
    "resolveAt": "2026-06-10T..."
  }
}
```

**POST `/api/bet/resolve`**
```json
Request:
{
  "betId": "uuid",
  "currentPrice": 0.00000150
}

Response:
{
  "success": true,
  "bet": {
    "id": "uuid",
    "outcome": "WIN|LOSS|TIE",
    "payout": 180,
    "resultPrice": 0.00000150,
    "resolvedAt": "2026-06-10T..."
  }
}
```

**GET `/api/bet/history?status=open|resolved&limit=50&skip=0`**
```json
{
  "success": true,
  "data": [Bet[]],
  "total": 150,
  "limit": 50,
  "skip": 0
}
```

#### Wallet Endpoints (Protected)

**GET `/api/wallet/balance`**
```json
{
  "success": true,
  "wallet": {
    "id": "uuid",
    "userId": "uuid",
    "balance": 1000,
    "lockedBalance": 0,
    "sofBalance": 1000,
    "usdBalance": 0
  }
}
```

**POST `/api/wallet/update`**
```json
Request:
{
  "amount": 100,
  "type": "increment|decrement",
  "reference": "optional-ref"
}

Response:
{
  "success": true,
  "wallet": {
    "id": "uuid",
    "balance": 1100,
    "sofBalance": 1100,
    "usdBalance": 0
  }
}
```

### Database Schema

#### CryptoBet Model
```prisma
model CryptoBet {
  id              String   @id @default(cuid())
  user            User     @relation("CryptoBetUser", fields: [userId], references: [id])
  userId          String
  pairAddress     String   // DexScreener pair
  direction       String   // UP or DOWN
  stake           Decimal  @db.Decimal(30, 10)
  windowMinutes   Int
  entryPrice      Decimal  @db.Decimal(30, 10)
  currentPrice    Decimal? @db.Decimal(30, 10)
  resultPrice     Decimal? @db.Decimal(30, 10)
  payout          Decimal  @default(0)
  status          String   @default("open")  // open or resolved
  outcome         String?  // WIN, LOSS, TIE
  createdAt       DateTime @default(now())
  resolveAt       DateTime
  resolvedAt      DateTime?
}
```

## 🎨 Frontend Components

### Component Hierarchy

```
CryptoBettingPage
├── TrendingTokens
│   ├── TokenCard (multiple)
│   └── Auto-refresh every 15s
├── TokenSearch
│   ├── Debounced search (300ms)
│   └── Dropdown results
├── CryptoBettingGame
│   ├── Price simulator (real-time)
│   ├── Direction selector (UP/DOWN)
│   ├── Stake input
│   ├── Time window selector
│   └── Place bet button
└── BettingHistory
    ├── Filterable bets
    ├── Status indicators
    └── Outcome display
```

### Component Details

#### **TokenCard**
Displays single token information.
- Price with % change
- Volume and liquidity
- Risk score badge
- DEX and chain info
- Click to select for betting

#### **TrendingTokens**
Shows top 10 trending tokens.
- Auto-refresh every 15 seconds
- Skeleton loading states
- Error handling
- Responsive grid layout

#### **TokenSearch**
Search tokens by name/symbol.
- 300ms debounce on input
- Live dropdown results
- Deduplication
- Click outside to close

#### **CryptoBettingGame**
Main betting interface.
- Real-time price simulation
- Direction selection (UP/DOWN)
- Stake input with validation
- Time window selector (1m, 5m, 15m, 60m)
- Payout preview
- Mini price chart
- Wallet balance display

#### **BettingHistory**
View past bets.
- Filter by status (all, open, resolved)
- Outcome indicators
- Pagination support
- Timestamp display

### Real-Time Price Simulation

The `usePriceSimulator` hook provides realistic price updates:

```typescript
const { currentPrice, priceHistory } = usePriceSimulator(
  initialPrice,
  updateInterval // default 3000ms
)
```

**Behavior:**
- Updates every 3-5 seconds
- 2-5% volatility per update
- Maintains 60-point history
- Used for UI feedback (not bet logic)

## 🔐 Security

### Authentication
- JWT token-based auth
- Token stored in httpOnly cookies
- Protected routes use `withAuth()` middleware

### Validation
- Input sanitization on all routes
- Balance verification before bet placement
- User ownership verification on bets
- Stake amount validation

### Database
- Cascading deletes on user deletion
- Transaction support via Prisma
- Indexed queries for performance
- Ledger entries for audit trail

## 📊 Performance Optimizations

### Caching
- DexScreener responses cached for 25 seconds
- Request deduplication prevents duplicate API calls
- In-memory store with TTL

### Frontend
- Skeleton loading states
- Debounced search (300ms)
- Lazy component loading
- Optimized re-renders with React.memo candidates

### Database
- Indexes on frequently queried fields
- Pagination on history endpoint
- Efficient wallet balance queries

## 🚀 Usage Example

### For Users

1. **Navigate to the betting page:**
   ```
   http://localhost:3000/crypto-betting
   ```

2. **View trending tokens:**
   - See top 10 trending tokens automatically
   - Check risk scores for each token

3. **Search for a token:**
   - Type token name or symbol
   - Select from dropdown results

4. **Place a bet:**
   - Select UP or DOWN
   - Enter stake amount
   - Choose time window (1m, 5m, 15m, 60m)
   - Click "Place Bet"

5. **View results:**
   - Switch to "My History" tab
   - See all past bets
   - Filter by status

### For Developers

#### Adding a new token:
```typescript
import { getTokenPairs } from '@/lib/dexscreener';

const pairs = await getTokenPairs('0x1234...');
```

#### Checking token risk:
```typescript
import { evaluateRugRisk } from '@/lib/rugCheck';

const risk = evaluateRugRisk(token);
if (risk.label === 'EXTREME') {
  // Block betting
}
```

#### Resolving bets (manual - normally done by backend job):
```typescript
const resolved = await db.cryptoBet.update({
  where: { id: betId },
  data: {
    status: 'resolved',
    outcome: 'WIN',
    payout: 180,
    resultPrice: currentPrice,
    resolvedAt: new Date(),
  },
});
```

## 📈 Future Enhancements

- [ ] WebSocket for real-time price updates
- [ ] Automatic bet resolution via cron jobs
- [ ] Leaderboard system
- [ ] Referral bonuses
- [ ] Multiple prediction types (RANGE, VOLATILITY)
- [ ] Social betting features
- [ ] Advanced charting with TradingView
- [ ] Historical performance stats
- [ ] Mobile app
- [ ] Backend price feed integration

## 🐛 Troubleshooting

### Bets not placing?
- Check wallet balance
- Verify auth token exists
- Check console for errors

### No tokens showing?
- Check internet connection
- Verify DexScreener API is available
- Clear browser cache

### Prices not updating?
- Check browser console for errors
- Verify socket.io/polling active
- Check network tab

## 📚 API Documentation

Full API routes documented in `/api` folder comment headers.

## 🔗 External Resources

- **DexScreener API**: https://api.dexscreener.com/latest/dex/
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs/
- **TypeScript Docs**: https://www.typescriptlang.org/

---

**Last Updated:** June 10, 2026  
**Status:** Production Ready ✅
