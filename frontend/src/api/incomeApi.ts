import apiClient from "./axiosClient";
import type { Income, IncomeSource, Paginated } from "@/types";

export interface IncomeQuery {
  page?: number;
  limit?: number;
  source?: string;
  from?: string;
  to?: string;
  sort?: string;
}

export type IncomePayload = {
  title: string;
  amount: number;
  date?: string;
  source: IncomeSource;
  notes?: string;
};

export const incomeApi = {
  list: (params?: IncomeQuery) =>
    apiClient.get<{ success: boolean } & Paginated<Income>>("/income", { params }),

  getById: (id: string) => apiClient.get<{ success: boolean; data: Income }>(`/income/${id}`),

  create: (payload: IncomePayload) =>
    apiClient.post<{ success: boolean; data: Income }>("/income", payload),

  update: (id: string, payload: Partial<IncomePayload>) =>
    apiClient.put<{ success: boolean; data: Income }>(`/income/${id}`, payload),

  remove: (id: string) => apiClient.delete(`/income/${id}`),
};

export default incomeApi;
