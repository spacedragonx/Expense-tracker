import apiClient from "./axiosClient";
import type { Goal } from "@/types";

export type GoalPayload = {
  title: string;
  targetAmount: number;
  deadline?: string;
  icon?: string;
};

export const goalApi = {
  list: () => apiClient.get<{ success: boolean; data: Goal[] }>("/goals"),

  create: (payload: GoalPayload) =>
    apiClient.post<{ success: boolean; data: Goal }>("/goals", payload),

  update: (id: string, payload: Partial<GoalPayload>) =>
    apiClient.put<{ success: boolean; data: Goal }>(`/goals/${id}`, payload),

  contribute: (id: string, amount: number) =>
    apiClient.post<{ success: boolean; data: Goal }>(`/goals/${id}/contribute`, { amount }),

  remove: (id: string) => apiClient.delete(`/goals/${id}`),
};

export default goalApi;
