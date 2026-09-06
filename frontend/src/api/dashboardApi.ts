import apiClient from "./axiosClient";
import type { DashboardSummary } from "@/types";

/** Flat per-category total; backend does not compute a percent, so callers derive it from the sum. */
export interface SpendingByCategoryItem {
  category: string;
  color?: string;
  total: number;
}

/** Raw aggregation point as Mongo returns it: `_id` is a {year, month} bucket key. */
export interface TrendAggPoint {
  _id: { y: number; m: number };
  total: number;
}

export interface TrendResponse {
  expenseTrend: TrendAggPoint[];
  incomeTrend: TrendAggPoint[];
}

export const dashboardApi = {
  summary: () => apiClient.get<{ success: boolean; data: DashboardSummary }>("/dashboard/summary"),

  /** `from`/`to` are ISO date strings (inclusive range) — the backend has no month/year params. */
  spendingByCategory: (params?: { from?: string; to?: string }) =>
    apiClient.get<{ success: boolean; data: SpendingByCategoryItem[] }>("/dashboard/spending-by-category", {
      params,
    }),

  trend: (params?: { months?: number }) =>
    apiClient.get<{ success: boolean; data: TrendResponse }>("/dashboard/trend", { params }),
};

export default dashboardApi;
