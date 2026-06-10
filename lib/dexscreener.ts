export type DexToken = {
  address: string;
  name: string;
  symbol: string;
};

export type DexPair = {
  pairAddress: string;
  chainId?: string;
  dexId: string;
  url: string;
  baseToken: DexToken;
  quoteToken: DexToken;
  priceUsd?: number;
  liquidityUsd?: number;
  volume24h?: number;
  priceChange24h?: number;
  pairCreatedAt?: number;
};

export type NormalizedToken = {
  name: string;
  symbol: string;
  priceUsd: number;
  liquidityUsd: number;
  volume24h: number;
  priceChange24h: number;
  dex: string;
  pairAddress: string;
  chainId?: string;
  quoteSymbol?: string;
  url?: string;
  createdAt?: number;
};

type DexResponse = {
  pairs?: any[];
};

const DEFAULT_CACHE_TTL = 25000;
const cache = new Map<string, { expiresAt: number; data: any }>();
const pendingFetches = new Map<string, Promise<any>>();

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>, ttl = DEFAULT_CACHE_TTL): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.data as T;
  }

  if (pendingFetches.has(key)) {
    return pendingFetches.get(key)! as Promise<T>;
  }

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { expiresAt: Date.now() + ttl, data });
      pendingFetches.delete(key);
      return data;
    })
    .catch((error) => {
      pendingFetches.delete(key);
      throw error;
    });

  pendingFetches.set(key, promise);
  return promise;
}

function normalizePair(pair: any): NormalizedToken {
  const baseToken = pair.baseToken || pair.token || {};
  const quoteToken = pair.quoteToken || {};
  const priceUsd = Number(pair.priceUsd ?? pair.priceUsd ?? 0) || 0;
  const liquidityUsd = Number(pair.liquidity?.usd ?? pair.liquidityUsd ?? 0) || 0;
  const volume24h = Number(pair.volume?.h24 ?? 0) || 0;
  const priceChange24h = Number(pair.priceChange?.h24 ?? pair.priceChange24h ?? 0) || 0;
  const pairAddress = String(pair.pairAddress ?? pair.address ?? '');

  return {
    name: String(baseToken.name ?? quoteToken.name ?? 'Unknown'),
    symbol: String(baseToken.symbol ?? quoteToken.symbol ?? 'N/A'),
    priceUsd,
    liquidityUsd,
    volume24h,
    priceChange24h,
    dex: String(pair.dexId ?? pair.dex ?? 'unknown'),
    pairAddress,
    chainId: String(pair.chainId ?? ''),
    quoteSymbol: String(quoteToken.symbol ?? ''),
    url: String(pair.url ?? ''),
    createdAt: pair.pairCreatedAt ? Number(pair.pairCreatedAt) : undefined,
  };
}

function normalizePairs(pairs: any[] = []) {
  return pairs
    .filter((pair) => pair && (pair.pairAddress || pair.address))
    .map(normalizePair)
    .filter((item) => item.pairAddress);
}

export async function fetchTrendingTokens(): Promise<NormalizedToken[]> {
  const data = await cachedFetch<DexResponse>('dexscreener:trending', async () => {
    const response = await fetch('https://api.dexscreener.com/latest/dex/trending');
    if (!response.ok) {
      throw new Error(`DexScreener trending request failed with ${response.status}`);
    }
    return response.json();
  });

  return normalizePairs(data.pairs).slice(0, 10);
}

export async function searchTokens(query: string): Promise<NormalizedToken[]> {
  if (!query || query.trim().length === 0) return [];
  const cacheKey = `dexscreener:search:${query.trim().toLowerCase()}`;
  const data = await cachedFetch<DexResponse>(cacheKey, async () => {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`DexScreener search request failed with ${response.status}`);
    }
    return response.json();
  });

  const normalized = normalizePairs(data.pairs);
  const unique = new Map<string, NormalizedToken>();
  normalized.forEach((item) => {
    if (!unique.has(item.pairAddress)) {
      unique.set(item.pairAddress, item);
    }
  });

  return Array.from(unique.values()).slice(0, 20);
}

export async function getTokenPairs(address: string): Promise<NormalizedToken[]> {
  if (!address) {
    throw new Error('Address query is required.');
  }

  const cacheKey = `dexscreener:token:${address.toLowerCase()}`;
  const data = await cachedFetch<DexResponse>(cacheKey, async () => {
    const normalizedAddress = address.trim();
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(normalizedAddress)}`);
    if (!response.ok) {
      throw new Error(`DexScreener token request failed with ${response.status}`);
    }
    return response.json();
  });

  return normalizePairs(data.pairs).slice(0, 15);
}
