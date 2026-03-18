/**
 * Session-based shuffle for featured/boosted listings.
 * 
 * Uses a per-session seed so each visitor sees a different order,
 * but the order stays consistent within the same session (tab).
 * This ensures fair rotation across agencies — no fixed "top slots."
 */

let sessionSeed: number | null = null;

function getSessionSeed(): number {
  if (sessionSeed === null) {
    sessionSeed = Math.random();
  }
  return sessionSeed;
}

/**
 * Deterministic shuffle using the session seed.
 * Same seed → same order within a session.
 * Different session → different order.
 */
export function shuffleFeatured<T>(items: T[]): T[] {
  if (items.length <= 1) return items;

  const seed = getSessionSeed();
  const shuffled = [...items];

  // Seeded Fisher-Yates shuffle
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Simple seeded PRNG (mulberry32-ish)
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
