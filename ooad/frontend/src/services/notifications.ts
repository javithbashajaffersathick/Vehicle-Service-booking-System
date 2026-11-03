import api from './api'
import type { Notification } from '@/types'

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<Notification[]>('/notifications')
    return response.data
  },

  async markAsRead(id: number | string): Promise<Notification> {
    const response = await api.put<Notification>(`/notifications/${id}/read`)
    return response.data
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all')
  },
}

export default notificationService
