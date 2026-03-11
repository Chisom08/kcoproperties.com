/**
 * Input validation helpers to ensure number inputs only accept numbers
 * and text inputs only accept text (not pure numbers)
 */

/**
 * Filters input to only allow numeric characters (0-9)
 * Optionally allows decimal point and comma for monetary values
 */
export function allowOnlyNumbers(
  value: string,
  allowDecimal: boolean = false
): string {
  if (allowDecimal) {
    // Allow digits, one decimal point, and commas
    return value.replace(/[^\d.,]/g, "").replace(/,/g, "");
  }
  // Only allow digits
  return value.replace(/\D/g, "");
}

/**
 * Filters input to allow text characters (letters, numbers, spaces, hyphens, apostrophes, etc.)
 * This is used for addresses, names, and other text fields that may contain alphanumeric content
 * The key difference from number inputs is that this allows mixed content
 */
export function allowOnlyText(value: string): string {
  // Allow letters, numbers, spaces, and common punctuation for addresses/names
  // This allows "123 Main St", "John O'Brien", "St. Louis", etc.
  return value.replace(/[^a-zA-Z0-9\s\-'.,#]/g, "");
}

/**
 * Handles onChange for number inputs - only allows numeric input
 */
export function handleNumberInput(
  e: React.ChangeEvent<HTMLInputElement>,
  allowDecimal: boolean = false
): string {
  return allowOnlyNumbers(e.target.value, allowDecimal);
}

/**
 * Handles onChange for text inputs - only allows text input
 */
export function handleTextInput(
  e: React.ChangeEvent<HTMLInputElement>
): string {
  return allowOnlyText(e.target.value);
}

/**
 * Validates SSN input - only allows digits and hyphens in correct format
 */
export function formatSSN(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, "").slice(0, 9);
  
  if (digits.length === 0) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

/**
 * Validates zip code - only allows digits (5 or 9 digits)
 */
export function formatZipCode(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/**
 * Validates monetary input - allows digits and one decimal point
 */
export function formatMoney(value: string): string {
  // Remove all non-digit and non-decimal characters
  let cleaned = value.replace(/[^\d.]/g, "");
  
  // Only allow one decimal point
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  
  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + "." + parts[1].slice(0, 2);
  }
  
  return cleaned;
}

/**
 * Validates year input - only allows 4 digits
 */
export function formatYear(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

