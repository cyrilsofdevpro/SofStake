import prisma from './db';

// Simple in-memory rate limiter per key. For production use Redis or similar.
const rateMap = new Map<string, { timestamps: number[] }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const rec = rateMap.get(key) || { timestamps: [] };
  // remove old
  rec.timestamps = rec.timestamps.filter(t => now - t <= windowMs);
  if (rec.timestamps.length >= limit) {
    rateMap.set(key, rec);
    return false;
  }
  rec.timestamps.push(now);
  rateMap.set(key, rec);
  return true;
}

export async function checkIpAbuse(ip: string | null, windowMs = 24 * 60 * 60 * 1000, maxPerWindow = 5) {
  if (!ip) return false;
  try {
    const since = new Date(Date.now() - windowMs);
    const events = await prisma.analyticsEvent.count({ where: { ip, createdAt: { gte: since } } });
    return events >= maxPerWindow;
  } catch (e) {
    console.error('checkIpAbuse error', e);
    return false;
  }
}

export async function logEvent(event: string, userId?: string | null, ip?: string | null, meta?: any) {
  try {
    await prisma.analyticsEvent.create({ data: { event, userId, ip, meta: meta ? JSON.stringify(meta) : undefined } });
  } catch (e) {
    console.error('logEvent error', e);
  }
}
