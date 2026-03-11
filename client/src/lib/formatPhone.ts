/**
 * formatPhone
 * Strips all non-digit characters from the input, then formats up to 10 digits
 * as a US phone number in the (555) 000-0000 pattern.
 *
 * Examples:
 *   "5551234567"    → "(555) 123-4567"
 *   "555123"        → "(555) 123"
 *   "555"           → "(555)"
 *   "(555) 123-456" → "(555) 123-456"   (idempotent on already-formatted input)
 */
export function formatPhone(value: string): string {
  // Keep only digits, truncate to 10
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

