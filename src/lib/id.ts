/** Stable id generation. Uses the platform UUID where available. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for very old runtimes (should not happen on modern browsers/node).
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

/**
 * Deterministic id from a seed string, formatted as a UUID (8-4-4-4-12 hex, so
 * Postgres `uuid` columns accept it). The SAME seed always yields the SAME id.
 *
 * Use this for records that must be unique-per-user regardless of which device
 * creates them — seeded defaults (the starter habits) and singletons
 * (game_state, user_settings). Two devices computing the same id means the sync
 * upsert MERGES them instead of creating duplicates. Never use it for
 * user-created records (tasks, custom habits) — those must be unique per create.
 *
 * It is not cryptographic; it just needs to be stable and well-distributed
 * across LifeOS's tiny per-user namespaces.
 */
export function deterministicId(seed: string): string {
  let h1 = (0x9e3779b1 ^ seed.length) >>> 0;
  let h2 = 0x85ebca77;
  let h3 = 0xc2b2ae3d;
  let h4 = 0x27d4eb2f;
  for (let i = 0; i < seed.length; i++) {
    const k = seed.charCodeAt(i);
    h1 = (Math.imul(h1 ^ k, 0x85ebca77) >>> 0);
    h2 = (Math.imul(h2 ^ (k + 1), 0xc2b2ae3d) >>> 0);
    h3 = (Math.imul(h3 ^ (k + i), 0x27d4eb2f) >>> 0);
    h4 = (Math.imul(h4 ^ (k * 3 + 7), 0x9e3779b1) >>> 0);
    h1 = ((h1 << 13) | (h1 >>> 19)) >>> 0;
    h2 = ((h2 << 7) | (h2 >>> 25)) >>> 0;
    h3 = ((h3 << 17) | (h3 >>> 15)) >>> 0;
  }
  const lanes = [h1, h2, h3, h4];
  const hex = lanes.map((l) => (l >>> 0).toString(16).padStart(8, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
