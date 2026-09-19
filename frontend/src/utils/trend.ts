import type { TrendResponse, TrendAggPoint } from "@/api/dashboardApi";

export interface MonthPoint {
  key: string; // "2026-9", sortable
  label: string; // "Sep"
  income: number;
  expense: number;
  net: number;
}

function pointKey(p: TrendAggPoint) {
  return `${p._id.y}-${p._id.m}`;
}

/**
 * Merges the backend's separate expense/income trend arrays (which may not
 * share the same set of months) into one chronological series, so charts
 * don't have to reconcile two lists themselves.
 */
export function buildMonthlySeries(trend: TrendResponse): MonthPoint[] {
  const map = new Map<string, MonthPoint>();

  const ensure = (p: TrendAggPoint) => {
    const key = pointKey(p);
    if (!map.has(key)) {
      const label = new Date(p._id.y, p._id.m - 1, 1).toLocaleDateString(undefined, { month: "short" });
      map.set(key, { key, label, income: 0, expense: 0, net: 0 });
    }
    return map.get(key)!;
  };

  trend.incomeTrend.forEach((p) => {
    ensure(p).income = p.total;
  });
  trend.expenseTrend.forEach((p) => {
    ensure(p).expense = p.total;
  });

  const series = Array.from(map.values()).sort((a, b) => (a.key > b.key ? 1 : -1));
  series.forEach((pt) => (pt.net = pt.income - pt.expense));
  return series;
}

/** Percent change of the latest month's value vs the previous month's, or null if not computable. */
export function monthOverMonthChange(series: MonthPoint[], field: "net" | "income" | "expense" = "net"): number | null {
  if (series.length < 2) return null;
  const curr = series[series.length - 1][field];
  const prev = series[series.length - 2][field];
  if (prev === 0) return curr === 0 ? 0 : null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}
