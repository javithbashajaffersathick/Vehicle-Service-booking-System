import React from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Clock, CheckCircle2, AlertTriangle, AlertCircle, Info, ExternalLink } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import PageHeader from '@/components/common/PageHeader'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import EmptyState from '@/components/common/EmptyState'

export const AdminNotifications: React.FC = () => {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications()

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Administrative Alerts & Logs"
        description="Real-time alerts regarding low inventory levels, customer bookings, and floor updates"
        action={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              leftIcon={<CheckCheck className="w-4 h-4 text-[#2D5A3D]" />}
            >
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingSpinner text="Fetching administrative alerts..." className="py-20" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8" />}
          title="No operational alerts"
          description="All inventory, appointments, and mechanical tasks are up to date."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`transition hover:shadow-xs border ${
                !n.is_read ? 'bg-[#e8f0eb]/30 border-[#2D5A3D]/40' : 'bg-white border-gray-200'
              }`}
            >
              <CardContent className="p-4 sm:p-5 flex items-start gap-4">
                <div className="mt-0.5 shrink-0">{getNotificationIcon(n.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-gray-900">{n.title}</h4>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDateTime(n.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{n.message}</p>

                  <div className="pt-2 flex items-center gap-3">
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        className="text-xs font-semibold text-[#2D5A3D] hover:underline inline-flex items-center gap-1"
                      >
                        Inspect Resource <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-xs text-gray-400 hover:text-gray-700 transition"
                      >
                        Dismiss alert
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminNotifications
