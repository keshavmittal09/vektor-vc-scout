/**
 * Simple in-memory sliding-window rate limiter.
 * Limits requests per IP per time window.
 *
 * Usage:
 *   const limiter = rateLimit({ windowMs: 60000, max: 5 });
 *   // In handler:
 *   const result = limiter.check(ip);
 *   if (!result.ok) return res.status(429).json({ error: result.message });
 */

const store = new Map();

// Clean up expired entries every 2 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        entry.timestamps = entry.timestamps.filter(t => now - t < 120000);
        if (entry.timestamps.length === 0) store.delete(key);
    }
}, 120000);

export default function rateLimit({ windowMs = 60000, max = 5 } = {}) {
    return {
        check(ip) {
            const now = Date.now();
            const key = ip || "unknown";

            if (!store.has(key)) {
                store.set(key, { timestamps: [now] });
                return { ok: true, remaining: max - 1 };
            }

            const entry = store.get(key);
            // Keep only timestamps within the window
            entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

            if (entry.timestamps.length >= max) {
                const oldestInWindow = Math.min(...entry.timestamps);
                const retryAfter = Math.ceil((oldestInWindow + windowMs - now) / 1000);
                return {
                    ok: false,
                    remaining: 0,
                    retryAfter,
                    message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
                };
            }

            entry.timestamps.push(now);
            return { ok: true, remaining: max - entry.timestamps.length };
        },
    };
}
