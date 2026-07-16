/**
 * Normalize a Brazilian phone number to E.164 (+55DDXXXXXXXXX).
 * Returns null when the input can't plausibly be a BR mobile/landline number.
 */
export function normalizeBrPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
  if (local.length < 10 || local.length > 11) return null;
  return `+55${local}`;
}
