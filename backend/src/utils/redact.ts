/**
 * redact.ts — strip sensitive financial identifiers from extracted PDF text
 * BEFORE it is sent to any external LLM service.
 *
 * Kept: merchant names, UPI handles (user@bank), general amounts, dates.
 * Removed: account numbers, IFSC codes, card numbers, phone numbers, sort
 *   codes, IBAN-style strings, and other PII number sequences.
 */

const PATTERNS: { label: string; re: RegExp }[] = [
  // IFSC codes: 4 alpha + 0 + 6 alphanumeric  e.g. HDFC0001234
  { label: "ifsc", re: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g },

  // Indian bank account numbers (9–18 digits, standalone)
  { label: "account_number", re: /\b\d{9,18}\b/g },

  // Indian mobile numbers — 10 digits starting with 6-9, with optional +91
  { label: "phone", re: /(?:\+91[-\s]?)?[6-9]\d{9}\b/g },

  // PAN card: 5 alpha + 4 digits + 1 alpha
  { label: "pan", re: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g },

  // Credit/debit card numbers (groups of 4 digits, 13-19 digits total)
  {
    label: "card_number",
    re: /\b(?:\d{4}[-\s]?){3}\d{1,4}\b/g,
  },

  // IBAN-style (2 alpha + 2 digits + up to 30 alphanumeric)
  { label: "iban", re: /\b[A-Z]{2}\d{2}[A-Z0-9]{4,30}\b/g },
];

/**
 * Returns a redacted copy of `text`.  Each sensitive token is replaced with
 * a stable placeholder like [ACCOUNT] so the LLM still sees the structure.
 */
export function redactSensitiveData(text: string): string {
  let result = text;
  for (const { label, re } of PATTERNS) {
    const placeholder = `[${label.toUpperCase()}]`;
    result = result.replace(re, placeholder);
  }
  return result;
}
