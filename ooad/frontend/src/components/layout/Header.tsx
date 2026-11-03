import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, User, LogOut, Menu, X, ShieldAlert, Wrench, Car } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { formatTime } from '@/lib/utils'

interface HeaderProps {
  onToggleSidebar?: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3 h-3" /> Admin
          </span>
        )
      case 'mechanic':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Wrench className="w-3 h-3" /> Mechanic
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Car className="w-3 h-3" /> Customer
          </span>
        )
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2D5A3D] text-white shadow-sm font-black text-lg">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Auto<span className="text-[#2D5A3D]">Care</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  setShowProfileMenu(false)
                }}
                className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 transition"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-gray-200 bg-white shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <h4 className="font-semibold text-sm text-gray-900">Notifications</h4>
                    <span className="text-xs text-gray-500">{unreadCount} unread</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No notifications yet.</div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.is_read) markAsRead(n.id)
                            setShowNotifications(false)
                            if (n.link) navigate(n.link)
                          }}
                          className={`p-3 text-left hover:bg-gray-50 cursor-pointer transition ${
                            !n.is_read ? 'bg-[#e8f0eb]/30' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                            <span className="text-[10px] text-gray-400">{formatTime(n.created_at)}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100 text-center">
                    <Link
                      to={
                        user.role === 'admin'
                          ? '/admin/notifications'
                          : user.role === 'mechanic'
                          ? '/mechanic/schedule'
                          : '/customer/notifications'
                      }
                      onClick={() => setShowNotifications(false)}
                      className="text-xs font-medium text-[#2D5A3D] hover:underline"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu)
                  setShowNotifications(false)
                }}
                className="flex items-center gap-2.5 rounded-full p-1 pl-2 hover:bg-gray-100 transition"
              >
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-gray-900 leading-tight">{user.name}</span>
                  <span className="text-[10px] text-gray-500 capitalize">{user.role}</span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2D5A3D] text-white font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200 bg-white shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-semibold text-sm text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <div className="mt-2">{getRoleBadge()}</div>
                  </div>

                  <div className="py-1">
                    {user.role === 'customer' && (
                      <Link
                        to="/customer/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        My Profile
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false)
                        handleLogout()
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-[#2D5A3D] hover:bg-[#1e3f2b] rounded-lg transition"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
