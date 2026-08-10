const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Start of "today" in KST, returned as the equivalent UTC instant — safe to use
 * in DB comparisons regardless of the server process's own timezone (Vercel runs UTC). */
export function kstStartOfToday(): Date {
  const kstNow = new Date(Date.now() + KST_OFFSET_MS);
  const y = kstNow.getUTCFullYear();
  const m = kstNow.getUTCMonth();
  const d = kstNow.getUTCDate();
  return new Date(Date.UTC(y, m, d, 0, 0, 0) - KST_OFFSET_MS);
}

/** Hour-of-day (0-23) for a given instant, interpreted in KST. */
export function kstHour(date: Date): number {
  return new Date(date.getTime() + KST_OFFSET_MS).getUTCHours();
}
