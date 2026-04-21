import apiClient from './client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: number; // 0: System, 1: Inventory, 2: Info
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationSummary {
  unreadCount: number;
}

export const notificationApi = {
  getNotifications: async (limit: number = 20) => {
    const response = await apiClient.get<Notification[]>('/Notifications', { params: { limit } });
    return response.data;
  },
  getSummary: async () => {
    const response = await apiClient.get<NotificationSummary>('/Notifications/summary');
    return response.data;
  },
  markAsRead: async (id: string) => {
    await apiClient.post(`/Notifications/${id}/read`);
  },
  markAllAsRead: async () => {
    await apiClient.post('/Notifications/read-all');
  },
  delete: async (id: string) => {
    await apiClient.delete(`/Notifications/${id}`);
  },
  sendTest: async () => {
    await apiClient.post('/Notifications/test');
  }
};
