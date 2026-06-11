type CacheEntry = { expiresAt: number; data: any };

const DEFAULT_TTL = 20_000; // 20 seconds
const inMemoryCache = new Map<string, CacheEntry>();
const pendingFetches = new Map<string, Promise<any>>();

let redisClient: any | null = null;
let redisEnabled = false;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function initRedisIfNeeded() {
  if (redisEnabled || redisClient) return;
  const url = process.env.REDIS_URL;
  if (!url) return;
  try {
    // lazy require to avoid dependency unless configured
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const IORedis = require('ioredis');
    redisClient = new IORedis(url);
    // optional: wait for ready event
    redisClient.on('error', () => {
      // ignore redis errors, fallback to in-memory
    });
    redisEnabled = true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('ioredis not available or failed to initialize, falling back to in-memory cache');
    redisEnabled = false;
    redisClient = null;
  }
}

async function getCached(url: string): Promise<any | null> {
  await initRedisIfNeeded();
  if (redisEnabled && redisClient) {
    try {
      const raw = await redisClient.get(url);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Redis get failed, falling back to in-memory', err);
      redisEnabled = false;
      redisClient = null;
    }
  }

  const now = Date.now();
  const c = inMemoryCache.get(url);
  if (c && c.expiresAt > now) return c.data;
  return null;
}

async function setCached(url: string, data: any, ttl: number) {
  await initRedisIfNeeded();
  if (redisEnabled && redisClient) {
    try {
      await redisClient.set(url, JSON.stringify(data), 'PX', ttl);
      return;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Redis set failed, falling back to in-memory', err);
      redisEnabled = false;
      redisClient = null;
    }
  }

  inMemoryCache.set(url, { expiresAt: Date.now() + ttl, data });
}

async function fetchWithProxy(url: string, ttl = DEFAULT_TTL, retries = 2): Promise<any> {
  const cached = await getCached(url);
  if (cached) return cached;

  if (pendingFetches.has(url)) return pendingFetches.get(url)!;

  const attempt = async () => {
    let lastErr: unknown = null;
    let backoff = 200;
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'SofStake/1.0 (+https://sofstake.com)'
          }
        });

        if (!res.ok) {
          // Do not retry on 403 (forbidden) or 401 — treat as final
          if (res.status === 403 || res.status === 401) {
            const text = await res.text().catch(() => '');
            throw new Error(`DexScreener request failed with ${res.status} ${text}`);
          }

          // Retry for 5xx or 429
          if (res.status >= 500 || res.status === 429) {
            lastErr = new Error(`Transient DexScreener error ${res.status}`);
            await sleep(backoff);
            backoff *= 2;
            continue;
          }

          const text = await res.text().catch(() => '');
          throw new Error(`DexScreener request failed with ${res.status} ${text}`);
        }

        const json = await res.json();
        await setCached(url, json, ttl);
        return json;
      } catch (err) {
        lastErr = err;
        if (i < retries) await sleep(backoff);
        backoff *= 2;
      }
    }

    throw lastErr;
  };

  const p = attempt()
    .then((v) => {
      pendingFetches.delete(url);
      return v;
    })
    .catch((e) => {
      pendingFetches.delete(url);
      throw e;
    });

  pendingFetches.set(url, p);
  return p;
}

export { fetchWithProxy };
