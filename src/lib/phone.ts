export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function formatPhoneDisplay(raw: string): string {
  const digits = normalizePhone(raw);
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw.trim();
}
