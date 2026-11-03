import { useState, useEffect, useCallback } from 'react'
import type { Notification } from '@/types'
import { notificationService } from '@/services/notifications'
import { useAuth } from './useAuth'

export function useNotifications(pollIntervalMs = 30000) {
  const { isAuthenticated } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      setIsLoading(true)
      const data = await notificationService.getNotifications()
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
      setError(null)
    } catch (err: any) {
      console.error('Failed to load notifications:', err)
      setError('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchNotifications()

    if (!isAuthenticated || pollIntervalMs <= 0) return
    const interval = setInterval(fetchNotifications, pollIntervalMs)
    return () => clearInterval(interval)
  }, [fetchNotifications, isAuthenticated, pollIntervalMs])

  const markAsRead = async (id: number | string) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}

export default useNotifications
