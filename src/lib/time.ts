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

export function kstDateKey(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function currentKstMonthRange(): { from: string; to: string } {
  const now = new Date(Date.now() + KST_OFFSET_MS);
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}
