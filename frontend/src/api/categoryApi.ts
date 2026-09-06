import apiClient from "./axiosClient";
import type { Category, CategoryKind } from "@/types";

export type CategoryPayload = {
  name: string;
  kind: CategoryKind;
  icon?: string;
  color?: string;
};

export const categoryApi = {
  list: (kind?: CategoryKind) =>
    apiClient.get<{ success: boolean; data: Category[] }>("/categories", {
      params: kind ? { kind } : undefined,
    }),

  create: (payload: CategoryPayload) =>
    apiClient.post<{ success: boolean; data: Category }>("/categories", payload),

  update: (id: string, payload: Partial<CategoryPayload>) =>
    apiClient.put<{ success: boolean; data: Category }>(`/categories/${id}`, payload),

  remove: (id: string) => apiClient.delete(`/categories/${id}`),
};

export default categoryApi;
