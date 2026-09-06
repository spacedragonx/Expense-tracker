import apiClient from "./axiosClient";
import type { Budget, Category } from "@/types";

export type BudgetPayload = {
  month: number;
  year: number;
  totalLimit: number;
  categoryLimits?: { category: string; limit: number }[];
  alertThresholdPercent?: number;
};

export interface BudgetCategoryBreakdown {
  category: Category | string;
  limit: number;
  spent: number;
}

/**
 * Shape returned by GET /budgets/:year/:month. The backend aggregates actual
 * spend for the period alongside the budget document itself, so callers get
 * usage figures without a second round trip.
 */
export interface BudgetSummary {
  budget: Budget;
  totalSpent: number;
  totalRemaining: number;
  usedPercent: number;
  categoryBreakdown: BudgetCategoryBreakdown[];
}

export const budgetApi = {
  // Backend keys budgets by calendar month/year rather than an :id in the
  // GET path. Note: if no budget exists for the period this throws a 404
  // (not a null body) — callers should catch and treat that as "unset".
  getForMonth: (year: number, month: number) =>
    apiClient.get<{ success: boolean; data: BudgetSummary }>(`/budgets/${year}/${month}`),

  upsert: (payload: BudgetPayload) =>
    apiClient.post<{ success: boolean; data: Budget }>("/budgets", payload),

  remove: (id: string) => apiClient.delete(`/budgets/${id}`),
};

export default budgetApi;
