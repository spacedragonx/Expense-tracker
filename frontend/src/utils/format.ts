/** Shared formatting helpers used across pages. */

export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** yyyy-MM-dd, for <input type="date"> values. */
export function toDateInputValue(date: string | Date) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

/** "January 2026" from a 1-12 month number and a year. */
export function formatMonthYear(month: number, year: number) {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}
