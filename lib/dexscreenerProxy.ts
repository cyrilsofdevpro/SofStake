type CacheEntry = { expiresAt: number; data: any };

const DEFAULT_TTL = 20_000; // 20 seconds
const cache = new Map<string, CacheEntry>();
const pendingFetches = new Map<string, Promise<any>>();

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function fetchWithProxy(url: string, ttl = DEFAULT_TTL, retries = 2): Promise<any> {
  const now = Date.now();
  const cached = cache.get(url);
  if (cached && cached.expiresAt > now) return cached.data;

  if (pendingFetches.has(url)) return pendingFetches.get(url)!;

  const attempt = async () => {
    let lastErr: unknown = null;
    let backoff = 200;
    for (let i = 0; i <= retries; i++) {
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
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

          // Other non-ok statuses: throw
          const text = await res.text().catch(() => '');
          throw new Error(`DexScreener request failed with ${res.status} ${text}`);
        }

        const json = await res.json();
        cache.set(url, { expiresAt: Date.now() + ttl, data: json });
        return json;
      } catch (err) {
        lastErr = err;
        // Wait before retrying (unless last attempt)
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
