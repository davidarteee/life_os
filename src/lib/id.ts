/** Stable id generation. Uses the platform UUID where available. */
export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for very old runtimes (should not happen on modern browsers/node).
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}
