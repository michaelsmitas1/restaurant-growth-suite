/**
 * Normaliza telefone para um formato E.164-like consistente, usado como
 * chave de busca em customers.phone (único global) e otp_codes.phone.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (input.trim().startsWith('+')) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return `+${digits}`;
}
