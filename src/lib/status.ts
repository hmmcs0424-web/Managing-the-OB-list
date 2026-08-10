export const CALL_STATUSES = ["ACCEPTED", "REJECTED", "NO_ANSWER", "PENDING"] as const;
export type CallStatus = (typeof CALL_STATUSES)[number];
export const ENTRY_CALL_STATUSES = ["ACCEPTED", "REJECTED", "NO_ANSWER"] as const;

export const STATUS_LABELS: Record<CallStatus, string> = {
  ACCEPTED: "긍정",
  REJECTED: "거절",
  NO_ANSWER: "부재",
  PENDING: "보류",
};

export const STATUS_COLORS: Record<CallStatus, string> = {
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  NO_ANSWER: "bg-amber-100 text-amber-700",
  PENDING: "bg-slate-100 text-slate-700",
};

export function isCallStatus(value: string): value is CallStatus {
  return (CALL_STATUSES as readonly string[]).includes(value);
}
