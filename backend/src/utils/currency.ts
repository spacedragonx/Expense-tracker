/**
 * Currency conversion helper: fetches a live mid-market rate and falls back
 * to a fixed table if the live lookup fails (network issue, API down, etc.)
 * so a currency switch never hard-fails the request outright.
 *
 * Live source: https://www.exchangerate-api.com/ open endpoint (open.er-api.com),
 * no API key required, updated roughly every 24h.
 */

export type SupportedCurrency = "INR" | "EUR" | "USD";

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = ["INR", "EUR", "USD"];

// Fixed fallback table (approximate mid-market rates), only used if the live
// API call fails. Not kept in sync automatically — good enough as a
// last-resort so currency switching still works offline / if the API is down.
const FALLBACK_RATES: Record<SupportedCurrency, Record<SupportedCurrency, number>> = {
  USD: { USD: 1, INR: 95.6, EUR: 0.864 },
  EUR: { EUR: 1, USD: 1.157, INR: 110.6 },
  INR: { INR: 1, USD: 1 / 95.6, EUR: 1 / 110.6 },
};

export async function getExchangeRate(from: SupportedCurrency, to: SupportedCurrency): Promise<number> {
  if (from === to) return 1;

  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    if (!response.ok) {
      throw new Error(`Exchange rate API responded with status ${response.status}`);
    }
    const data = (await response.json()) as { result: string; rates?: Record<string, number> };
    const rate = data.rates?.[to];
    if (data.result !== "success" || typeof rate !== "number") {
      throw new Error("Exchange rate API response missing expected rate");
    }
    return rate;
  } catch (err) {
    console.warn(`Live exchange rate fetch failed (${from} -> ${to}), using fallback table:`, err);
    return FALLBACK_RATES[from][to];
  }
}
