import apiClient from "./axiosClient";
import type { User } from "@/types";

export const authApi = {
  register: (payload: { name: string; email: string; password: string }) =>
    apiClient.post<{ success: boolean; data: User }>("/auth/register", payload),

  login: (payload: { email: string; password: string }) =>
    apiClient.post<{ success: boolean; data: User }>("/auth/login", payload),

  logout: () => apiClient.post("/auth/logout"),

  me: () => apiClient.get<{ success: boolean; data: User }>("/auth/me"),

  updateProfile: (payload: Partial<Pick<User, "name" | "avatarUrl" | "currency" | "theme">>) =>
    apiClient.put<{ success: boolean; data: User }>("/auth/me", payload),

  /** Switches the account's currency and converts every stored amount using a live exchange rate. */
  changeCurrency: (currency: "INR" | "EUR" | "USD") =>
    apiClient.put<{
      success: boolean;
      data: User;
      rate: number;
      from: string;
      to: string;
      converted: boolean;
      counts?: { expenses: number; income: number; budgets: number; goals: number };
    }>("/auth/currency", { currency }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.put("/auth/change-password", payload),

  forgotPassword: (email: string) => apiClient.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post(`/auth/reset-password/${token}`, { password }),
};

export default authApi;
