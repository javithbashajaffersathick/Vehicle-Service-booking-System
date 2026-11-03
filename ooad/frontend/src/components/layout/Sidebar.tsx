import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Car,
  CalendarPlus,
  Wrench,
  History,
  FileText,
  Bell,
  User,
  Users,
  Package,
  BarChart3,
  CalendarCheck,
  Briefcase,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth()

  const customerItems: NavItem[] = [
    { label: 'Dashboard', href: '/customer/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'My Vehicles', href: '/customer/vehicles', icon: <Car className="w-5 h-5" /> },
    { label: 'Book Service', href: '/customer/book', icon: <CalendarPlus className="w-5 h-5" /> },
    { label: 'Service Catalog', href: '/customer/services', icon: <Wrench className="w-5 h-5" /> },
    { label: 'Booking History', href: '/customer/bookings', icon: <History className="w-5 h-5" /> },
    { label: 'Invoices & Payments', href: '/customer/invoices', icon: <FileText className="w-5 h-5" /> },
    { label: 'Notifications', href: '/customer/notifications', icon: <Bell className="w-5 h-5" /> },
    { label: 'My Profile', href: '/customer/profile', icon: <User className="w-5 h-5" /> },
  ]

  const adminItems: NavItem[] = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Bookings', href: '/admin/bookings', icon: <CalendarCheck className="w-5 h-5" /> },
    { label: 'Customers', href: '/admin/customers', icon: <Users className="w-5 h-5" /> },
    { label: 'Mechanics', href: '/admin/mechanics', icon: <Wrench className="w-5 h-5" /> },
    { label: 'Services', href: '/admin/services', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Spare Parts', href: '/admin/inventory', icon: <Package className="w-5 h-5" /> },
    { label: 'Invoices', href: '/admin/invoices', icon: <FileText className="w-5 h-5" /> },
    { label: 'Reports & Analytics', href: '/admin/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { label: 'Notifications', href: '/admin/notifications', icon: <Bell className="w-5 h-5" /> },
  ]

  const mechanicItems: NavItem[] = [
    { label: 'Assigned Jobs', href: '/mechanic/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Job Schedule', href: '/mechanic/schedule', icon: <CalendarCheck className="w-5 h-5" /> },
    { label: 'Parts Used', href: '/mechanic/parts', icon: <Package className="w-5 h-5" /> },
    { label: 'Service History', href: '/mechanic/history', icon: <History className="w-5 h-5" /> },
  ]

  let items = customerItems
  if (user?.role === 'admin') items = adminItems
  if (user?.role === 'mechanic') items = mechanicItems

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white pt-16 transition-transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 lg:hidden">
          <span className="font-bold text-gray-900">Navigation</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onClose()
                }
              }}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#2D5A3D] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-[#e8f0eb] hover:text-[#2D5A3D]'
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User quick card in bottom of sidebar */}
        <div className="border-t border-gray-100 p-4 m-2 rounded-2xl bg-[#f8faf9]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2D5A3D] text-white font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="truncate text-xs text-gray-500 capitalize">{user?.role} Portal</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
