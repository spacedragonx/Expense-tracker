import apiClient from "./axiosClient";
import type { Notification } from "@/types";

export const notificationApi = {
  list: () => apiClient.get<{ success: boolean; data: Notification[] }>("/notifications"),

  markAsRead: (id: string) => apiClient.put<{ success: boolean; data: Notification }>(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.put("/notifications/read-all"),

  remove: (id: string) => apiClient.delete(`/notifications/${id}`),
};

export default notificationApi;
