/** Normalize Nigerian phone to E.164 (+234...) */
export function normalizePhoneE164(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith("7")) {
    return `+234${digits}`;
  }
  return null;
}
